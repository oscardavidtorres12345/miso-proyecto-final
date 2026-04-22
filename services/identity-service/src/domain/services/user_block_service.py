from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.domain.schemas import UserBlockActionResponse
from src.infrastructure.repositories.user_repository import (
    get_user_by_id,
    upsert_user_block_state,
)


class UserBlockNotFoundError(Exception):
    pass


class UserBlockValidationError(Exception):
    pass


LOW_RISK_SEVERITIES = {"LOW", "MEDIUM"}
HIGH_RISK_SEVERITIES = {"HIGH", "CRITICAL"}
VALID_SEVERITIES = LOW_RISK_SEVERITIES | HIGH_RISK_SEVERITIES
POLICY_MANUAL_ONLY = "MANUAL_ONLY"
POLICY_AUTO_ON_TTL = "AUTO_ON_TTL"


def _normalize_severity(value: str) -> str:
    normalized = value.strip().upper()
    if normalized not in VALID_SEVERITIES:
        raise UserBlockValidationError(
            "Invalid severity. Allowed values: LOW, MEDIUM, HIGH, CRITICAL."
        )
    return normalized


def block_user_service(
    db: Session,
    *,
    user_id: int,
    reason: str,
    ttl_minutes: int | None,
    severity: str = "HIGH",
    blocked_by_user_id: int | None = None,
    block_source: str = "ADMIN",
) -> UserBlockActionResponse:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise UserBlockNotFoundError(f"User '{user_id}' was not found.")

    normalized_severity = _normalize_severity(severity)
    blocked_until = None
    if ttl_minutes is not None:
        blocked_until = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)

    state = upsert_user_block_state(
        db,
        user_id=user_id,
        is_blocked=True,
        blocked_until=blocked_until,
        block_reason=reason,
        blocked_by_user_id=blocked_by_user_id,
        block_source=block_source,
        severity=normalized_severity,
        unblock_policy=POLICY_MANUAL_ONLY,
    )
    db.commit()

    return UserBlockActionResponse(
        status="blocked",
        user_id=user_id,
        is_blocked=state.is_blocked,
        severity=state.severity,
        unblock_policy=state.unblock_policy,
        blocked_until=state.blocked_until,
        message="User account blocked.",
    )


def auto_block_user_service(
    db: Session,
    *,
    user_id: int,
    reason: str,
    severity: str,
    ttl_minutes: int | None,
) -> UserBlockActionResponse:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise UserBlockNotFoundError(f"User '{user_id}' was not found.")

    normalized_severity = _normalize_severity(severity)
    unblock_policy = (
        POLICY_AUTO_ON_TTL
        if normalized_severity in LOW_RISK_SEVERITIES
        else POLICY_MANUAL_ONLY
    )

    if unblock_policy == POLICY_AUTO_ON_TTL and ttl_minutes is None:
        raise UserBlockValidationError(
            "ttl_minutes is required for LOW/MEDIUM automatic blocks."
        )

    blocked_until = None
    if ttl_minutes is not None:
        blocked_until = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)

    state = upsert_user_block_state(
        db,
        user_id=user_id,
        is_blocked=True,
        blocked_until=blocked_until,
        block_reason=reason,
        blocked_by_user_id=None,
        block_source="SYSTEM",
        severity=normalized_severity,
        unblock_policy=unblock_policy,
    )
    db.commit()

    return UserBlockActionResponse(
        status="blocked",
        user_id=user_id,
        is_blocked=state.is_blocked,
        severity=state.severity,
        unblock_policy=state.unblock_policy,
        blocked_until=state.blocked_until,
        message="User account blocked automatically.",
    )


def unblock_user_service(
    db: Session,
    *,
    user_id: int,
    reason: str | None = None,
    blocked_by_user_id: int | None = None,
    block_source: str = "ADMIN",
) -> UserBlockActionResponse:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise UserBlockNotFoundError(f"User '{user_id}' was not found.")

    state = upsert_user_block_state(
        db,
        user_id=user_id,
        is_blocked=False,
        blocked_until=None,
        block_reason=reason,
        blocked_by_user_id=blocked_by_user_id,
        block_source=block_source,
        severity="LOW",
        unblock_policy=POLICY_MANUAL_ONLY,
    )
    db.commit()

    return UserBlockActionResponse(
        status="unblocked",
        user_id=user_id,
        is_blocked=state.is_blocked,
        severity=state.severity,
        unblock_policy=state.unblock_policy,
        blocked_until=state.blocked_until,
        message="User account unblocked.",
    )
