# payment-service

Payment processing service using Stripe.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Add your Stripe keys to .env
```

## Run

```bash
uvicorn src.main:app --reload --port 8005
```

## Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Endpoints

- `POST /api/v1/payments/intent` - Create payment intent
- `GET /api/v1/payments/{id}/status` - Check payment status
- `POST /api/v1/payments/webhook` - Stripe webhooks
