from pydantic import BaseModel


class PaymentRequest(BaseModel):
    booking_id: str
    amount: float
    currency: str
    payment_method_token: str


class FraudScreenRequest(BaseModel):
    user_id: str
    amount: float
    country: str


class PaymentResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    payment_id: str | None = None
