from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.domain.schemas import UserBlockActionResponse
from src.infrastructure.repositories.user_repository import (
    get_user_by_id,
    upsert_user_block_state,
)


class UserBlockNotFoundError(Exception):
    pass


def block_user_service(
    db: Session,
    *,
    user_id: int,
    reason: str,
    ttl_minutes: int | None,
    blocked_by_user_id: int | None = None,
    block_source: str = "ADMIN",
) -> UserBlockActionResponse:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise UserBlockNotFoundError(f"User '{user_id}' was not found.")

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
    )
    db.commit()

    return UserBlockActionResponse(
        status="blocked",
        user_id=user_id,
        is_blocked=state.is_blocked,
        blocked_until=state.blocked_until,
        message="User account blocked.",
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
    )
    db.commit()

    return UserBlockActionResponse(
        status="unblocked",
        user_id=user_id,
        is_blocked=state.is_blocked,
        blocked_until=state.blocked_until,
        message="User account unblocked.",
    )
