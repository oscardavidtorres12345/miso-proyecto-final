from decimal import Decimal
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from src.domain.services.payment_service import (
    PaymentService,
    PaymentNotFoundError,
    PaymentValidationError,
    PaymentConflictError,
)
from src.infrastructure.database.models import PaymentTransaction


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def mock_booking_client():
    return MagicMock()


@pytest.fixture
def mock_stripe_client():
    return MagicMock()


@pytest.fixture
def payment_service(mock_booking_client, mock_stripe_client):
    return PaymentService(
        booking_client=mock_booking_client,
        stripe_client=mock_stripe_client,
    )


class TestCreatePaymentIntent:
    def test_creates_payment_successfully(
        self, payment_service, mock_db, mock_booking_client, mock_stripe_client
    ):
        # Arrange
        booking_id = str(uuid4())
        user_id = "test_user"
        amount = 100.0
        currency = "USD"

        mock_booking_client.get_booking_batch.return_value = {
            "booking_id": booking_id,
            "user_id": user_id,
            "bookings": [{"booking_id": "bk-1", "status": "ON_HOLD"}],
        }

        mock_stripe_client.create_payment_intent.return_value = {
            "id": "pi_123",
            "client_secret": "client_secret_123",
        }
        payment_service.get_by_booking_id = MagicMock(return_value=None)

        # Act
        payment, client_secret = payment_service.create_payment_intent(
            db=mock_db,
            booking_id=booking_id,
            user_id=user_id,
            amount=amount,
            currency=currency,
        )

        # Assert
        assert payment.booking_id == booking_id
        assert payment.amount == Decimal("100.0")
        assert payment.currency == "USD"
        assert payment.status == "PROCESSING"
        assert client_secret == "client_secret_123"
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called()

    def test_raises_error_when_booking_not_on_hold(
        self, payment_service, mock_db, mock_booking_client
    ):
        # Arrange
        mock_booking_client.get_booking_batch.return_value = {
            "booking_id": "123",
            "user_id": "user1",
            "bookings": [{"booking_id": "bk-1", "status": "CONFIRMED"}],
        }

        # Act & Assert
        with pytest.raises(PaymentValidationError, match="not in ON_HOLD status"):
            payment_service.create_payment_intent(
                db=mock_db,
                booking_id="123",
                user_id="user1",
                amount=100.0,
                currency="USD",
            )

    def test_raises_error_when_payment_already_exists(
        self, payment_service, mock_db, mock_booking_client
    ):
        # Arrange
        mock_booking_client.get_booking_batch.return_value = {
            "booking_id": "123",
            "user_id": "user1",
            "bookings": [{"booking_id": "bk-1", "status": "ON_HOLD"}],
        }

        existing_payment = PaymentTransaction(
            payment_id="existing_id",
            booking_id="123",
            amount=Decimal("100"),
            currency="USD",
            status="COMPLETED",
        )
        payment_service.get_by_booking_id = MagicMock(return_value=existing_payment)

        # Act & Assert
        with pytest.raises(PaymentConflictError, match="already exists"):
            payment_service.create_payment_intent(
                db=mock_db,
                booking_id="123",
                user_id="user1",
                amount=100.0,
                currency="USD",
            )

    def test_reuses_pending_payment_with_existing_intent(
        self, payment_service, mock_db, mock_booking_client, mock_stripe_client
    ):
        # Arrange
        mock_booking_client.get_booking_batch.return_value = {
            "booking_id": "123",
            "user_id": "user1",
            "bookings": [{"booking_id": "bk-1", "status": "ON_HOLD"}],
        }

        existing_payment = PaymentTransaction(
            payment_id="existing_id",
            booking_id="123",
            amount=Decimal("100"),
            currency="USD",
            status="PENDING",
            stripe_payment_intent_id="pi_existing",
        )
        payment_service.get_by_booking_id = MagicMock(return_value=existing_payment)
        mock_stripe_client.retrieve_payment_intent.return_value = {
            "client_secret": "existing_secret"
        }

        # Act
        payment, client_secret = payment_service.create_payment_intent(
            db=mock_db,
            booking_id="123",
            user_id="user1",
            amount=100.0,
            currency="USD",
        )

        # Assert
        assert payment.payment_id == "existing_id"
        assert client_secret == "existing_secret"
        mock_stripe_client.retrieve_payment_intent.assert_called_once_with(
            "pi_existing"
        )

    def test_handles_stripe_error_with_rollback(
        self, payment_service, mock_db, mock_booking_client, mock_stripe_client
    ):
        # Arrange
        from src.infrastructure.clients import StripeClientError

        mock_booking_client.get_booking_batch.return_value = {
            "booking_id": "123",
            "user_id": "user1",
            "bookings": [{"booking_id": "bk-1", "status": "ON_HOLD"}],
        }
        payment_service.get_by_booking_id = MagicMock(return_value=None)
        mock_stripe_client.create_payment_intent.side_effect = StripeClientError(
            "Stripe API error"
        )

        # Act & Assert
        from src.domain.services.payment_service import PaymentGatewayError

        with pytest.raises(PaymentGatewayError, match="Stripe error"):
            payment_service.create_payment_intent(
                db=mock_db,
                booking_id="123",
                user_id="user1",
                amount=100.0,
                currency="USD",
            )

        mock_db.rollback.assert_called_once()


