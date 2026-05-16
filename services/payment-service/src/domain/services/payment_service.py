from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Tuple
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.domain.schemas import PaymentStatus, PaymentTransactionSummary
from src.domain.services.currency_conversion_service import (
    CurrencyConversionError,
    currency_conversion_service,
)
from src.infrastructure.database.models import PaymentTransaction
from src.infrastructure.clients import (
    BookingClient,
    BookingClientError,
    BookingTransportError,
    StripeClient,
    StripeClientError,
    booking_client,
    stripe_client,
)


class PaymentNotFoundError(Exception):
    pass


class PaymentConflictError(Exception):
    pass


class PaymentValidationError(Exception):
    pass


class PaymentGatewayError(Exception):
    pass


class PaymentService:
    def __init__(
        self,
        booking_client: BookingClient = booking_client,
        stripe_client: StripeClient = stripe_client,
    ):
        self.booking_client = booking_client
        self.stripe_client = stripe_client

    def create_payment_intent(
        self,
        db: Session,
        *,
        booking_id: str,
        user_id: str,
        amount: Optional[float] = None,
        currency: Optional[str] = None,
    ) -> Tuple[PaymentTransaction, str]:
        # Validar booking batch
        try:
            booking_batch = self.booking_client.get_booking_batch(booking_id)
        except BookingTransportError as e:
            raise PaymentValidationError("Booking service unavailable") from e
        except BookingClientError as e:
            if e.status_code == 404:
                raise PaymentValidationError("Booking batch not found") from e
            raise PaymentValidationError(
                f"Booking validation failed: {e.detail}"
            ) from e

        if booking_batch.get("user_id") != user_id:
            raise PaymentValidationError("Booking batch does not belong to user")

        bookings = booking_batch.get("bookings", [])
        if not bookings:
            raise PaymentValidationError("Booking batch has no bookings")

        non_hold_booking = next(
            (entry for entry in bookings if entry.get("status") != "ON_HOLD"),
            None,
        )
        if non_hold_booking:
            raise PaymentValidationError(
                f"Booking {non_hold_booking.get('booking_id')} is not in ON_HOLD status "
                f"(current: {non_hold_booking.get('status')})"
            )

        existing = self.get_by_booking_id(db, booking_id)
        if existing:
            if existing.status in [
                PaymentStatus.COMPLETED.value,
                PaymentStatus.PROCESSING.value,
            ]:
                raise PaymentConflictError("Payment already exists for this booking")

            if (
                existing.status == PaymentStatus.PENDING.value
                and existing.stripe_payment_intent_id
            ):
                pi = self.stripe_client.retrieve_payment_intent(
                    existing.stripe_payment_intent_id
                )
                return existing, pi["client_secret"]

        resolved_amount = amount if amount is not None else 0
        resolved_currency = currency if currency is not None else "USD"

        payment = PaymentTransaction(
            payment_id=str(uuid4()),
            booking_id=booking_id,
            amount=Decimal(str(resolved_amount or 0)),
            currency=resolved_currency,
            status=PaymentStatus.PENDING.value,
            created_at=datetime.now(timezone.utc),
        )
        db.add(payment)
        db.flush()

        try:
            payment_intent = self.stripe_client.create_payment_intent(
                amount=payment.amount,
                currency=payment.currency,
                metadata={
                    "payment_id": payment.payment_id,
                    "booking_id": booking_id,
                    "user_id": user_id,
                },
            )
        except StripeClientError as e:
            db.rollback()
            raise PaymentGatewayError(f"Stripe error: {str(e)}") from e

        payment.stripe_payment_intent_id = payment_intent["id"]
        payment.status = PaymentStatus.PROCESSING.value
        payment.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(payment)

        return payment, payment_intent["client_secret"]

    def _validate_booking_ownership_and_status(
        self, *, booking: dict, user_id: str
    ) -> None:
        bookings = booking.get("bookings")
        if isinstance(bookings, list):
            if not bookings:
                raise PaymentValidationError("Booking batch has no bookings")

            for entry in bookings:
                if not isinstance(entry, dict):
                    raise PaymentValidationError("Booking batch payload is invalid")
                if entry.get("status") != "ON_HOLD":
                    raise PaymentValidationError(
                        f"Booking is not in ON_HOLD status (current: {entry.get('status')})"
                    )
                if entry.get("user_id") != user_id:
                    raise PaymentValidationError("Booking does not belong to user")
            return

        if booking.get("status") != "ON_HOLD":
            raise PaymentValidationError(
                f"Booking is not in ON_HOLD status (current: {booking.get('status')})"
            )

        if booking.get("user_id") != user_id:
            raise PaymentValidationError("Booking does not belong to user")

    def get_by_id(self, db: Session, payment_id: str) -> PaymentTransaction:
        entry = db.get(PaymentTransaction, payment_id)
        if entry is None:
            raise PaymentNotFoundError("Payment not found")
        return entry

    def get_by_booking_id(
        self, db: Session, booking_id: str
    ) -> Optional[PaymentTransaction]:
        stmt = select(PaymentTransaction).where(
            PaymentTransaction.booking_id == booking_id
        )
        return db.execute(stmt).scalar_one_or_none()

    def get_by_stripe_intent_id(
        self, db: Session, stripe_payment_intent_id: str
    ) -> PaymentTransaction:
        stmt = select(PaymentTransaction).where(
            PaymentTransaction.stripe_payment_intent_id == stripe_payment_intent_id
        )
        entry = db.execute(stmt).scalar_one_or_none()
        if entry is None:
            raise PaymentNotFoundError(
                f"Payment with stripe_intent_id {stripe_payment_intent_id} not found"
            )
        return entry

    def mark_as_completed(
        self, db: Session, stripe_payment_intent_id: str
    ) -> PaymentTransaction:
        payment = self.get_by_stripe_intent_id(db, stripe_payment_intent_id)

        if payment.status == PaymentStatus.COMPLETED.value:
            return payment

        if payment.status in [
            PaymentStatus.FAILED.value,
            PaymentStatus.CANCELLED.value,
            PaymentStatus.REFUNDED.value,
        ]:
            raise PaymentConflictError(
                f"Cannot complete payment in status {payment.status}"
            )

        payment.status = PaymentStatus.COMPLETED.value
        payment.updated_at = datetime.now(timezone.utc)
        payment.completed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(payment)

        return payment

    def mark_as_failed(
        self,
        db: Session,
        stripe_payment_intent_id: str,
        failure_code: Optional[str] = None,
        failure_message: Optional[str] = None,
    ) -> PaymentTransaction:
        payment = self.get_by_stripe_intent_id(db, stripe_payment_intent_id)

        if payment.status == PaymentStatus.FAILED.value:
            return payment

        payment.status = PaymentStatus.FAILED.value
        payment.failure_code = failure_code
        payment.failure_message = failure_message
        payment.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(payment)

        return payment

    def refund_payment(self, db: Session, payment_id: str) -> PaymentTransaction:
        payment = self.get_by_id(db, payment_id)

        if payment.status == PaymentStatus.REFUNDED.value:
            return payment

        if payment.status != PaymentStatus.COMPLETED.value:
            raise PaymentConflictError(
                f"Cannot refund payment in status {payment.status}"
            )

        if not payment.stripe_payment_intent_id:
            raise PaymentValidationError("Payment has no associated Stripe intent")

        try:
            refund = self.stripe_client.create_refund(
                payment_intent_id=payment.stripe_payment_intent_id
            )
        except StripeClientError as e:
            raise PaymentGatewayError(f"Stripe refund failed: {str(e)}") from e

        payment.status = PaymentStatus.REFUNDED.value
        payment.updated_at = datetime.now(timezone.utc)
        # Store refund id in failure_code temporarily or add a new column later
        # For now we just mark as refunded
        _ = refund

        db.commit()
        db.refresh(payment)

        return payment

    def list_by_user(
        self, db: Session, user_id: str
    ) -> list[PaymentTransactionSummary]:
        return []

    def quote_display_currency(
        self,
        db: Session,
        *,
        source_currency: str,
        display_currency: str,
        amount: float,
        charge_currency: str | None = None,
    ) -> dict:
        resolved_charge_currency = (charge_currency or display_currency).upper()

        try:
            display_conversion = currency_conversion_service.convert_amount(
                db,
                amount=amount,
                source_currency=source_currency,
                target_currency=display_currency,
            )
            charge_conversion = currency_conversion_service.convert_amount(
                db,
                amount=amount,
                source_currency=source_currency,
                target_currency=resolved_charge_currency,
            )
        except CurrencyConversionError as e:
            raise PaymentValidationError(str(e)) from e

        quote_source = (
            display_conversion.legs[-1].source
            if display_conversion.legs
            else "identity"
        )
        charge_notice = (
            f"El cobro final se realizara en {resolved_charge_currency}."
            if resolved_charge_currency != display_conversion.target_currency
            else "El cobro final se realizara en la moneda seleccionada."
        )
        return {
            "source_currency": display_conversion.source_currency,
            "source_amount": display_conversion.source_amount,
            "converted_amount": display_conversion.converted_amount,
            "charge_amount": charge_conversion.converted_amount,
            "currency_detail": {
                "display_currency": display_conversion.target_currency,
                "charge_currency": resolved_charge_currency,
                "base_currency": display_conversion.source_currency,
                "rate_used": display_conversion.rate_used,
                "source": quote_source,
                "charge_notice": charge_notice,
            },
        }


payment_service = PaymentService()
