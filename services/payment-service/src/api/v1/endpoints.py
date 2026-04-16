import os

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from src.domain.schemas import (
    FraudScreenRequest,
    PaymentIntentRequest,
    PaymentIntentResponse,
    PaymentRequest,
    PaymentResponse,
    PaymentStatus,
    PaymentStatusResponse,
)
from src.domain.services.payment_service import (
    PaymentConflictError,
    PaymentGatewayError,
    PaymentNotFoundError,
    PaymentValidationError,
    payment_service,
)
from src.domain.services.webhook_service import webhook_service
from src.infrastructure.clients import booking_client, BookingClientError
from src.infrastructure.database.connection import get_db

router = APIRouter(prefix="/payments")


@router.post("/intent", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
def create_payment_intent(
    payload: PaymentIntentRequest,
    db: Session = Depends(get_db),
) -> PaymentIntentResponse:
    # TODO: Add authentication and extract user_id from JWT
    user_id = "user_test_123"

    try:
        payment, client_secret = payment_service.create_payment_intent(
            db=db,
            booking_id=payload.booking_id,
            user_id=user_id,
        )

        return PaymentIntentResponse(
            payment_id=payment.payment_id,
            client_secret=client_secret,
            publishable_key=os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_placeholder"),
            amount=payment.amount,
            currency=payment.currency,
            status=PaymentStatus(payment.status),
        )

    except PaymentValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PaymentConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except PaymentGatewayError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Payment gateway error: {str(e)}",
        )


@router.get("/{payment_id}/status", response_model=PaymentStatusResponse)
def get_payment_status(payment_id: str, db: Session = Depends(get_db)) -> PaymentStatusResponse:
    try:
        payment = payment_service.get_by_id(db, payment_id)

        response = PaymentStatusResponse(
            payment_id=payment.payment_id,
            booking_id=payment.booking_id,
            status=PaymentStatus(payment.status),
            amount=payment.amount,
            currency=payment.currency,
            created_at=payment.created_at,
            completed_at=payment.completed_at,
            failure_code=payment.failure_code,
            failure_message=payment.failure_message,
        )

        if payment.status == PaymentStatus.COMPLETED.value:
            try:
                booking = booking_client.get_booking(payment.booking_id)
                response.booking_confirmation_code = booking.get("booking_id", "TH-XXXXX")
            except BookingClientError:
                pass

        return response

    except PaymentNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Webhook secret not configured")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    if webhook_service.is_already_processed(db, event["id"]):
        return {"status": "already_processed"}

    payment_intent = event["data"]["object"]
    webhook_event = webhook_service.create_webhook_event(
        db=db,
        stripe_event_id=event["id"],
        event_type=event["type"],
        payload=event["data"]["object"],
        payment_id=payment_intent.get("metadata", {}).get("payment_id"),
    )

    try:
        webhook_service.mark_as_processing(db, webhook_event.event_id)

        if event["type"] == "payment_intent.succeeded":
            payment = payment_service.mark_as_completed(db=db, stripe_payment_intent_id=payment_intent["id"])

            try:
                booking_client.confirm_booking(payment.booking_id, payment.payment_id)
            except BookingClientError as e:
                print(f"Failed to confirm booking: {e}")

        elif event["type"] == "payment_intent.payment_failed":
            error = payment_intent.get("last_payment_error", {})
            payment_service.mark_as_failed(
                db=db,
                stripe_payment_intent_id=payment_intent["id"],
                failure_code=error.get("code"),
                failure_message=error.get("message")
            )

        webhook_service.mark_as_processed(db, webhook_event.event_id)

    except Exception as e:
        webhook_service.mark_as_failed(db, webhook_event.event_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Webhook processing failed: {str(e)}")

    return {"status": "success"}


@router.post("/authorize", response_model=PaymentResponse)
def authorize_payment(payload: PaymentRequest) -> PaymentResponse:
    _ = payload
    return PaymentResponse(status="not_implemented", sprint=2, hu_id="HU008")


@router.post("/fraud/screen")
def fraud_screen(payload: FraudScreenRequest) -> dict:
    _ = payload
    return {
        "status": "not_implemented",
        "sprint": 2,
        "hu_id": "HU024",
        "risk_score": None,
    }


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
def refund(payment_id: str) -> PaymentResponse:
    return PaymentResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU009",
        payment_id=payment_id,
    )


@router.get("/fx/quote")
def fx_quote(from_currency: str, to_currency: str, amount: float) -> dict:
    _ = (from_currency, to_currency, amount)
    return {"status": "not_implemented", "sprint": 3, "hu_id": "HU020"}
