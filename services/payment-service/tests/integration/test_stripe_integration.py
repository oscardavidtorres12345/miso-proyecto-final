import os
from decimal import Decimal

import pytest
import stripe

from src.infrastructure.clients import StripeClient, StripeClientError


pytestmark = pytest.mark.skipif(
    not os.getenv("STRIPE_SECRET_KEY") or os.getenv("STRIPE_SECRET_KEY") == "sk_test_placeholder",
    reason="STRIPE_SECRET_KEY not configured"
)


class TestStripeIntegration:
    def test_create_payment_intent_success(self):
        client = StripeClient()
        
        result = client.create_payment_intent(
            amount=Decimal("100.00"),
            currency="USD",
            metadata={
                "payment_id": "test_payment_123",
                "booking_id": "test_booking_456",
                "user_id": "test_user_789",
            }
        )
        
        assert result["id"].startswith("pi_")
        assert "client_secret" in result
        assert result["amount"] == 10000  # 100.00 USD in cents
        assert result["currency"] == "usd"
        assert result["metadata"]["payment_id"] == "test_payment_123"
        
        stripe.PaymentIntent.cancel(result["id"])
    
    def test_retrieve_payment_intent(self):
        client = StripeClient()
        
        created = client.create_payment_intent(
            amount=Decimal("50.00"),
            currency="USD",
            metadata={"test": "retrieve"}
        )
        
        retrieved = client.retrieve_payment_intent(created["id"])
        
        assert retrieved["id"] == created["id"]
        assert retrieved["amount"] == 5000
        
        stripe.PaymentIntent.cancel(created["id"])
    
    def test_create_payment_intent_different_currencies(self):
        client = StripeClient()
        
        for currency in ["USD", "EUR", "GBP"]:
            result = client.create_payment_intent(
                amount=Decimal("25.00"),
                currency=currency,
                metadata={"currency_test": currency}
            )
            
            assert result["currency"] == currency.lower()
            stripe.PaymentIntent.cancel(result["id"])
    
    def test_create_payment_intent_without_api_key(self):
        old_key = os.environ.get("STRIPE_SECRET_KEY")
        os.environ["STRIPE_SECRET_KEY"] = ""

        client = StripeClient()

        with pytest.raises(StripeClientError, match="STRIPE_SECRET_KEY not configured"):
            client.create_payment_intent(
                amount=Decimal("10.00"),
                currency="USD",
                metadata={}
            )

        if old_key:
            os.environ["STRIPE_SECRET_KEY"] = old_key
