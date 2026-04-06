"""
HotelRepository — consultas a DB CATALOG A para el detalle de hospedaje (HU004).
"""
from datetime import date
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.property import Property, MealPlan
from src.domain.models.room import Room
from src.domain.models.rate import Rate
from src.domain.models.review import Review
from src.domain.schemas.hotel_detail import (
    AmenityItem,
    CheckInSchedule,
    CheckOutSchedule,
    HotelDetailResponse,
    HotelPhoto,
    HotelRating,
    HotelSchedule,
    RoomPrice,
    RoomResult,
    SuggestedRoom,
)

_BREAKFAST_SLUGS = {"breakfast", "buffet", "allinclusive"}
_DEFAULT_PHOTO_SEED = "https://picsum.photos/seed/{seed}/1200/600"
_DEFAULT_ROOM_IMG = "https://picsum.photos/seed/room{room_id}/600/400"


def _room_description(room: Room) -> str:
    """Genera descripción desde bed_type y max_capacity si no hay texto guardado."""
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
        # 1. Obtener propiedad
        stmt = select(Property).where(Property.id == property_id)
        result = await self.session.execute(stmt)
        prop = result.scalars().first()
        if not prop:
            return None

        nights = (check_out - check_in).days if (check_in and check_out) else 1

        # 2. Rating (avg + count de reseñas)
        rating_stmt = select(
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        ).where(Review.property_id == property_id)
        rating_row = (await self.session.execute(rating_stmt)).one()

        # 3. Habitaciones
        rooms_stmt = select(Room).where(Room.property_id == property_id)
        rooms = (await self.session.execute(rooms_stmt)).scalars().all()

        room_results: List[RoomResult] = []
        for room in rooms:
            price_per_night, currency, total_amount = await self._room_rate(
                room.id, check_in, check_out, nights, prop.tax_rate
            )
            images = [room.image_url] if room.image_url else [_DEFAULT_ROOM_IMG.format(room_id=room.id)]
            room_results.append(RoomResult(
                id=room.id,
                name=room.name,
                description=_room_description(room),
                images=images,
                price=RoomPrice(
                    total_amount=total_amount,
                    price_per_night=price_per_night,
                    currency=currency,
                    nights=nights,
                    adults=adults,
                    includes_taxes=True,
                ),
            ))

        # 4. Fotos
        photos: List[HotelPhoto] = []
        if prop.image_url:
            photos.append(HotelPhoto(url=prop.image_url, alt=prop.name))
        photos.extend([
            HotelPhoto(url=_DEFAULT_PHOTO_SEED.format(seed=f"{property_id}b")),
            HotelPhoto(url=_DEFAULT_PHOTO_SEED.format(seed=f"{property_id}c")),
        ])

        meal_slug = prop.meal_plan.value if prop.meal_plan else MealPlan.none.value

        return HotelDetailResponse(
            id=prop.id,
            name=prop.name,
            description="",
            stars=prop.stars,
            rating=HotelRating(
                score=round(rating_row.avg_rating, 1) if rating_row.avg_rating else None,
                review_count=rating_row.review_count or 0,
            ),
            photos=photos,
            amenities=[AmenityItem(id=a) for a in (prop.amenities or [])],
            schedule=HotelSchedule(
                check_in=CheckInSchedule(),
                check_out=CheckOutSchedule(),
            ),
            rooms=room_results,
            suggested_room=_suggested_room(room_results, meal_slug),
        )

    async def _room_rate(
        self,
        room_id: int,
        check_in: Optional[date],
        check_out: Optional[date],
        nights: int,
        tax_rate: float,
    ):
        """Devuelve (price_per_night, currency, total_amount) para el rango de fechas."""
        if check_in and check_out:
            rate_stmt = select(
                func.avg(Rate.amount).label("avg_amount"),
                func.min(Rate.currency).label("currency"),
            ).where(Rate.room_id == room_id, Rate.date >= check_in, Rate.date < check_out)
            row = (await self.session.execute(rate_stmt)).one()
            price_per_night = row.avg_amount or 0.0
            currency = row.currency or "COP"
        else:
            price_per_night, currency = 0.0, "COP"
        total_amount = round(price_per_night * nights * (1 + tax_rate), 2)
        return price_per_night, currency, total_amount
