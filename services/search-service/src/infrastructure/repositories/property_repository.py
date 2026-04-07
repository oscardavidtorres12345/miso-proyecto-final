import math
from datetime import date, timedelta
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.property import Property
from src.domain.models.room import Room
from src.domain.models.inventory import Inventory
from src.domain.models.rate import Rate
from src.domain.models.review import Review
from src.domain.schemas.search import (
    AccommodationPrice,
    AccommodationRating,
    AmenityItem,
    FilterOption,
    FiltersResponse,
    PropertyResult,
    SearchRequest,
    SearchResponse,
)

# Meal plan slugs that imply breakfast is included
_BREAKFAST_SLUGS = {"breakfast", "buffet", "allinclusive"}


def _date_range(check_in: date, check_out: date) -> List[date]:
    """Returns list of dates [check_in, check_out) — nights of the stay."""
    days = (check_out - check_in).days
    return [check_in + timedelta(days=i) for i in range(days)]


class PropertyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def search(self, req: SearchRequest) -> SearchResponse:
        nights = (req.check_out - req.check_in).days
        guests = req.adults + req.children

        # ---------------------------------------------------------------
        # 1. Subquery: rooms available for ALL nights in the range
        #    PF-282: uses BETWEEN (date range) instead of IN(list) to
        #    leverage the composite index (room_id, date) on inventory.
        # ---------------------------------------------------------------
        avail_subq = (
            select(Inventory.room_id)
            .where(
                Inventory.date >= req.check_in,
                Inventory.date < req.check_out,         # exclusive upper bound
                (Inventory.total_quantity - Inventory.confirmed_quantity) >= req.rooms,
            )
            .group_by(Inventory.room_id)
            .having(func.count(Inventory.date) >= nights)
            .scalar_subquery()
        )

        # ---------------------------------------------------------------
        # 2. Subquery: average nightly rate — only for available rooms
        #    PF-282: BETWEEN on rate + prior filter on avail_subq drastically
        #    reduces rows scanned with large catalogs.
        # ---------------------------------------------------------------
        rate_subq = (
            select(
                Rate.room_id,
                func.avg(Rate.amount).label("avg_amount"),
                func.min(Rate.currency).label("currency"),
            )
            .where(
                Rate.date >= req.check_in,
                Rate.date < req.check_out,
                Rate.room_id.in_(avail_subq),
            )
            .group_by(Rate.room_id)
            .subquery()
        )

        # ---------------------------------------------------------------
        # 3. Available rooms with sufficient capacity and lowest price
        # ---------------------------------------------------------------
        room_subq = (
            select(
                Room.property_id,
                func.min(rate_subq.c.avg_amount).label("price_per_night"),
                func.min(rate_subq.c.currency).label("currency"),
            )
            .join(rate_subq, Room.id == rate_subq.c.room_id)
            .where(
                Room.id.in_(avail_subq),
                Room.max_capacity >= guests,
            )
            .group_by(Room.property_id)
            .subquery()
        )

        # ---------------------------------------------------------------
        # 4. Average rating — PF-282: filtered to the subset of properties
        #    with available rooms to reduce the scan.
        # ---------------------------------------------------------------
        rating_subq = (
            select(
                Review.property_id,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("review_count"),
            )
            .where(Review.property_id.in_(select(room_subq.c.property_id)))
            .group_by(Review.property_id)
            .subquery()
        )

        # ---------------------------------------------------------------
        # 5. Main query on Property with JOINs to room_subq and rating_subq
        # ---------------------------------------------------------------
        stmt = (
            select(
                Property,
                room_subq.c.price_per_night,
                room_subq.c.currency,
                rating_subq.c.avg_rating,
                rating_subq.c.review_count,
            )
            .join(room_subq, Property.id == room_subq.c.property_id)
            .outerjoin(rating_subq, Property.id == rating_subq.c.property_id)
            .where(
                Property.location.ilike(f"%{req.destination}%"),
            )
        )

        # HU023 PF-284: Partition pruning — when country is specified, PostgreSQL
        # accesses ONLY the relevant shard (e.g. property_co for 'CO').
        # Without this filter the planner scans all partitions even when
        # GIN/trigram indexes are used in each one.
        if req.country:
            stmt = stmt.where(Property.country == req.country.upper())

        # Optional filters on Property
        if req.pets:
            stmt = stmt.where(Property.pets_allowed.is_(True))
        if req.accommodation_type:
            stmt = stmt.where(Property.accommodation_type.in_(req.accommodation_type))
        if req.stars:
            stmt = stmt.where(Property.stars.in_(req.stars))
        if req.meal_plan:
            stmt = stmt.where(Property.meal_plan == req.meal_plan)
        if req.amenities:
            for amenity in req.amenities:
                stmt = stmt.where(Property.amenities.contains([amenity]))

        # Price filters — compare against total stay price (taxes included),
        # consistent with what AccommodationPrice.amount shows in the response.
        # total = price_per_night * nights * (1 + tax_rate)
        if req.price_min is not None or req.price_max is not None:
            total_price_expr = (
                room_subq.c.price_per_night * nights * (1 + Property.tax_rate)
            )
            if req.price_min is not None:
                stmt = stmt.where(total_price_expr >= req.price_min)
            if req.price_max is not None:
                stmt = stmt.where(total_price_expr <= req.price_max)

        # Order by rating desc, then price asc
        stmt = stmt.order_by(
            rating_subq.c.avg_rating.desc().nulls_last(),
            room_subq.c.price_per_night.asc(),
        )

        # ---------------------------------------------------------------
        # 6. Pagination: total count + slice
        # ---------------------------------------------------------------
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        offset = (req.page - 1) * req.page_size
        stmt = stmt.offset(offset).limit(req.page_size)
        rows = await self.session.execute(stmt)
        rows = rows.all()

        # ---------------------------------------------------------------
        # 7. Build PropertyResult for each row
        # ---------------------------------------------------------------
        results: List[PropertyResult] = []
        for prop, price_per_night, currency, avg_rating, review_count in rows:
            price_per_night = price_per_night or 0.0
            total_price = round(
                price_per_night * nights * (1 + prop.tax_rate), 2
            )
            meal_slug = prop.meal_plan.value if prop.meal_plan else "none"
            results.append(
                PropertyResult(
                    id=prop.id,
                    name=prop.name,
                    image=prop.image_url,
                    distance_from_center=prop.distance_to_center_km,
                    stars=prop.stars,
                    rating=AccommodationRating(
                        score=round(avg_rating, 1) if avg_rating else None,
                        review_count=review_count or 0,
                    ),
                    amenities=[
                        AmenityItem(id=a) for a in (prop.amenities or [])
                    ],
                    has_breakfast=meal_slug in _BREAKFAST_SLUGS,
                    price=AccommodationPrice(
                        amount=total_price,
                        currency=currency or "COP",
                        nights=nights,
                        adults=req.adults,
                        includes_taxes=True,
                    ),
                )
            )

        total_pages = math.ceil(total / req.page_size) if req.page_size else 1
        return SearchResponse(
            results=results,
            total=total,
            page=req.page,
            page_size=req.page_size,
            total_pages=total_pages,
        )

    async def get_available_filters(self, req: SearchRequest) -> FiltersResponse:
        """
        Returns only the filter options that are actually present in the
        available properties for the given search parameters.

        Reuses the same availability subqueries as search() so the filters
        are consistent with what the user would actually see in results.
        Meal plan 'none' is excluded — it is not a meaningful filter option.
        """
        nights = (req.check_out - req.check_in).days
        guests = req.adults + req.children

        # ── Same availability subqueries as search() ──────────────────────
        avail_subq = (
            select(Inventory.room_id)
            .where(
                Inventory.date >= req.check_in,
                Inventory.date < req.check_out,
                (Inventory.total_quantity - Inventory.confirmed_quantity) >= req.rooms,
            )
            .group_by(Inventory.room_id)
            .having(func.count(Inventory.date) >= nights)
            .scalar_subquery()
        )

        rate_subq = (
            select(Rate.room_id)
            .where(
                Rate.date >= req.check_in,
                Rate.date < req.check_out,
                Rate.room_id.in_(avail_subq),
            )
            .group_by(Rate.room_id)
            .subquery()
        )

        room_subq = (
            select(Room.property_id)
            .join(rate_subq, Room.id == rate_subq.c.room_id)
            .where(
                Room.id.in_(avail_subq),
                Room.max_capacity >= guests,
            )
            .group_by(Room.property_id)
            .subquery()
        )

        # ── Only the columns needed for filter aggregation ────────────────
        stmt = (
            select(
                Property.accommodation_type,
                Property.stars,
                Property.meal_plan,
                Property.amenities,
            )
            .join(room_subq, Property.id == room_subq.c.property_id)
            .where(Property.location.ilike(f"%{req.destination}%"))
        )

        if req.country:
            stmt = stmt.where(Property.country == req.country.upper())

        rows = (await self.session.execute(stmt)).all()

        # ── Aggregate distinct values from matching properties ────────────
        accommodation_types: set[str] = set()
        amenities_set: set[str] = set()
        meals: set[str] = set()
        stars_set: set[int] = set()

        for acc_type, stars, meal_plan, amenities in rows:
            if acc_type is not None:
                # acc_type may be an AccommodationType enum instance or a str
                accommodation_types.add(
                    acc_type.value if hasattr(acc_type, "value") else acc_type
                )
            if stars is not None:
                stars_set.add(stars)
            if meal_plan is not None:
                slug = meal_plan.value if hasattr(meal_plan, "value") else meal_plan
                if slug != "none":
                    meals.add(slug)
            for amenity in (amenities or []):
                amenities_set.add(amenity)

        return FiltersResponse(
            accommodation_types=[FilterOption(id=t) for t in sorted(accommodation_types)],
            services=[FilterOption(id=a) for a in sorted(amenities_set)],
            meals=[FilterOption(id=m) for m in sorted(meals)],
            stars=[FilterOption(id=str(s)) for s in sorted(stars_set, reverse=True)],
        )

