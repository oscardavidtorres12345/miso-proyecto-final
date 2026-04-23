from datetime import date, timedelta
import json
import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.auth import resolve_request_user_id
from src.domain.schemas import (
    CancelHoldRequest,
    CancelHoldResponse,
    ConfirmHoldResponse,
    CreateHoldRequest,
    CatalogSyncResponse,
    ExpireHoldsResponse,
    HoldResponse,
    RoomRateResponse,
    RoomRatesResponse,
    RoomRateUpsertRequest,
    StockResponse,
    StockUpsertRequest,
)
from src.domain.services.inventory_service import (
    HoldConflictError,
    HoldExpiredError,
    HoldNotFoundError,
    InventoryUnavailableError,
    RoomRateAccessDeniedError,
    RoomRateNotFoundError,
    inventory_service,
)
from src.infrastructure.clients import SearchSyncError, search_sync_client
from src.infrastructure.clients import SearchCatalogError, search_catalog_client
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.models import InventoryHold

router = APIRouter(prefix="/inventory")


@router.post(
    "/stock/upsert", response_model=StockResponse, status_code=status.HTTP_200_OK
)
def upsert_stock(
    payload: StockUpsertRequest, db: Session = Depends(get_db)
) -> StockResponse:
    try:
        result = inventory_service.upsert_stock(db, payload)
        _sync_inventory_rows(
            room_id=result.room_id,
            rows=[
                {
                    "date": result.date,
                    "total_units": result.total_units,
                    "confirmed_units": result.confirmed_units,
                }
            ],
        )
        return result
    except InventoryUnavailableError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc
    except SearchSyncError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/holds", response_model=HoldResponse, status_code=status.HTTP_201_CREATED)
def create_hold(
    payload: CreateHoldRequest, db: Session = Depends(get_db)
) -> HoldResponse:
    try:
        return inventory_service.create_hold(db, payload)
    except InventoryUnavailableError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc


@router.get(
    "/holds/{hold_id}", response_model=HoldResponse, status_code=status.HTTP_200_OK
)
def get_hold(hold_id: str, db: Session = Depends(get_db)) -> HoldResponse:
    try:
        return inventory_service.get_hold(db, hold_id)
    except HoldNotFoundError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.post(
    "/holds/{hold_id}/confirm",
    response_model=ConfirmHoldResponse,
    status_code=status.HTTP_200_OK,
)
def confirm_hold(hold_id: str, db: Session = Depends(get_db)) -> ConfirmHoldResponse:
    try:
        result = inventory_service.confirm_hold(db, hold_id)
        hold = db.get(InventoryHold, hold_id)
        if hold:
            rows = inventory_service.get_stock_window(
                db,
                room_id=hold.room_id,
                start=hold.check_in,
                end=hold.check_out,
            )
            _sync_inventory_rows(
                room_id=hold.room_id,
                rows=[
                    {
                        "date": r.date,
                        "total_units": r.total_units,
                        "confirmed_units": r.confirmed_units,
                    }
                    for r in rows
                ],
            )
        return result
    except HoldNotFoundError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except HoldExpiredError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=str(exc)) from exc
    except HoldConflictError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc
    except SearchSyncError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post(
    "/holds/{hold_id}/cancel",
    response_model=CancelHoldResponse,
    status_code=status.HTTP_200_OK,
)
def cancel_hold(
    hold_id: str,
    payload: CancelHoldRequest,
    db: Session = Depends(get_db),
) -> CancelHoldResponse:
    _ = payload
    try:
        result = inventory_service.cancel_hold(db, hold_id)
        hold = db.get(InventoryHold, hold_id)
        if hold:
            rows = inventory_service.get_stock_window(
                db,
                room_id=hold.room_id,
                start=hold.check_in,
                end=hold.check_out,
            )
            _sync_inventory_rows(
                room_id=hold.room_id,
                rows=[
                    {
                        "date": r.date,
                        "total_units": r.total_units,
                        "confirmed_units": r.confirmed_units,
                    }
                    for r in rows
                ],
            )
        return result
    except HoldNotFoundError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except HoldExpiredError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=str(exc)) from exc
    except HoldConflictError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc
    except SearchSyncError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post(
    "/holds/expire", response_model=ExpireHoldsResponse, status_code=status.HTTP_200_OK
)
def expire_holds(db: Session = Depends(get_db)) -> ExpireHoldsResponse:
    return ExpireHoldsResponse(expired_count=inventory_service.expire_holds(db))


