from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from src.domain.schemas import (
    LoginRequest,
    LoginResponse,
    PrivacyNoticeResponse,
    RegisterRequest,
    RegisterResponse,
    RoleResponse,
)
from src.domain.services.login_service import (
    LoginUnauthorizedError,
    LoginValidationError,
    login_user_service,
)
from src.domain.services.registration_service import (
    RegistrationConflictError,
    RegistrationValidationError,
    register_user_service,
)
from src.infrastructure.database.connection import get_db
from src.infrastructure.repositories.user_repository import get_jurisdiction_by_iso_code

router = APIRouter(prefix="/identity")


@router.post("/auth/web/login", response_model=LoginResponse)
def web_login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> LoginResponse:
    source_ip = request.client.host if request.client else "127.0.0.1"
    try:
        return login_user_service(payload, db, source_ip=source_ip)
    except LoginUnauthorizedError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    except LoginValidationError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get("/auth/roles/{user_id}", response_model=RoleResponse)
def get_roles(user_id: str) -> RoleResponse:
    return RoleResponse(
        user_id=user_id,
        roles=["GUEST"],
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


@router.get("/privacy/notices/{iso_code}", response_model=PrivacyNoticeResponse)
def get_privacy_notice(
    iso_code: str,
    db: Session = Depends(get_db),
) -> PrivacyNoticeResponse:
    jurisdiction = get_jurisdiction_by_iso_code(db, iso_code)
    if jurisdiction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Jurisdiction '{iso_code.upper()}' was not found.",
        )

    return PrivacyNoticeResponse(
        iso_code=jurisdiction.iso_code,
        jurisdiction_name=jurisdiction.region_name,
        applicable_regulation=jurisdiction.applicable_regulation,
        privacy_title=jurisdiction.privacy_title,
        privacy_content=jurisdiction.privacy_content,
        privacy_pdf_url=jurisdiction.privacy_pdf_url,
        privacy_version=jurisdiction.privacy_version,
        privacy_effective_at=jurisdiction.privacy_effective_at,
        privacy_contact_email=jurisdiction.privacy_contact_email,
    )
