from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.infrastructure.database.models import (
    AccessAuditLog,
    DocumentType,
    Guest,
    Jurisdiction,
    Permission,
    Role,
    RolePermission,
    UserBlockState,
    UserAccount,
)


def get_role_id_by_name(db: Session, role_name: str) -> int | None:
    statement = select(Role.role_id).where(Role.role_name == role_name)
    return db.execute(statement).scalar_one_or_none()


def get_role_name_by_id(db: Session, role_id: int | None) -> str | None:
    if role_id is None:
        return None
    statement = select(Role.role_name).where(Role.role_id == role_id)
    return db.execute(statement).scalar_one_or_none()


def get_user_by_email(db: Session, email: str) -> UserAccount | None:
    statement = select(UserAccount).where(UserAccount.email == email)
    return db.execute(statement).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: int) -> UserAccount | None:
    statement = select(UserAccount).where(UserAccount.user_id == user_id)
    return db.execute(statement).scalar_one_or_none()


def get_guest_by_user_id(db: Session, user_id: int) -> Guest | None:
    statement = select(Guest).where(Guest.user_id == user_id)
    return db.execute(statement).scalar_one_or_none()


def get_jurisdiction_by_id(db: Session, jurisdiction_id: int) -> Jurisdiction | None:
    statement = select(Jurisdiction).where(
        Jurisdiction.jurisdiction_id == jurisdiction_id
    )
    return db.execute(statement).scalar_one_or_none()


def get_jurisdiction_by_iso_code(db: Session, iso_code: str) -> Jurisdiction | None:
    statement = select(Jurisdiction).where(Jurisdiction.iso_code == iso_code.upper())
    return db.execute(statement).scalar_one_or_none()


def get_document_type_by_id(db: Session, document_type_id: int) -> DocumentType | None:
    statement = select(DocumentType).where(
        DocumentType.document_type_id == document_type_id
    )
    return db.execute(statement).scalar_one_or_none()


def create_user(
    db: Session,
    *,
    username: str,
    email: str,
    password_hash: str,
    role_id: int,
) -> UserAccount:
    user = UserAccount(
        username=username,
        email=email,
        password_hash=password_hash,
        role_id=role_id,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def create_guest(
    db: Session,
    *,
    user_id: int,
    full_name: str,
    document_type_id: int,
    document_id: str,
    email_contact: str,
    jurisdiction_id: int,
) -> Guest:
    guest = Guest(
        user_id=user_id,
        full_name=full_name,
        document_type_id=document_type_id,
        document_id=document_id,
        contact_email=email_contact,
        jurisdiction_id=jurisdiction_id,
    )
    db.add(guest)
    db.flush()
    return guest


def get_permissions_by_role_id(db: Session, role_id: int | None) -> list[str]:
    if role_id is None:
        return []
    statement = (
        select(Permission.permission_key)
        .join(RolePermission, RolePermission.permission_id == Permission.permission_id)
        .where(RolePermission.role_id == role_id)
        .order_by(Permission.permission_key.asc())
    )
    return list(db.execute(statement).scalars().all())


def update_user_last_login(db: Session, user: UserAccount) -> None:
    user.last_login = datetime.now(timezone.utc)
    db.flush()


def get_user_block_state(db: Session, user_id: int) -> UserBlockState | None:
    statement = select(UserBlockState).where(UserBlockState.user_id == user_id)
    return db.execute(statement).scalar_one_or_none()


def clear_user_block_state(db: Session, block_state: UserBlockState) -> None:
    block_state.is_blocked = False
    block_state.blocked_until = None
    block_state.block_reason = None
    block_state.updated_at = datetime.now(timezone.utc)
    db.flush()


def upsert_user_block_state(
    db: Session,
    *,
    user_id: int,
    is_blocked: bool,
    blocked_until: datetime | None,
    block_reason: str | None,
    blocked_by_user_id: int | None,
    block_source: str,
) -> UserBlockState:
    state = get_user_block_state(db, user_id)
    if state is None:
        state = UserBlockState(
            user_id=user_id,
            is_blocked=is_blocked,
            blocked_until=blocked_until,
            block_reason=block_reason,
            blocked_by_user_id=blocked_by_user_id,
            block_source=block_source,
        )
        db.add(state)
    else:
        state.is_blocked = is_blocked
        state.blocked_until = blocked_until
        state.block_reason = block_reason
        state.blocked_by_user_id = blocked_by_user_id
        state.block_source = block_source
        state.updated_at = datetime.now(timezone.utc)

    db.flush()
    return state


def create_access_audit_log(
    db: Session,
    *,
    user_id: int,
    source_ip: str,
    information_type: str | None,
    requested_jurisdiction: str | None,
    access_result: str,
    latency_ms: int,
    rejection_reason: str | None,
) -> AccessAuditLog:
    log = AccessAuditLog(
        user_id=user_id,
        source_ip=source_ip,
        information_type=information_type,
        requested_jurisdiction=requested_jurisdiction,
        access_result=access_result,
        latency_ms=latency_ms,
        rejection_reason=rejection_reason,
    )
    db.add(log)
    db.flush()
    return log


def count_rejected_attempts_since(
    db: Session,
    *,
    user_id: int,
    since: datetime,
) -> int:
    statement = (
        select(func.count(AccessAuditLog.log_id))
        .where(AccessAuditLog.user_id == user_id)
        .where(AccessAuditLog.access_result == "REJECTED")
        .where(AccessAuditLog.attempt_timestamp >= since)
    )
    return int(db.execute(statement).scalar_one())