class TestMarkAsCompleted:
    def test_marks_payment_as_completed(self, payment_service, mock_db):
        # Arrange
        payment = PaymentTransaction(
            payment_id="pay_123",
            booking_id="book_123",
            stripe_payment_intent_id="pi_123",
            amount=Decimal("100"),
            currency="USD",
            status="PROCESSING",
        )
        payment_service.get_by_stripe_intent_id = MagicMock(return_value=payment)

        # Act
        result = payment_service.mark_as_completed(
            db=mock_db,
            stripe_payment_intent_id="pi_123",
        )

        # Assert
        assert result.status == "COMPLETED"
        assert result.completed_at is not None
        mock_db.commit.assert_called()

    def test_raises_error_when_payment_not_found(self, payment_service, mock_db):
        # Arrange
        payment_service.get_by_stripe_intent_id = MagicMock(
            side_effect=PaymentNotFoundError("Not found")
        )

        # Act & Assert
        with pytest.raises(PaymentNotFoundError):
            payment_service.mark_as_completed(
                db=mock_db,
                stripe_payment_intent_id="nonexistent",
            )


class TestMarkAsFailed:
    def test_marks_payment_as_failed(self, payment_service, mock_db):
        # Arrange
        payment = PaymentTransaction(
            payment_id="pay_123",
            booking_id="book_123",
            stripe_payment_intent_id="pi_123",
            amount=Decimal("100"),
            currency="USD",
            status="PROCESSING",
        )
        payment_service.get_by_stripe_intent_id = MagicMock(return_value=payment)

        # Act
        result = payment_service.mark_as_failed(
            db=mock_db,
            stripe_payment_intent_id="pi_123",
            failure_code="card_declined",
            failure_message="Card was declined",
        )

        # Assert
        assert result.status == "FAILED"
        assert result.failure_code == "card_declined"
        assert result.failure_message == "Card was declined"
        mock_db.commit.assert_called()


class TestGetById:
    def test_returns_payment_when_found(self, payment_service, mock_db):
        # Arrange
        payment = PaymentTransaction(
            payment_id="pay_123",
            booking_id="book_123",
            amount=Decimal("100"),
            currency="USD",
            status="COMPLETED",
        )
        mock_db.get.return_value = payment

        # Act
        result = payment_service.get_by_id(mock_db, "pay_123")

        # Assert
        assert result.payment_id == "pay_123"
        mock_db.get.assert_called_once_with(PaymentTransaction, "pay_123")

    def test_raises_error_when_not_found(self, payment_service, mock_db):
        # Arrange
        mock_db.get.return_value = None

        # Act & Assert
        with pytest.raises(PaymentNotFoundError):
            payment_service.get_by_id(mock_db, "nonexistent")


class TestGetByBookingId:
    def test_returns_payment_when_found(self, payment_service, mock_db):
        # Arrange
        payment = PaymentTransaction(
            payment_id="pay_123",
            booking_id="book_123",
            amount=Decimal("100"),
            currency="USD",
            status="COMPLETED",
        )
        mock_db.execute.return_value.scalar_one_or_none.return_value = payment

        # Act
        result = payment_service.get_by_booking_id(mock_db, "book_123")

        # Assert
        assert result.booking_id == "book_123"

    def test_returns_none_when_not_found(self, payment_service, mock_db):
        # Arrange
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        # Act
        result = payment_service.get_by_booking_id(mock_db, "nonexistent")

        # Assert
        assert result is None


class TestGetByStripeIntentId:
    def test_returns_payment_when_found(self, payment_service, mock_db):
        # Arrange
        payment = PaymentTransaction(
            payment_id="pay_123",
            booking_id="book_123",
            stripe_payment_intent_id="pi_123",
            amount=Decimal("100"),
            currency="USD",
            status="COMPLETED",
        )
        mock_db.execute.return_value.scalar_one_or_none.return_value = payment

        # Act
        result = payment_service.get_by_stripe_intent_id(mock_db, "pi_123")

        # Assert
        assert result.stripe_payment_intent_id == "pi_123"

    def test_raises_error_when_not_found(self, payment_service, mock_db):
        # Arrange
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        # Act & Assert
        with pytest.raises(PaymentNotFoundError):
            payment_service.get_by_stripe_intent_id(mock_db, "nonexistent")
