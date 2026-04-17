import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutForm } from '@/components/CheckoutForm';
import Container from '@/components/Container';
import LoadingSpinner from '@/components/LoadingSpinner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutPayment = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id') || '';
  const amount = parseFloat(searchParams.get('amount') || '0');
  const currency = searchParams.get('currency') || 'USD';

  if (!bookingId) {
    return (
      <Container>
        <div className="py-12 text-center">
          <p className="text-red-600">No booking ID provided</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Secure Payment</h1>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="font-semibold mb-4">Booking Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Booking ID:</span>
              <span className="font-mono text-sm">{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                }).format(amount)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              bookingId={bookingId}
              amount={amount}
              currency={currency}
            />
          </Elements>
        </div>

        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>Your payment information is secured by Stripe.</p>
          <p className="mt-2">Test cards: 4242 4242 4242 4242 (success) | 4000 0000 0000 0002 (decline)</p>
        </div>
      </div>
    </Container>
  );
};

export default CheckoutPayment;
