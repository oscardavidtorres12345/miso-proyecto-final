import type { CartLineItem } from "@/types/cart";

export interface CreateHoldPayload {
  property_id: number;
  room_id: number;
  user_id: string;
  check_in: string;
  check_out: string;
  units: number;
  guest_count: number;
}

export interface BookingHoldResponse {
  status: string;
  sprint: number;
  hu_id: string;
  booking_id?: string | null;
  hold_id?: string | null;
  expires_at?: string | null;
}

export interface BookingSummaryDto {
  booking_id: string;
  hold_id: string;
  property_id?: number | null;
  property_name?: string | null;
  room_id: number;
  user_id: string;
  check_in: string;
  check_out: string;
  units: number;
  guest_count?: number;
  room_type?: string | null;
  hotel_confirmation_status?: "PENDING" | "CONFIRMED";
  hotel_confirmed_at?: string | null;
  status: string;
  expires_at?: string | null;
}

export type BookingDetailResponseDto = BookingSummaryDto;

export interface UserBookingsResponseDto {
  user_id: string;
  bookings: BookingSummaryDto[];
  status: string;
  sprint: number;
  hu_id: string;
}

export interface PortalPropertySummaryDto {
  property_id: number;
  property_name?: string | null;
}

export interface PortalReservationsResponseDto {
  properties: PortalPropertySummaryDto[];
  staff_user_id: number;
  property_ids: number[];
  bookings: BookingSummaryDto[];
  status: string;
  sprint: number;
  hu_id: string;
}

export interface BookingBatchCreatePayload {
  user_id: string;
  booking_ids: string[];
}

export interface BookingBatchResponseDto {
  booking_id: string;
  user_id: string;
  booking_ids: string[];
  bookings: BookingSummaryDto[];
  status: string;
  sprint: number;
  hu_id: string;
}

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
export interface PaymentSummaryDto {
  accommodation: number;
  fees: number;
  taxes: number;
  insurance: number;
  discount: number;
  total: number;
  currency: string;
}

export interface PaymentSummaryUserDto {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface PaymentSummaryResponseDto {
  booking_id: string;
  property_id: number;
  room_id: number;
  check_in: string;
  check_out: string;
  units: number;
  payment_summary: PaymentSummaryDto;
  user?: PaymentSummaryUserDto | null;
}

function resolveBaseUrl(): string {
  const base = import.meta.env.VITE_BOOKING_API_URL as string | undefined;
  if (typeof base !== "string" || !base.trim()) {
    throw new Error("VITE_BOOKING_API_URL is not defined. Set it in .env.");
  }
  return base.replace(/\/$/, "");
}

function formatErrorDetail(data: unknown): string {
  if (data && typeof data === "object" && "detail" in data) {
    const d = (data as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (
      Array.isArray(d) &&
      d.length > 0 &&
      typeof d[0] === "object" &&
      d[0] !== null &&
      "msg" in d[0]
    ) {
      return String((d[0] as { msg: unknown }).msg);
    }
  }
  return "Request failed.";
}

export async function createBookingHold(
  payload: CreateHoldPayload,
): Promise<BookingHoldResponse> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/bookings/holds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as BookingHoldResponse;
}

export async function getUserBookings(
  userId: string,
): Promise<UserBookingsResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/bookings/users/${encodeURIComponent(userId)}`);

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as UserBookingsResponseDto;
}

type AuthHeaders = {
  token: string;
  userId: number;
};

function buildPortalHeaders({ token, userId }: AuthHeaders): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "X-User-Id": String(userId),
  };
}

export async function getPortalReservations(
  auth: AuthHeaders,
): Promise<PortalReservationsResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/bookings/portal/reservations`, {
    method: "GET",
    headers: buildPortalHeaders(auth),
  });

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as PortalReservationsResponseDto;
}

export async function hotelConfirmBooking(
  auth: AuthHeaders,
  bookingId: string,
): Promise<BookingHoldResponse> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(
    `${baseUrl}/bookings/${encodeURIComponent(bookingId)}/hotel-confirm`,
    {
      method: "POST",
      headers: buildPortalHeaders(auth),
    },
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as BookingHoldResponse;
}

export async function hotelCancelBooking(
  auth: AuthHeaders,
  bookingId: string,
): Promise<BookingHoldResponse> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(
    `${baseUrl}/bookings/${encodeURIComponent(bookingId)}/hotel-cancel`,
    {
      method: "DELETE",
      headers: buildPortalHeaders(auth),
    },
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as BookingHoldResponse;
}

export async function createBookingBatch(
  payload: BookingBatchCreatePayload,
): Promise<BookingBatchResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/bookings/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as BookingBatchResponseDto;
}

export async function getBookingBatch(
  bookingId: string,
): Promise<BookingBatchResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(
    `${baseUrl}/bookings/batch/${encodeURIComponent(bookingId)}`,
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as BookingBatchResponseDto;
}
export async function userCancelBooking(
  bookingId: string,
  userId: number,
): Promise<BookingHoldResponse> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(
    `${baseUrl}/bookings/${encodeURIComponent(bookingId)}/user-cancel`,
    {
      method: "DELETE",
      headers: { "X-User-Id": String(userId) },
    },
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as BookingHoldResponse;
}

export async function cancelBooking(bookingId: string): Promise<BookingHoldResponse> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/bookings/${encodeURIComponent(bookingId)}`, {
    method: "DELETE",
  });

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as BookingHoldResponse;
}

export async function getUserConfirmedUpcomingBookings(
  userId: string,
): Promise<UserReservationsResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(
    `${baseUrl}/bookings/users/${encodeURIComponent(userId)}/confirmed-upcoming`,
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as UserReservationsResponseDto;
}

export async function getUserConfirmedPastBookings(
  userId: string,
): Promise<UserReservationsResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(
    `${baseUrl}/bookings/users/${encodeURIComponent(userId)}/confirmed-past`,
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as UserReservationsResponseDto;
}

export async function getBooking(
  bookingId: string,
): Promise<BookingDetailResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/bookings/${encodeURIComponent(bookingId)}`);

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as BookingDetailResponseDto;
}

export async function fetchBookingPaymentSummary(
  bookingId: string,
): Promise<PaymentSummaryResponseDto | null> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(
    `${baseUrl}/bookings/${encodeURIComponent(bookingId)}/payment-summary`,
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (response.status === 404 || response.status === 409) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return data as PaymentSummaryResponseDto;
}

export function mapPaymentSummaryToLinePatch(
  row: PaymentSummaryResponseDto,
): Pick<CartLineItem, "price" | "breakdown"> {
  const ps = row.payment_summary;
  return {
    price: { amount: ps.total, currency: ps.currency },
    breakdown: {
      stayBase: ps.accommodation,
      charges: ps.fees,
      taxes: ps.taxes,
      insurance: ps.insurance,
      discount: Math.abs(ps.discount),
    },
  };
}
