import hashlib
import base64
import hmac
import json
import os
from datetime import datetime, timedelta, timezone
from time import perf_counter
from uuid import uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.domain.schemas import LoginRequest, LoginResponse, LoginUserInfo
from src.infrastructure.repositories.user_repository import (
    clear_user_block_state,
    count_rejected_attempts_since,
    create_access_audit_log,
    create_security_event,
    get_permissions_by_role_id,
    get_role_name_by_id,
    get_user_block_state,
    get_user_by_email,
    update_user_last_login,
)
from src.domain.services.user_block_service import POLICY_AUTO_ON_TTL

SESSION_TTL_SECONDS = 2 * 60 * 60
FAILED_ATTEMPTS_WINDOW = timedelta(hours=1)
MAX_FAILED_ATTEMPTS = 3
JWT_SECRET = os.getenv("JWT_SECRET", "travelhub-dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


class LoginUnauthorizedError(Exception):
    pass


class LoginValidationError(Exception):
    pass


class LoginBlockedError(Exception):
    pass


def _normalize_requested_jurisdiction(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip().upper()


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _issue_access_token(
    *,
    user_id: int,
    email: str,
    role: str | None,
    permissions: list[str],
    issued_at: datetime,
    expires_at: datetime,
) -> str:
    if JWT_ALGORITHM.upper() != "HS256":
        raise LoginValidationError("Unsupported JWT algorithm configuration.")

    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "email": email,
        "role": role,
        "permissions": permissions,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    header_seg = _b64url_encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    payload_seg = _b64url_encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8")
    )
    signing_input = f"{header_seg}.{payload_seg}".encode("utf-8")
    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    signature_seg = _b64url_encode(signature)
    return f"{header_seg}.{payload_seg}.{signature_seg}"


def _has_block_expired(blocked_until: datetime, now: datetime) -> bool:
    # SQLite tests may return naive datetimes even when timezone=True.
    if blocked_until.tzinfo is None:
        return blocked_until <= now.replace(tzinfo=None)
    return blocked_until <= now


def login_user_service(
    payload: LoginRequest,
    db: Session,
    *,
    source_ip: str,
    information_type: str = "AUTH_LOGIN_WEB",
) -> LoginResponse:
    started_at = perf_counter()

    user = get_user_by_email(db, payload.email.lower())
    if user is None:
        raise LoginUnauthorizedError("Invalid email or password.")

    requested_jurisdiction = _normalize_requested_jurisdiction(
        payload.requested_jurisdiction
    )
    now_utc = datetime.now(timezone.utc)
    block_state = get_user_block_state(db, user.user_id)
    if block_state and block_state.is_blocked:
        can_auto_unblock = block_state.unblock_policy == POLICY_AUTO_ON_TTL
        if (
            can_auto_unblock
            and block_state.blocked_until
            and _has_block_expired(block_state.blocked_until, now_utc)
        ):
            previous_reason = block_state.block_reason
            previous_severity = block_state.severity
            clear_user_block_state(db, block_state)
            create_security_event(
                db,
                correlation_id=str(uuid4()),
                event_type="USER_AUTO_UNBLOCKED",
                severity="LOW",
                status="RESOLVED",
                target_user_id=user.user_id,
                rule_code="TTL_AUTO_UNBLOCK",
                action_taken="UNBLOCK_USER",
                metadata={
                    "previous_reason": previous_reason,
                    "previous_severity": previous_severity,
                    "previous_unblock_policy": POLICY_AUTO_ON_TTL,
                },
            )
        else:
            latency_ms = int((perf_counter() - started_at) * 1000)
            create_access_audit_log(
                db,
                user_id=user.user_id,
                source_ip=source_ip,
                information_type=information_type,
                requested_jurisdiction=requested_jurisdiction,
                access_result="REJECTED",
                latency_ms=latency_ms,
                rejection_reason="User account is blocked.",
            )
            db.commit()
            raise LoginBlockedError("Account temporarily blocked. Try again later.")

    password_hash = _hash_password(payload.password)
    latency_ms = int((perf_counter() - started_at) * 1000)
    failed_attempts_since = now_utc - FAILED_ATTEMPTS_WINDOW
    recent_rejected_attempts = count_rejected_attempts_since(
        db,
        user_id=user.user_id,
        since=failed_attempts_since,
    )

    if recent_rejected_attempts >= MAX_FAILED_ATTEMPTS:
        create_access_audit_log(
            db,
            user_id=user.user_id,
            source_ip=source_ip,
            information_type=information_type,
            requested_jurisdiction=requested_jurisdiction,
            access_result="REJECTED",
            latency_ms=latency_ms,
            rejection_reason="Blocked due to failed attempts threshold.",
        )
        db.commit()
        raise LoginBlockedError("Too many failed login attempts. Try again later.")

    if not user.is_active:
        create_access_audit_log(
            db,
            user_id=user.user_id,
            source_ip=source_ip,
            information_type=information_type,
            requested_jurisdiction=requested_jurisdiction,
            access_result="REJECTED",
            latency_ms=latency_ms,
            rejection_reason="User account is inactive.",
        )
        db.commit()
        raise LoginUnauthorizedError("User account is inactive.")

    if user.password_hash != password_hash:
        create_access_audit_log(
            db,
            user_id=user.user_id,
            source_ip=source_ip,
            information_type=information_type,
            requested_jurisdiction=requested_jurisdiction,
            access_result="REJECTED",
            latency_ms=latency_ms,
            rejection_reason="Invalid credentials.",
        )
        db.commit()
        raise LoginUnauthorizedError("Invalid email or password.")

    role_name = get_role_name_by_id(db, user.role_id)
    permissions = get_permissions_by_role_id(db, user.role_id)
    update_user_last_login(db, user)
    latency_ms = int((perf_counter() - started_at) * 1000)
    create_access_audit_log(
        db,
        user_id=user.user_id,
        source_ip=source_ip,
        information_type=information_type,
        requested_jurisdiction=requested_jurisdiction,
        access_result="GRANTED",
        latency_ms=latency_ms,
        rejection_reason=None,
    )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise LoginValidationError(
            "Unable to complete login due to data integrity."
        ) from exc

    issued_at = datetime.now(timezone.utc)
    session_expires_at = issued_at + timedelta(seconds=SESSION_TTL_SECONDS)
    access_token = _issue_access_token(
        user_id=user.user_id,
        email=user.email,
        role=role_name,
        permissions=permissions,
        issued_at=issued_at,
        expires_at=session_expires_at,
    )
    return LoginResponse(
        status="authenticated",
        sprint=1,
        hu_id="HU001",
        message="Login successful.",
        user=LoginUserInfo(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            role=role_name,
            is_active=user.is_active,
        ),
        permissions=permissions,
        session_ttl_seconds=SESSION_TTL_SECONDS,
        session_expires_at=session_expires_at,
        access_token=access_token,
        token_type="Bearer",
    )
