const CHECKOUT_SESSION_STORAGE_KEY = 'travelhub_checkout_session_v1'

type CheckoutSessionPayload = {
  bookingIds: string[]
  updatedAt: string
}

export function saveCheckoutSession(bookingIds: string[]): void {
  const uniqueBookingIds = Array.from(new Set(bookingIds.filter(Boolean)))
  if (uniqueBookingIds.length === 0) {
    localStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY)
    return
  }

  const payload: CheckoutSessionPayload = {
    bookingIds: uniqueBookingIds,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(CHECKOUT_SESSION_STORAGE_KEY, JSON.stringify(payload))
}

export function readCheckoutSessionBookingIds(): string[] {
  try {
    const raw = localStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { bookingIds?: unknown }
    if (!Array.isArray(parsed.bookingIds)) return []
    return parsed.bookingIds.filter((id): id is string => typeof id === 'string' && !!id)
  } catch {
    return []
  }
}

export function clearCheckoutSession(): void {
  localStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY)
}
