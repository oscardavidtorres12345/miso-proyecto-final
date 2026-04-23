from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.property import Property
from src.domain.models.room import Room
from src.api.internal_auth import require_internal_token
from src.infrastructure.database.session import get_db

router = APIRouter(
    prefix="/internal/catalog",
    dependencies=[Depends(require_internal_token)],
)


class CatalogRoom(BaseModel):
    room_id: int
    property_id: int
    property_name: str
    room_type: str
    country: str


class CatalogRoomsResponse(BaseModel):
    status: str = "ok"
    total: int
    rooms: List[CatalogRoom]


class CatalogRoomCreateRequest(BaseModel):
    property_id: int = Field(ge=1)
    room_type: str = Field(min_length=1, max_length=255)
    max_capacity: int = Field(default=2, ge=1)
    bed_type: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    image_url: str | None = Field(default=None, max_length=1000)


class CatalogRoomCreateResponse(BaseModel):
    status: str = "ok"
    room: CatalogRoom


@router.get(
    "/rooms",
    response_model=CatalogRoomsResponse,
    status_code=status.HTTP_200_OK,
)
async def list_catalog_rooms(
    db: AsyncSession = Depends(get_db),
) -> CatalogRoomsResponse:
    stmt = (
        select(Room.id, Room.property_id, Property.name, Room.name, Property.country)
        .join(Property, Property.id == Room.property_id)
        .order_by(Room.id.asc())
    )
    rows = (await db.execute(stmt)).all()
    items = [
        CatalogRoom(
            room_id=int(room_id),
            property_id=int(property_id),
            property_name=(property_name or "").strip(),
            room_type=(room_name or "Room").strip(),
            country=(country or "CO").upper(),
        )
        for room_id, property_id, property_name, room_name, country in rows
    ]
    return CatalogRoomsResponse(total=len(items), rooms=items)


@router.post(
    "/rooms",
    response_model=CatalogRoomCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_catalog_room(
    payload: CatalogRoomCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> CatalogRoomCreateResponse:
    property_row = (
        await db.execute(
            select(Property.id, Property.name, Property.country).where(
                Property.id == payload.property_id
            )
        )
    ).first()
    if property_row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found in search catalog.",
        )

    _, property_name, country = property_row
    room = Room(
        property_id=payload.property_id,
        name=payload.room_type.strip(),
        max_capacity=payload.max_capacity,
        bed_type=payload.bed_type.strip() if payload.bed_type else None,
        description=payload.description.strip() if payload.description else None,
        image_url=payload.image_url.strip() if payload.image_url else None,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)

    return CatalogRoomCreateResponse(
        room=CatalogRoom(
            room_id=int(room.id),
            property_id=int(payload.property_id),
            property_name=(property_name or "").strip(),
            room_type=room.name,
            country=(country or "CO").upper(),
        )
    )