@router.post(
    "/catalog/sync",
    response_model=CatalogSyncResponse,
    status_code=status.HTTP_200_OK,
)
def sync_catalog(db: Session = Depends(get_db)) -> CatalogSyncResponse:
    try:
        rooms = search_catalog_client.fetch_rooms()
        result = inventory_service.sync_catalog(
            db,
            rooms=rooms,
            staff_by_country=_staff_by_country_mapping(),
        )
        return CatalogSyncResponse(**result)
    except SearchCatalogError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get("/rates", response_model=RoomRatesResponse, status_code=status.HTTP_200_OK)
def list_room_rates(
    request_user_id: int = Depends(resolve_request_user_id),
    property_id: int | None = None,
    currency: str | None = None,
    db: Session = Depends(get_db),
) -> RoomRatesResponse:
    return RoomRatesResponse(
        rates=inventory_service.list_room_rates(
            db,
            staff_user_id=request_user_id,
            property_id=property_id,
            currency=currency,
        )
    )


@router.post(
    "/rates", response_model=RoomRateResponse, status_code=status.HTTP_201_CREATED
)
def create_room_rate(
    payload: RoomRateUpsertRequest,
    request_user_id: int = Depends(resolve_request_user_id),
    db: Session = Depends(get_db),
) -> RoomRateResponse:
    try:
        result = inventory_service.create_room_rate(
            db,
            payload=payload,
            staff_user_id=request_user_id,
        )
        window_start = date.today()
        window_end = window_start + timedelta(days=payload.horizon_days)
        stocks = inventory_service.get_stock_window(
            db,
            room_id=result.room_id,
            start=window_start,
            end=window_end,
        )
        _sync_inventory_rows(
            room_id=result.room_id,
            rows=[
                {
                    "date": s.date,
                    "total_units": s.total_units,
                    "confirmed_units": s.confirmed_units,
                }
                for s in stocks
            ],
        )
        _sync_rate_rows(
            room_id=result.room_id,
            currency=result.currency,
            rows=[{"date": s.date, "amount": result.effective_rate} for s in stocks],
        )
        return result
    except InventoryUnavailableError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RoomRateAccessDeniedError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except SearchSyncError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get(
    "/rates/{room_id}", response_model=RoomRateResponse, status_code=status.HTTP_200_OK
)
def get_room_rate(
    room_id: int,
    request_user_id: int = Depends(resolve_request_user_id),
    db: Session = Depends(get_db),
) -> RoomRateResponse:
    try:
        return inventory_service.get_room_rate(
            db, room_id, staff_user_id=request_user_id
        )
    except RoomRateNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except RoomRateAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


@router.put(
    "/rates/{room_id}", response_model=RoomRateResponse, status_code=status.HTTP_200_OK
)
def upsert_room_rate(
    room_id: int,
    payload: RoomRateUpsertRequest,
    request_user_id: int = Depends(resolve_request_user_id),
    db: Session = Depends(get_db),
) -> RoomRateResponse:
    try:
        result = inventory_service.upsert_room_rate(
            db,
            room_id=room_id,
            payload=payload,
            staff_user_id=request_user_id,
        )
        # Keep window aligned with how service applies rate/stock (today + horizon_days)
        window_start = date.today()
        window_end = window_start + timedelta(days=payload.horizon_days)
        stocks = inventory_service.get_stock_window(
            db,
            room_id=room_id,
            start=window_start,
            end=window_end,
        )
        _sync_inventory_rows(
            room_id=room_id,
            rows=[
                {
                    "date": s.date,
                    "total_units": s.total_units,
                    "confirmed_units": s.confirmed_units,
                }
                for s in stocks
            ],
        )
        _sync_rate_rows(
            room_id=room_id,
            currency=result.currency,
            rows=[{"date": s.date, "amount": result.effective_rate} for s in stocks],
        )
        return result
    except InventoryUnavailableError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RoomRateAccessDeniedError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except SearchSyncError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


def _sync_inventory_rows(*, room_id: int, rows: list[dict]) -> None:
    search_sync_client.sync_inventory(room_id=room_id, entries=rows)


def _sync_rate_rows(*, room_id: int, currency: str, rows: list[dict]) -> None:
    search_sync_client.sync_rates(room_id=room_id, currency=currency, entries=rows)


def _staff_by_country_mapping() -> dict[str, int]:
    raw = os.getenv("STAFF_USER_BY_COUNTRY", '{"CO":1,"AR":2,"US":3}')
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid STAFF_USER_BY_COUNTRY configuration.",
        ) from exc

    mapping: dict[str, int] = {}
    if isinstance(parsed, dict):
        for k, v in parsed.items():
            try:
                mapping[str(k).upper()] = int(v)
            except (TypeError, ValueError):
                continue
    return mapping
