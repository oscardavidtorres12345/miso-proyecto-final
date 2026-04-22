from datetime import datetime
from uuid import UUID

from sqlalchemy.dialects.postgresql import INET, UUID as PGUUID
from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.connection import Base


class Role(Base):
    __tablename__ = "role"

    role_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class UserAccount(Base):
    __tablename__ = "user_account"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role_id: Mapped[int | None] = mapped_column(ForeignKey("role.role_id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Permission(Base):
    __tablename__ = "permission"

    permission_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    permission_key: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text)


class RolePermission(Base):
    __tablename__ = "role_permission"

    role_id: Mapped[int] = mapped_column(ForeignKey("role.role_id"), primary_key=True)
    permission_id: Mapped[int] = mapped_column(
        ForeignKey("permission.permission_id"),
        primary_key=True,
    )


class Jurisdiction(Base):
    __tablename__ = "jurisdiction"

    jurisdiction_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    iso_code: Mapped[str] = mapped_column(String(2), unique=True, nullable=False)
    region_name: Mapped[str] = mapped_column(String(50), nullable=False)
    applicable_regulation: Mapped[str] = mapped_column(String(50), nullable=False)
    privacy_title: Mapped[str] = mapped_column(String(200), nullable=False)
    privacy_content: Mapped[str] = mapped_column(Text, nullable=False)
    privacy_pdf_url: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    privacy_version: Mapped[str] = mapped_column(String(30), nullable=False)
    privacy_effective_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    privacy_contact_email: Mapped[str] = mapped_column(String(100), nullable=False)


class DocumentType(Base):
    __tablename__ = "document_type"

    document_type_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_type_name: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text)


class Guest(Base):
    __tablename__ = "guest"

    guest_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("user_account.user_id"))
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    document_type_id: Mapped[int] = mapped_column(
        ForeignKey("document_type.document_type_id"), nullable=False
    )
    document_id: Mapped[str] = mapped_column(String(50), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String(100))
    jurisdiction_id: Mapped[int] = mapped_column(
        ForeignKey("jurisdiction.jurisdiction_id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.current_timestamp(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AccessAuditLog(Base):
    __tablename__ = "access_audit_log"

    log_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_account.user_id"), nullable=False
    )
    source_ip: Mapped[str] = mapped_column(
        INET().with_variant(String(45), "sqlite"),
        nullable=False,
    )
    information_type: Mapped[str | None] = mapped_column(String(100))
    requested_jurisdiction: Mapped[str | None] = mapped_column(String(2))
    access_result: Mapped[str] = mapped_column(String(20), nullable=False)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    attempt_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.current_timestamp(), nullable=False
    )


class UserBlockState(Base):
    __tablename__ = "user_block_state"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_account.user_id"),
        primary_key=True,
    )
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    blocked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    block_reason: Mapped[str | None] = mapped_column(String(255))
    blocked_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user_account.user_id")
    )
    block_source: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="SYSTEM",
    )
    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="MEDIUM",
    )
    unblock_policy: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="MANUAL_ONLY",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.current_timestamp(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.current_timestamp(),
        nullable=False,
    )


class SecurityEvent(Base):
    __tablename__ = "security_event"

    event_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    correlation_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True).with_variant(String(36), "sqlite"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="OPEN", index=True
    )
    source_service: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        default="identity-service",
    )
    source_log_id: Mapped[int | None] = mapped_column(
        ForeignKey("access_audit_log.log_id")
    )
    actor_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user_account.user_id")
    )
    target_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user_account.user_id"),
        index=True,
    )
    source_ip: Mapped[str | None] = mapped_column(
        INET().with_variant(String(45), "sqlite"),
    )
    session_id: Mapped[str | None] = mapped_column(String(128))
    device_fingerprint: Mapped[str | None] = mapped_column(String(128))
    gateway: Mapped[str | None] = mapped_column(String(30))
    payment_ref: Mapped[str | None] = mapped_column(String(80))
    gateway_event_id: Mapped[str | None] = mapped_column(String(120))
    rule_code: Mapped[str | None] = mapped_column(String(80))
    attempts_count: Mapped[int | None] = mapped_column(Integer)
    threshold_value: Mapped[int | None] = mapped_column(Integer)
    action_taken: Mapped[str | None] = mapped_column(String(80))
    blocked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    event_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.current_timestamp(),
        nullable=False,
    )
    alert_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    event_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
    )
