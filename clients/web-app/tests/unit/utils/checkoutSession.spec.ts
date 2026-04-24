import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  clearCheckoutSession,
  readCheckoutEntry,
  readCheckoutSessionBookingIds,
  readCheckoutSessionSnapshotCartLines,
  saveCheckoutSession,
} from '@/utils/checkoutSession'

const KEY = 'travelhub_checkout_session_v1'

describe('checkoutSession', () => {
  beforeEach(() => {
    localStorage.removeItem(KEY)
  })

  afterEach(() => {
    localStorage.removeItem(KEY)
  })

  it('saveCheckoutSession persists booking ids and cart entry', () => {
    saveCheckoutSession(['a', 'b'])
    expect(readCheckoutSessionBookingIds()).toEqual(['a', 'b'])
    expect(readCheckoutSessionSnapshotCartLines()).toEqual([])
    const raw = localStorage.getItem(KEY) as string
    expect(JSON.parse(raw).entry).toBe('cart')
  })

  it('saveCheckoutSession with select entry', () => {
    saveCheckoutSession(['bk-1'], undefined, 'select')
    expect(readCheckoutEntry()).toBe('select')
  })

  it('saveCheckoutSession with snapshots exposes cart lines for checkout', () => {
    saveCheckoutSession(['bk-1'], [
      {
        bookingId: 'bk-1',
        hotelName: 'Hotel X',
        roomName: 'Suite',
        image: 'https://x.test/i.jpg',
        amount: 99,
        currency: 'COP',
        checkIn: '2026-06-01',
        checkOut: '2026-06-03',
      },
    ])
    const lines = readCheckoutSessionSnapshotCartLines()
    expect(lines).toHaveLength(1)
    expect(lines[0].id).toBe('bk-1')
    expect(lines[0].name).toBe('Hotel X · Suite')
    expect(lines[0].price).toEqual({ amount: 99, currency: 'COP' })
  })

  it('clearCheckoutSession removes payload', () => {
    saveCheckoutSession(['x'])
    clearCheckoutSession()
    expect(readCheckoutSessionBookingIds()).toEqual([])
    expect(readCheckoutSessionSnapshotCartLines()).toEqual([])
  })

  it('drops snapshots not listed in bookingIds', () => {
    saveCheckoutSession(['only'], [
      {
        bookingId: 'orphan',
        hotelName: 'A',
        roomName: 'B',
        image: '',
        amount: 1,
        currency: 'COP',
        checkIn: '2026-01-01',
        checkOut: '2026-01-02',
      },
      {
        bookingId: 'only',
        hotelName: 'H',
        roomName: 'R',
        image: '',
        amount: 2,
        currency: 'COP',
        checkIn: '2026-01-01',
        checkOut: '2026-01-02',
      },
    ])
    expect(readCheckoutSessionSnapshotCartLines()).toHaveLength(1)
    expect(readCheckoutSessionSnapshotCartLines()[0].id).toBe('only')
  })
})
