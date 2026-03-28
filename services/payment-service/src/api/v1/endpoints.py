from fastapi import APIRouter

from src.domain.schemas import FraudScreenRequest, PaymentRequest, PaymentResponse

router = APIRouter(prefix="/payments")


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
