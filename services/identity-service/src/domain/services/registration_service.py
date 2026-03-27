import hashlib
import re

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.domain.schemas import RegisterRequest, RegisterResponse
from src.infrastructure.repositories.user_repository import (
    create_guest,
    create_user,
    get_jurisdiction_by_id,
    get_role_id_by_name,
    get_user_by_email,
)

_DEFAULT_ROLE = "GUEST"
_SUPPORTED_REGISTRATION_ROLES = {"GUEST", "ADMIN", "STAFF"}


class RegistrationConflictError(Exception):
    pass


class RegistrationValidationError(Exception):
    pass


def _normalize_registration_role(role: str | None) -> str:
    if role is None:
        return _DEFAULT_ROLE

    normalized_role = role.strip().upper()
    if normalized_role not in _SUPPORTED_REGISTRATION_ROLES:
        raise RegistrationValidationError("Unsupported role for registration.")
    return normalized_role


def _build_username(email: str) -> str:
    base_username = email.split("@", maxsplit=1)[0]
    safe_username = re.sub(r"[^a-zA-Z0-9_]+", "_", base_username).strip("_")
    safe_username = safe_username[:43] or "guest"
    suffix = hashlib.sha1(email.encode("utf-8")).hexdigest()[:6]
    return f"{safe_username}_{suffix}"


def register_user_service(payload: RegisterRequest, db: Session) -> RegisterResponse:
    email = payload.email.lower()
    if get_user_by_email(db, email) is not None:
        raise RegistrationConflictError("Email is already registered.")

    normalized_role = _normalize_registration_role(payload.role)
    role_id = get_role_id_by_name(db, normalized_role)
    if role_id is None:
        raise RegistrationValidationError(
            f"Role '{normalized_role}' does not exist in ROLE catalog."
        )
    if get_jurisdiction_by_id(db, payload.jurisdiction_id) is None:
        raise RegistrationValidationError(
            f"Jurisdiction '{payload.jurisdiction_id}' does not exist in JURISDICTION catalog."
        )

    password_hash = hashlib.sha256(payload.password.encode("utf-8")).hexdigest()
    username = _build_username(email=email)
    user = create_user(
        db,
        username=username,
        email=email,
        password_hash=password_hash,
        role_id=role_id,
    )
    guest_id: int | None = None
    if normalized_role == "GUEST":
        guest = create_guest(
            db,
            user_id=user.user_id,
            full_name=f"{payload.first_name.strip()} {payload.last_name.strip()}",
            document_id=payload.document_id.strip(),
            email_contact=email,
            jurisdiction_id=payload.jurisdiction_id,
        )
        guest_id = guest.guest_id
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise RegistrationConflictError(
            "User could not be registered due to data conflict."
        ) from exc

    return RegisterResponse(
        status="created",
        sprint=1,
        hu_id="HU-REG-001",
        user_id=user.user_id,
        guest_id=guest_id,
        username=username,
        email=email,
        role=normalized_role,
        jurisdiction_id=payload.jurisdiction_id,
        message="User registered successfully.",
    )
