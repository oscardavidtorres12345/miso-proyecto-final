from typing import List

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
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
