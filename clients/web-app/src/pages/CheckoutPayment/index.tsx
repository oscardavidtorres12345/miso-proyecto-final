import { useSearchParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/currency';
import { CheckoutForm } from '@/components/CheckoutForm';
import Container from '@/components/Container';
import { useAuth } from '@/context/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutPayment = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const bookingId = searchParams.get('bookingId') || '';
  const amount = parseFloat(searchParams.get('amount') || '0');
  const currency = searchParams.get('currency') || 'USD';
  const userId = session?.user.username || '';

  if (!bookingId) {
    return (
      <Container>
        <div className="py-12 text-center">
          <p className="text-red-600">{t('checkout.payment.noBookingId')}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">{t('checkout.payment.title')}</h1>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="font-semibold mb-4">{t('checkout.payment.bookingSummary')}</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t('checkout.payment.bookingId')}</span>
              <span className="font-mono text-sm">{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">{t('checkout.payment.total')}</span>
              <span className="font-bold">
                {formatCurrency(amount, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <Elements stripe={stripePromise}>
            <CheckoutForm
              bookingId={bookingId}
              userId={userId}
              amount={amount}
              currency={currency}
            />
          </Elements>
        </div>
      </div>
    </Container>
  );
};

export default CheckoutPayment;
