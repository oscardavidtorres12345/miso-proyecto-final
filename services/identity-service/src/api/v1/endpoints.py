from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.domain.schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RoleResponse,
)
from src.domain.services.registration_service import (
    RegistrationConflictError,
    RegistrationValidationError,
    register_user_service,
)
from src.infrastructure.database.connection import get_db

router = APIRouter(prefix="/identity")


@router.post("/auth/web/login", response_model=LoginResponse)
def web_login(payload: LoginRequest) -> LoginResponse:
    return LoginResponse(
        status="not_implemented",
        sprint=1,
        hu_id="HU001",
        message="Base web authentication endpoint created. Identity core is pending.",
    )


@router.get("/auth/roles/{user_id}", response_model=RoleResponse)
def get_roles(user_id: str) -> RoleResponse:
    return RoleResponse(
        user_id=user_id,
        roles=["guest"],
        sprint=1,
        hu_id="HU025",
    )


@router.post("/auth/register", response_model=RegisterResponse)
def register_user(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    try:
        return register_user_service(payload, db)
    except RegistrationConflictError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except RegistrationValidationError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/auth/portal/login", response_model=LoginResponse)
def portal_login(payload: LoginRequest) -> LoginResponse:
    return LoginResponse(
        status="not_implemented",
        sprint=2,
        hu_id="HU010",
        message="Hotel portal authentication baseline endpoint enabled.",
    )


@router.post("/auth/mobile/login", response_model=LoginResponse)
def mobile_login(payload: LoginRequest) -> LoginResponse:
    return LoginResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU015",
        message="Mobile authentication baseline endpoint enabled.",
    )
