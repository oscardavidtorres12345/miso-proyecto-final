import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/currency';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, getPaymentStatus } from '@/services/paymentService';

interface CheckoutFormProps {
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
}

export const CheckoutForm = ({ bookingId, userId, amount, currency }: CheckoutFormProps) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 15;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const status = await getPaymentStatus(paymentId);
        
        if (status.status === 'COMPLETED') {
          clearInterval(interval);
          navigate(`/payment-confirmation?code=${status.booking_confirmation_code || bookingId}`);
        } else if (status.status === 'FAILED') {
          clearInterval(interval);
          setError(t('checkout.payment.form.errorFailed'));
          setProcessing(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError(t('checkout.payment.form.errorTimeout'));
          setProcessing(false);
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 2000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { client_secret, payment_id } = await createPaymentIntent(bookingId, userId, amount, currency);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (result.error) {
        setError(result.error.message || t('checkout.payment.form.errorDeclined'));
        setProcessing(false);
      } else {
        setSucceeded(true);
        pollPaymentStatus(payment_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkout.payment.form.errorGeneric'));
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('checkout.payment.form.cardDetails')}
        </label>
        <div className="border rounded-lg p-4 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t('checkout.payment.form.securedByStripe')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between mb-4">
          <span className="font-semibold">{t('checkout.payment.total')}</span>
          <span className="font-bold text-lg">
            {formatCurrency(amount, currency)}
          </span>
        </div>

        <button
          type="submit"
          disabled={!stripe || processing || succeeded}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? t('checkout.payment.form.processing') : succeeded ? t('checkout.payment.form.paymentSuccessful') : t('checkout.payment.form.confirmPayment')}
        </button>
      </div>

      {succeeded && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-center">
          {t('checkout.payment.form.successMessage')}
        </div>
      )}
    </form>
  );
};
