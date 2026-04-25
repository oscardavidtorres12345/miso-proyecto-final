"""
HotelRepository — consultas a DB CATALOG A para el detalle de hospedaje (HU004).
Usa los modelos ya definidos en el search-service (Property, Room, Rate, Review).
"""

from datetime import date
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.property import Property
from src.domain.models.room import Room
from src.domain.models.rate import Rate
from src.domain.models.review import Review
from src.domain.schemas.search import AmenityItem, AccommodationRating
from src.domain.schemas.hotel_detail import (
    CheckInSchedule,
    CheckOutSchedule,
    HotelDetailResponse,
    HotelPhoto,
    HotelSchedule,
    RoomBookingDetailResponse,
    RoomPrice,
    RoomResult,
    SuggestedRoom,
)

_DEFAULT_PHOTO = "https://picsum.photos/seed/{seed}/1200/600"
_DEFAULT_ROOM_IMG = "https://picsum.photos/seed/room{room_id}/600/400"
_COUNTRY_BY_CODE = {
    "CO": "Colombia",
    "AR": "Argentina",
    "US": "United States",
}


def _room_description(room: Room) -> str:
    """Descripción desde campos existentes si description es NULL."""
    if room.description:
        return room.description
    parts = []
    if room.bed_type:
        parts.append(f"Cama {room.bed_type}")
    if room.max_capacity:
        parts.append(f"Capacidad máxima: {room.max_capacity} persona(s).")
    return " ".join(parts) if parts else "Habitación estándar."


def _suggested_room(rooms: List[RoomResult], meal_plan: str) -> Optional[SuggestedRoom]:
    if not rooms:
        return None
    cheapest = min(rooms, key=lambda r: r.price.total_amount)
    return SuggestedRoom(
        name=cheapest.name,
        meal_plan=meal_plan,
        total_price=cheapest.price.total_amount,
        currency=cheapest.price.currency,
    )


def _meal_plan_label(meal_plan: str | None) -> str:
    labels = {
        "none": "Sin alimentación",
        "breakfast": "Desayuno incluido",
        "buffet": "Buffet incluido",
        "allinclusive": "Todo incluido",
    }
    if meal_plan is None:
        return labels["none"]
    return labels.get(meal_plan, meal_plan)


def _city_from_location(location: str | None) -> str | None:
    if not location:
        return None
    return location.split(",")[0].strip()


class HotelRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(
        self,
        property_id: int,
        check_in: Optional[date],
        check_out: Optional[date],
        adults: int = 2,
    ) -> Optional[HotelDetailResponse]:
        # 1. Propiedad
        prop = (
            (
                await self.session.execute(
                    select(Property).where(Property.id == property_id)
                )
            )
            .scalars()
            .first()
        )
        if not prop:
            return None

        nights = (check_out - check_in).days if (check_in and check_out) else 1

        # 2. Rating (avg + count)
        rating_row = (
            await self.session.execute(
                select(
                    func.avg(Review.rating).label("avg_rating"),
                    func.count(Review.id).label("review_count"),
                ).where(Review.property_id == property_id)
            )
        ).one()

        # 3. Habitaciones
        rooms = (
            (
                await self.session.execute(
                    select(Room).where(Room.property_id == property_id)
                )
            )
            .scalars()
            .all()
        )

        room_results: List[RoomResult] = []
        for room in rooms:
            pn, cur, total = await self._room_rate(
                room.id, check_in, check_out, nights, prop.tax_rate
            )
            images = (
                [room.image_url]
                if room.image_url
                else [_DEFAULT_ROOM_IMG.format(room_id=room.id)]
            )
            room_results.append(
                RoomResult(
                    id=room.id,
                    name=room.name,
                    description=_room_description(room),
                    images=images,
                    price=RoomPrice(
                        total_amount=total,
                        price_per_night=pn,
                        currency=cur,
                        nights=nights,
                        adults=adults,
                        includes_taxes=True,
                    ),
                )
            )

        # 4. Fotos
        photos: List[HotelPhoto] = []
        if prop.image_url:
            photos.append(HotelPhoto(url=prop.image_url, alt=prop.name))
        photos += [
            HotelPhoto(url=_DEFAULT_PHOTO.format(seed=f"{property_id}b")),
            HotelPhoto(url=_DEFAULT_PHOTO.format(seed=f"{property_id}c")),
            HotelPhoto(url=_DEFAULT_PHOTO.format(seed=f"{property_id}d")),
            HotelPhoto(url=_DEFAULT_PHOTO.format(seed=f"{property_id}e")),
        ]

        meal_slug = prop.meal_plan.value if prop.meal_plan else "none"

        return HotelDetailResponse(
            id=prop.id,
            name=prop.name,
            city=_city_from_location(prop.location),
            description=prop.description or "",
            stars=prop.stars,
            rating=AccommodationRating(
                score=round(rating_row.avg_rating, 1)
                if rating_row.avg_rating
                else None,
                review_count=rating_row.review_count or 0,
            ),
            photos=photos,
            amenities=[AmenityItem(id=a) for a in (prop.amenities or [])],
            schedule=HotelSchedule(
                check_in=CheckInSchedule(), check_out=CheckOutSchedule()
            ),
            rooms=room_results,
            suggested_room=_suggested_room(room_results, meal_slug),
        )

    async def get_booking_detail_by_room_id(
        self,
        *,
        room_id: int,
        units: int = 1,
    ) -> Optional[RoomBookingDetailResponse]:
        row = (
            await self.session.execute(
                select(Room, Property)
                .join(Property, Property.id == Room.property_id)
                .where(Room.id == room_id)
            )
        ).first()
        if row is None:
            return None

        room, prop = row
        adults = max(2, units * 2)
        if room.max_capacity:
            adults = min(adults, room.max_capacity)

        meal_slug = prop.meal_plan.value if prop.meal_plan else None
        return RoomBookingDetailResponse(
            room_id=room.id,
            hotel_name=prop.name,
            stars=prop.stars,
            city=_city_from_location(prop.location),
            country=_COUNTRY_BY_CODE.get((prop.country or "").upper(), prop.country),
            room_name=room.name,
            meal_plan=_meal_plan_label(meal_slug),
            adults=adults,
        )

    async def _room_rate(self, room_id, check_in, check_out, nights, tax_rate):
        if check_in and check_out:
            row = (
                await self.session.execute(
                    select(
                        func.avg(Rate.amount).label("avg_amount"),
                        func.min(Rate.currency).label("currency"),
                    ).where(
                        Rate.room_id == room_id,
                        Rate.date >= check_in,
                        Rate.date < check_out,
                    )
                )
            ).one()
            pn = row.avg_amount or 0.0
            cur = row.currency or "COP"
        else:
            pn, cur = 0.0, "COP"
        return pn, cur, round(pn * nights * (1 + tax_rate), 2)
