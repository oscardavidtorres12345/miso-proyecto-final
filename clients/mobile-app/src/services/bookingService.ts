import { API_CONFIG } from '../config/api';
import type {
  BookingHoldResponse,
  CreateHoldPayload,
  UserBookingsResponse,
} from '../types/api';

const BASE_URL = API_CONFIG.BOOKING_URL;

export async function createBookingHold(payload: CreateHoldPayload): Promise<BookingHoldResponse> {
  const response = await fetch(`${BASE_URL}/bookings/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create booking hold');
  }

  return (await response.json()) as BookingHoldResponse;
}

export async function getUserBookings(userId: string): Promise<UserBookingsResponse> {
  const response = await fetch(`${BASE_URL}/bookings?user_id=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user bookings');
  }

  return (await response.json()) as UserBookingsResponse;
}

export async function cancelBooking(bookingId: string): Promise<BookingHoldResponse> {
  const response = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to cancel booking');
  }

  return (await response.json()) as BookingHoldResponse;
}
