from sqlalchemy import select
from sqlalchemy.orm import Session

from src.infrastructure.database.models import Guest, Jurisdiction, Role, UserAccount


def get_role_id_by_name(db: Session, role_name: str) -> int | None:
    statement = select(Role.role_id).where(Role.role_name == role_name)
    return db.execute(statement).scalar_one_or_none()


def get_user_by_email(db: Session, email: str) -> UserAccount | None:
    statement = select(UserAccount).where(UserAccount.email == email)
    return db.execute(statement).scalar_one_or_none()


def get_jurisdiction_by_id(db: Session, jurisdiction_id: int) -> Jurisdiction | None:
    statement = select(Jurisdiction).where(
        Jurisdiction.jurisdiction_id == jurisdiction_id
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
    document_id: str,
    email_contact: str,
    jurisdiction_id: int,
) -> Guest:
    guest = Guest(
        user_id=user_id,
        full_name=full_name,
        document_id=document_id,
        contact_email=email_contact,
        jurisdiction_id=jurisdiction_id,
    )
    db.add(guest)
    db.flush()
    return guest
