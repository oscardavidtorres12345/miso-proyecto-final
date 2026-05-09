import type { CartLineItem } from "@/types/cart";

export interface CreateHoldPayload {
  property_id: number;
  room_id: number;
  user_id: string;
  check_in: string;
  check_out: string;
  units: number;
  guest_count: number;
  room_type?: string;
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

export interface ReviewItemDto {
  id: number;
  booking_id: string;
  property_id: number;
  room_id: number;
  hotel_name: string;
  room_name?: string | null;
  guest_name: string;
  guest_username?: string | null;
  guest_avatar_url?: string | null;
  rating: number;
  comment: string;
  review_date: string;
}

export interface AdminFeedbackResponseDto {
  reviews: ReviewItemDto[];
  status: string;
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
  status?: string;
}

export interface CancellationPreviewResponseDto {
  booking_id: string;
  can_cancel: boolean;
  policy_type: string;
  refund_amount: number | null;
  refund_currency: string | null;
  conditions: string | null;
  days_until_checkin: number | null;
  status: string;
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

export async function getPortalFeedback(
  auth: AuthHeaders,
): Promise<AdminFeedbackResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/bookings/admin/feedback`, {
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

  return data as AdminFeedbackResponseDto;
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

export async function fetchCancellationPreview(
  bookingId: string,
  userId: number,
): Promise<CancellationPreviewResponseDto> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(
    `${baseUrl}/bookings/${encodeURIComponent(bookingId)}/cancel-preview`,
    {
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

  return data as CancellationPreviewResponseDto;
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
  opts?: {
    displayCurrency?: string;
    chargeCurrency?: string;
  },
): Promise<PaymentSummaryResponseDto | null> {
  const baseUrl = resolveBaseUrl();
  const params = new URLSearchParams();
  if (opts?.displayCurrency) params.set("display_currency", opts.displayCurrency);
  if (opts?.chargeCurrency) params.set("charge_currency", opts.chargeCurrency);
  const query = params.toString();
  const response = await fetch(
    `${baseUrl}/bookings/${encodeURIComponent(bookingId)}/payment-summary${query ? `?${query}` : ""}`,
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

export interface DashboardKpisDto {
  total_reservations: number;
  active_reservations: number;
  current_guests: number;
  income_total: number;
}

export interface OccupancyCategoryItemDto {
  category: string;
  room_type: string | null;
  value: number;
  property_name: string;
}

export interface PeriodValueItemDto {
  period: string;
  value: number;
}

export interface RankingItemDto {
  label: string;
  room_type: string | null;
  value: number;
}

export interface DashboardMetaDto {
  date_from: string;
  date_to: string;
  granularity: string;
  currency: string;
  top_n: number;
  warnings: string[];
}

export interface PortalDashboardResponseDto {
  staff_user_id: number;
  property_ids: number[];
  kpis: DashboardKpisDto;
  occupancy_by_category: OccupancyCategoryItemDto[];
  bookings_by_period: PeriodValueItemDto[];
  ranking: RankingItemDto[];
  income_trend: PeriodValueItemDto[];
  meta: DashboardMetaDto;
  status: string;
}

export interface DashboardQueryParams {
  date_from?: string;
  date_to?: string;
  currency?: string;
  top_n?: number;
}

export interface MonthlyReportKpisDto {
  total_reservations: number;
  cancelled_reservations: number;
  new_guests: number;
  returning_guests: number;
  occupied_rooms: number;
  available_rooms: number;
  gross_income: number;
  net_income: number;
}

export interface MonthlyReportDistributionItemDto {
  category: string;
  room_type: string | null;
  value: number;
  percentage: number;
}

export interface MonthlyReportBarPointDto {
  period: string;
  value: number;
}

export interface MonthlyReportAdditionalChartDto {
  key: string;
  title: string;
  points: MonthlyReportBarPointDto[];
}

export interface MonthlyReportMetaDto {
  month: string;
  currency: string;
  top_n: number;
  warnings: string[];
}

export interface MonthlyReportConsistencyDto {
  period_total_reservations: number;
  period_income_total: number;
  matches_total_reservations: boolean;
  matches_income_total: boolean;
}

export interface PortalMonthlyReportResponseDto {
  staff_user_id: number;
  property_ids: number[];
  month: string;
  kpis_month: MonthlyReportKpisDto;
  distribution_by_category: MonthlyReportDistributionItemDto[];
  bars_by_period: MonthlyReportBarPointDto[];
  additional_charts: MonthlyReportAdditionalChartDto[];
  consistency: MonthlyReportConsistencyDto;
  meta: MonthlyReportMetaDto;
  status: string;
}

export interface MonthlyReportQueryParams {
  month?: string;
  currency?: string;
  top_n?: number;
}

export async function getPortalMonthlyReport(
  auth: AuthHeaders,
  params?: MonthlyReportQueryParams,
): Promise<PortalMonthlyReportResponseDto> {
  const baseUrl = resolveBaseUrl();
  const query = new URLSearchParams();
  if (params?.month) query.set("month", params.month);
  if (params?.currency) query.set("currency", params.currency);
  if (params?.top_n != null) query.set("top_n", String(params.top_n));
  const qs = query.toString();

  const response = await fetch(
    `${baseUrl}/bookings/portal/reports/monthly${qs ? `?${qs}` : ""}`,
    { method: "GET", headers: buildPortalHeaders(auth) },
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as PortalMonthlyReportResponseDto;
}

export async function getPortalDashboard(
  auth: AuthHeaders,
  params?: DashboardQueryParams,
): Promise<PortalDashboardResponseDto> {
  const baseUrl = resolveBaseUrl();
  const query = new URLSearchParams();
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
if (params?.currency) query.set("currency", params.currency);
  if (params?.top_n != null) query.set("top_n", String(params.top_n));
  const qs = query.toString();

  const response = await fetch(
    `${baseUrl}/bookings/portal/dashboard${qs ? `?${qs}` : ""}`,
    { method: "GET", headers: buildPortalHeaders(auth) },
  );

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = formatErrorDetail(data);
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data as PortalDashboardResponseDto;
}
