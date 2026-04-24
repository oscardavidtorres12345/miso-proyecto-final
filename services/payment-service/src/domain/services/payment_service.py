from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Tuple
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.domain.schemas import PaymentStatus, PaymentTransactionSummary
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
        # Validar booking
        try:
            booking = self.booking_client.get_booking(booking_id)
        except BookingTransportError as e:
            raise PaymentValidationError("Booking service unavailable") from e
        except BookingClientError as e:
            if e.status_code == 404:
                try:
                    booking = self.booking_client.get_booking_batch(booking_id)
                except BookingTransportError as inner_e:
                    raise PaymentValidationError(
                        "Booking service unavailable"
                    ) from inner_e
                except BookingClientError as inner_e:
                    if inner_e.status_code == 404:
                        raise PaymentValidationError("Booking not found") from inner_e
                    raise PaymentValidationError(
                        f"Booking validation failed: {inner_e.detail}"
                    ) from inner_e
            else:
                raise PaymentValidationError(
                    f"Booking validation failed: {e.detail}"
                ) from e

        self._validate_booking_ownership_and_status(booking=booking, user_id=user_id)

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

        resolved_amount = amount if amount is not None else booking.get("total_amount")
        resolved_currency = (
            currency if currency is not None else booking.get("currency", "USD")
        )

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

    def list_by_user(
        self, db: Session, user_id: str
    ) -> list[PaymentTransactionSummary]:
        return []


payment_service = PaymentService()
