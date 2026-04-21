from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.connection import Base


class PaymentTransaction(Base):
    """
    Representa una transacción de pago en el sistema.
    Se crea ANTES de llamar a Stripe para tener trazabilidad completa.
    """

    __tablename__ = "payment_transaction"

    payment_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    booking_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(
        String(128), unique=True, index=True
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")

    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    payment_method_id: Mapped[Optional[str]] = mapped_column(String(64))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    failure_code: Mapped[Optional[str]] = mapped_column(String(50))
    failure_message: Mapped[Optional[str]] = mapped_column(Text)


class WebhookEvent(Base):
    """
    Registro de eventos recibidos de Stripe via webhooks.
    Usado para idempotencia y auditoría.
    """

    __tablename__ = "webhook_event"

    event_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    stripe_event_id: Mapped[str] = mapped_column(
        String(128), unique=True, nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_id: Mapped[Optional[str]] = mapped_column(String(64))

    status: Mapped[str] = mapped_column(String(20), nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class PaymentMethod(Base):
    """
    Métodos de pago guardados del usuario (solo metadata, NO datos de tarjeta).
    Los datos sensibles están en Stripe.
    """

    __tablename__ = "payment_method"

    payment_method_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    stripe_payment_method_id: Mapped[str] = mapped_column(
        String(128), unique=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)

    card_brand: Mapped[Optional[str]] = mapped_column(String(20))
    last4_digits: Mapped[Optional[str]] = mapped_column(String(4))
    exp_month: Mapped[Optional[int]] = mapped_column(Integer)
    exp_year: Mapped[Optional[int]] = mapped_column(Integer)
    country: Mapped[Optional[str]] = mapped_column(String(2))

    is_default: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
