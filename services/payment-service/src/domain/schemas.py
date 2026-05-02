from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    REQUIRES_ACTION = "REQUIRES_ACTION"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class WebhookEventStatus(str, Enum):
    RECEIVED = "RECEIVED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"


class PaymentIntentRequest(BaseModel):
    booking_id: str = Field(min_length=1, max_length=64)
    user_id: str = Field(min_length=1, max_length=120)
    amount: Optional[float] = None
    currency: Optional[str] = None


class PaymentRequest(BaseModel):
    booking_id: str
    amount: float
    currency: str
    payment_method_token: str


class FraudScreenRequest(BaseModel):
    user_id: str
    amount: float
    country: str


class PaymentIntentResponse(BaseModel):
    payment_id: str
    client_secret: str
    publishable_key: str
    amount: Decimal
    currency: str
    status: PaymentStatus


class PaymentStatusResponse(BaseModel):
    payment_id: str
    booking_id: str
    status: PaymentStatus
    amount: Decimal
    currency: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    failure_code: Optional[str] = None
    failure_message: Optional[str] = None
    booking_confirmation_code: Optional[str] = None


class PaymentResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    payment_id: Optional[str] = None


class PaymentTransactionSummary(BaseModel):
    payment_id: str
    booking_id: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    created_at: datetime
    completed_at: Optional[datetime] = None


class CurrencyDetail(BaseModel):
    display_currency: str
    charge_currency: str
    base_currency: str
    rate_used: float
    source: str
    charge_notice: str


class FxQuoteResponse(BaseModel):
    source_currency: str
    source_amount: float
    converted_amount: float
    currency_detail: CurrencyDetail
