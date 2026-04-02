from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.domain.schemas import (
    CancelHoldRequest,
    CancelHoldResponse,
    ConfirmHoldResponse,
    CreateHoldRequest,
    ExpireHoldsResponse,
    HoldResponse,
    StockResponse,
    StockUpsertRequest,
)
from src.domain.services.inventory_service import (
    HoldConflictError,
    HoldExpiredError,
    HoldNotFoundError,
    InventoryUnavailableError,
    inventory_service,
)
from src.infrastructure.database.connection import get_db

router = APIRouter(prefix="/inventory")


@router.post(
    "/stock/upsert", response_model=StockResponse, status_code=status.HTTP_200_OK
)
def upsert_stock(
    payload: StockUpsertRequest, db: Session = Depends(get_db)
) -> StockResponse:
    try:
        return inventory_service.upsert_stock(db, payload)
    except InventoryUnavailableError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
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
        return inventory_service.confirm_hold(db, hold_id)
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
        return inventory_service.cancel_hold(db, hold_id)
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


@router.post(
    "/holds/expire", response_model=ExpireHoldsResponse, status_code=status.HTTP_200_OK
)
def expire_holds(db: Session = Depends(get_db)) -> ExpireHoldsResponse:
    return ExpireHoldsResponse(expired_count=inventory_service.expire_holds(db))
