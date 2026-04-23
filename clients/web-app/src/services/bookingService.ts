import type { CartLineItem } from "@/types/cart";

export interface CreateHoldPayload {
  property_id: number;
  room_id: number;
  user_id: string;
  check_in: string;
  check_out: string;
  units: number;
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
  room_id: number;
  user_id: string;
  check_in: string;
  check_out: string;
  units: number;
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
