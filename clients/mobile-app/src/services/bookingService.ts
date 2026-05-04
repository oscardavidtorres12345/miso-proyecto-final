import { API_CONFIG } from '../config/api';
import type {
  BookingHoldResponse,
  CreateHoldPayload,
  UserBookingsResponse,
} from '../types/api';

const BASE_URL = API_CONFIG.BOOKING_URL;

export interface ReservationListItemDto {
  id: string;
  imageUrl: string;
  accommodationName: string;
  location: string;
  arrival: string;
  departure: string;
  guestCount: number;
  showCancel: boolean;
}

export interface UserReservationsResponseDto {
  user_id: string;
  reservations: ReservationListItemDto[];
  status: string;
  sprint: number;
  hu_id: string;
}

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

export async function getUserConfirmedUpcomingBookings(userId: string): Promise<UserReservationsResponseDto> {
  const response = await fetch(`${BASE_URL}/bookings/users/${encodeURIComponent(userId)}/confirmed-upcoming`);
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Failed to fetch upcoming bookings');
  return data as UserReservationsResponseDto;
}

export async function getUserConfirmedPastBookings(userId: string): Promise<UserReservationsResponseDto> {
  const response = await fetch(`${BASE_URL}/bookings/users/${encodeURIComponent(userId)}/confirmed-past`);
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Failed to fetch past bookings');
  return data as UserReservationsResponseDto;
}

export async function userCancelBooking(bookingId: string, userId: number): Promise<BookingHoldResponse> {
  const response = await fetch(`${BASE_URL}/bookings/${encodeURIComponent(bookingId)}/user-cancel`, {
    method: 'DELETE',
    headers: { 'X-User-Id': String(userId) },
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Failed to cancel booking');
  return data as BookingHoldResponse;
}
