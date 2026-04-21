function resolveBaseUrl(): string {
  const base = (import.meta.env.VITE_PAYMENT_API_URL as string | undefined) || 'http://localhost:8005';
  return base.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

const PAYMENT_API_URL = resolveBaseUrl();

export interface PaymentIntentResponse {
  payment_id: string;
  client_secret: string;
  publishable_key: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentStatusResponse {
  payment_id: string;
  booking_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  created_at: string;
  completed_at?: string;
  failure_code?: string;
  failure_message?: string;
  booking_confirmation_code?: string;
}

export const createPaymentIntent = async (
  bookingId: string,
  userId: string,
  amount: number,
  currency: string,
): Promise<PaymentIntentResponse> => {
  const response = await fetch(`${PAYMENT_API_URL}/api/v1/payments/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId, user_id: userId, amount, currency }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create payment intent');
  }

  return response.json();
};

export const getPaymentStatus = async (paymentId: string): Promise<PaymentStatusResponse> => {
  const response = await fetch(`${PAYMENT_API_URL}/api/v1/payments/${paymentId}/status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get payment status');
  }

  return response.json();
};
