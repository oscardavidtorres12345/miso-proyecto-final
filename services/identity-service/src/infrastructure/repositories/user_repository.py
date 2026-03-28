from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.infrastructure.database.models import (
    AccessAuditLog,
    DocumentType,
    Guest,
    Jurisdiction,
    Permission,
    Role,
    RolePermission,
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


def get_jurisdiction_by_id(db: Session, jurisdiction_id: int) -> Jurisdiction | None:
    statement = select(Jurisdiction).where(
        Jurisdiction.jurisdiction_id == jurisdiction_id
    )
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
