import type { CartLineItem } from '@/types/cart'

const CHECKOUT_SESSION_STORAGE_KEY = 'travelhub_checkout_session_v1'

export type CheckoutLineSnapshot = {
  bookingId: string
  hotelName: string
  roomName: string
  image: string
  amount: number
  currency: string
  checkIn: string
  checkOut: string
}

export type CheckoutEntry = 'select' | 'cart'

type CheckoutSessionPayload = {
  bookingIds: string[]
  updatedAt: string
  lineSnapshots?: CheckoutLineSnapshot[]
  entry?: CheckoutEntry
}

function isValidSnapshot(x: unknown): x is CheckoutLineSnapshot {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.bookingId === 'string' &&
    typeof o.hotelName === 'string' &&
    typeof o.roomName === 'string' &&
    typeof o.image === 'string' &&
    typeof o.amount === 'number' &&
    typeof o.currency === 'string' &&
    typeof o.checkIn === 'string' &&
    typeof o.checkOut === 'string'
  )
}

function snapshotToCartLine(s: CheckoutLineSnapshot): CartLineItem {
  return {
    id: s.bookingId,
    name: `${s.hotelName} · ${s.roomName}`,
    image: s.image,
    price: { amount: s.amount, currency: s.currency },
    breakdown: {
      stayBase: s.amount,
      charges: 0,
      taxes: 0,
      insurance: 0,
      discount: 0,
    },
  }
}

function parseRaw(raw: string | null): {
  bookingIds: string[]
  snapshots: CheckoutLineSnapshot[]
  entry: CheckoutEntry
} {
  if (!raw) return { bookingIds: [], snapshots: [], entry: 'cart' }
  try {
    const parsed = JSON.parse(raw) as CheckoutSessionPayload & { bookingIds?: unknown }
    if (!Array.isArray(parsed.bookingIds)) return { bookingIds: [], snapshots: [], entry: 'cart' }
    const bookingIds = parsed.bookingIds.filter(
      (id): id is string => typeof id === 'string' && !!id,
    )
    const rawSnaps = parsed.lineSnapshots
    const snapshots = Array.isArray(rawSnaps)
      ? rawSnaps.filter(isValidSnapshot).filter((s) => bookingIds.includes(s.bookingId))
      : []
    const entry: CheckoutEntry = parsed.entry === 'select' ? 'select' : 'cart'
    return { bookingIds, snapshots, entry }
  } catch {
    return { bookingIds: [], snapshots: [], entry: 'cart' }
  }
}

export function saveCheckoutSession(
  bookingIds: string[],
  lineSnapshots?: CheckoutLineSnapshot[] | null,
  entry: CheckoutEntry = 'cart',
): void {
  const uniqueBookingIds = Array.from(new Set(bookingIds.filter(Boolean)))
  if (uniqueBookingIds.length === 0) {
    localStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY)
    return
  }

  const payload: CheckoutSessionPayload = {
    bookingIds: uniqueBookingIds,
    updatedAt: new Date().toISOString(),
    entry,
  }
  if (lineSnapshots && lineSnapshots.length > 0) {
    const filtered = lineSnapshots.filter((s) => uniqueBookingIds.includes(s.bookingId))
    if (filtered.length > 0) payload.lineSnapshots = filtered
  }

  localStorage.setItem(CHECKOUT_SESSION_STORAGE_KEY, JSON.stringify(payload))
}

export function readCheckoutSessionBookingIds(): string[] {
  return parseRaw(localStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY)).bookingIds
}

export function readCheckoutEntry(): CheckoutEntry {
  return parseRaw(localStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY)).entry
}

export function readCheckoutSessionSnapshotCartLines(): CartLineItem[] {
  const { snapshots } = parseRaw(localStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY))
  return snapshots.map(snapshotToCartLine)
}

export function clearCheckoutSession(): void {
  localStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY)
}
