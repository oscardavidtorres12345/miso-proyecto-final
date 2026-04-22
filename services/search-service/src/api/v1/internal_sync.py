from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.inventory import Inventory
from src.domain.models.rate import Rate
from src.api.internal_auth import require_internal_token
from src.infrastructure.cache.redis_cache import redis_cache
from src.infrastructure.database.session import get_db

router = APIRouter(
    prefix="/internal/sync",
    dependencies=[Depends(require_internal_token)],
)


class InventorySyncEntry(BaseModel):
    date: date
    total_units: int = Field(ge=0)
    confirmed_units: int = Field(ge=0)


class InventorySyncRequest(BaseModel):
    entries: List[InventorySyncEntry] = Field(default_factory=list)


class RateSyncEntry(BaseModel):
    date: date
    amount: float = Field(gt=0)


class RateSyncRequest(BaseModel):
    currency: str = Field(default="COP", min_length=1, max_length=10)
    entries: List[RateSyncEntry] = Field(default_factory=list)


class SyncResponse(BaseModel):
    status: str = "ok"
    room_id: int
    upserted: int


@router.put(
    "/inventory/rooms/{room_id}",
    response_model=SyncResponse,
    status_code=status.HTTP_200_OK,
)
async def sync_inventory_room(
    room_id: int,
    payload: InventorySyncRequest,
    db: AsyncSession = Depends(get_db),
) -> SyncResponse:
    if room_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="room_id must be >= 1",
        )

    if not payload.entries:
        return SyncResponse(room_id=room_id, upserted=0)

    upserted = 0
    for item in payload.entries:
        existing = (
            (
                await db.execute(
                    select(Inventory).where(
                        Inventory.room_id == room_id,
                        Inventory.date == item.date,
                    )
                )
            )
            .scalars()
            .first()
        )

        if existing is None:
            existing = Inventory(
                room_id=room_id,
                date=item.date,
                total_quantity=item.total_units,
                confirmed_quantity=item.confirmed_units,
            )
            db.add(existing)
        else:
            existing.total_quantity = item.total_units
            existing.confirmed_quantity = item.confirmed_units

        upserted += 1

    await db.commit()
    await redis_cache.delete_by_prefix("travelhub:search:")
    return SyncResponse(room_id=room_id, upserted=upserted)


@router.put(
    "/rates/rooms/{room_id}",
    response_model=SyncResponse,
    status_code=status.HTTP_200_OK,
)
async def sync_room_rates(
    room_id: int,
    payload: RateSyncRequest,
    db: AsyncSession = Depends(get_db),
) -> SyncResponse:
    if room_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="room_id must be >= 1",
        )

    if not payload.entries:
        return SyncResponse(room_id=room_id, upserted=0)

    upserted = 0
    currency = payload.currency.upper()
    for item in payload.entries:
        existing = (
            (
                await db.execute(
                    select(Rate).where(
                        Rate.room_id == room_id,
                        Rate.date == item.date,
                    )
                )
            )
            .scalars()
            .first()
        )

        if existing is None:
            existing = Rate(
                room_id=room_id,
                date=item.date,
                amount=item.amount,
                currency=currency,
            )
            db.add(existing)
        else:
            existing.amount = item.amount
            existing.currency = currency

        upserted += 1

    await db.commit()
    await redis_cache.delete_by_prefix("travelhub:search:")
    return SyncResponse(room_id=room_id, upserted=upserted)
