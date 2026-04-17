# Stripe Payment Integration - Frontend

## Setup

1. Install dependencies (already done):
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

2. Add environment variables to `.env`:
```
VITE_PAYMENT_API_URL=http://localhost:8005
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51TLw9h1OQGmvzWnQuLdVF3czhNz5oGtpMsbUQMxXyRdUa4ENew6PTntwA62yfhqglHbxrdf8WQduSSjXKMFiBFQ500PzxxuHiC
```

## New Files

- `src/services/paymentService.ts` - API client for payment backend
- `src/components/CheckoutForm/index.tsx` - Stripe Elements form component
- `src/pages/CheckoutPayment/index.tsx` - Payment page with Stripe integration
- `src/pages/PaymentConfirmation/index.tsx` - Success page after payment

## Routes Added

- `/checkout/payment` - Stripe payment form page
- `/payment-confirmation` - Success confirmation page

## How It Works

1. User goes to `/checkout/payment?booking_id=xxx&amount=250&currency=USD`
2. `CheckoutPayment` page loads Stripe Elements
3. `CheckoutForm` component handles the payment flow:
   - Calls `createPaymentIntent()` to get `client_secret` from backend
   - User enters card details (data goes directly to Stripe, never to our server)
   - Confirms payment with `stripe.confirmCardPayment()`
   - Polls `getPaymentStatus()` until backend confirms via webhook
   - Redirects to `/payment-confirmation?code=TH-12345`

## Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date, any CVV

## TODO / Customize

- [ ] Integrate with existing Checkout page flow
- [ ] Add translations (i18n)
- [ ] Style to match TravelHub design system
- [ ] Add error handling UI
- [ ] Connect to CartContext for booking IDs
- [ ] Add loading states and better UX

## Questions?

Check the backend README: `services/payment-service/README.md`
