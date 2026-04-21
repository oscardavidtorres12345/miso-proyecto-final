import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Container from '@/components/Container';
import Button from '@/components/Button';

const PaymentConfirmation = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const confirmationCode = searchParams.get('code') || 'N/A';

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        </div>

        <h1 className="text-3xl font-bold mb-4">{t('checkout.payment.confirmation.title')}</h1>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <p className="text-lg mb-2">{t('checkout.payment.confirmation.bookingConfirmed')}</p>
          <p className="text-gray-600 mb-4">{t('checkout.payment.confirmation.confirmationCode')}</p>
          <p className="text-2xl font-mono font-bold text-green-700">{confirmationCode}</p>
        </div>

        <div className="space-y-3">
          <p className="text-gray-600">{t('checkout.payment.confirmation.emailSent')}</p>
          <p className="text-gray-600">{t('checkout.payment.confirmation.viewBookingDetails')}</p>
        </div>

        <div className="mt-8 space-x-4">
          <Button variant="primary" className="px-8 py-3" onClick={() => navigate('/')}>
            {t('checkout.payment.confirmation.returnHome')}
          </Button>
          <Button variant="secondary" className="px-8 py-3" onClick={() => navigate('/reservations')}>
            {t('checkout.payment.confirmation.viewMyBookings')}
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default PaymentConfirmation;
