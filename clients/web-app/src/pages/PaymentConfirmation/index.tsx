import { useSearchParams, useNavigate } from 'react-router';
import { CheckCircle } from 'lucide-react';
import Container from '@/components/Container';
import Button from '@/components/Button';

const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const confirmationCode = searchParams.get('code') || 'N/A';

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <p className="text-lg mb-2">Your booking has been confirmed</p>
          <p className="text-gray-600 mb-4">Confirmation Code:</p>
          <p className="text-2xl font-mono font-bold text-green-700">{confirmationCode}</p>
        </div>

        <div className="space-y-3">
          <p className="text-gray-600">
            A confirmation email has been sent to your email address.
          </p>
          <p className="text-gray-600">
            You can view your booking details in your account.
          </p>
        </div>

        <div className="mt-8 space-x-4">
          <Button 
            variant="primary"
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
          <Button 
            variant="secondary"
            onClick={() => navigate('/bookings')}
          >
            View My Bookings
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default PaymentConfirmation;
