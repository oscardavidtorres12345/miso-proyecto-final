import { type BrowserContext, type Page } from '@playwright/test'

export async function authenticateGuest(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: {
          user_id: 1,
          username: 'e2e.guest',
          email: 'guest@travelhub.com',
          role: 'GUEST',
          is_active: true,
        },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        token: 'e2e-guest-token',
      }),
    )
  })
}

export function buildSearchResponse(currency = 'COP') {
  return {
    results: [
      {
        id: 1,
        name: 'Hotel E2E Currency',
        image: 'https://picsum.photos/seed/hotel1/640/400',
        distanceFromCenter: 1.5,
        stars: 4,
        rating: { score: 4.5, reviewCount: 120 },
        amenities: [{ id: 'wifi' }, { id: 'pool' }],
        hasBreakfast: true,
        price: {
          amount: 500000,
          currency,
          nights: 2,
          adults: 2,
          includesTaxes: true,
        },
      },
    ],
    totalPages: 1,
  }
}

export function buildHotelDetailResponse(currency = 'COP') {
  return {
    id: 1,
    name: 'Hotel E2E Currency',
    description: 'Hotel para pruebas de moneda',
    stars: 4,
    rating: { score: 4.5, reviewCount: 120 },
    photos: [{ url: 'https://picsum.photos/seed/hotel1/640/400', alt: 'Hotel' }],
    amenities: [{ id: 'wifi' }, { id: 'pool' }],
    schedule: {
      checkIn: { from: '15:00', to: '23:00' },
      checkOut: { time: '12:00' },
    },
    suggestedRoom: {
      name: 'Suite Standard',
      mealPlan: 'breakfast',
      totalPrice: 500000,
      currency,
    },
    rooms: [
      {
        id: 101,
        name: 'Suite Standard',
        description: 'Habitación de lujo',
        images: ['https://picsum.photos/seed/room1/640/400'],
        price: {
          totalAmount: 500000,
          pricePerNight: 250000,
          currency,
          nights: 2,
          adults: 2,
          includesTaxes: true,
        },
      },
    ],
  }
}

export function buildPaymentSummaryResponse(opts: {
  currency: string
  total: number
  accommodation: number
  fees: number
  taxes: number
  insurance: number
  discount: number
}) {
  return {
    payment_summary: {
      total: opts.total,
      currency: opts.currency,
      accommodation: opts.accommodation,
      fees: opts.fees,
      taxes: opts.taxes,
      insurance: opts.insurance,
      discount: opts.discount,
    },
    user: {
      first_name: 'E2E',
      last_name: 'Guest',
      email: 'guest@travelhub.com',
    },
  }
}

export async function mockSearchProperties(context: BrowserContext, currency = 'COP'): Promise<void> {
  await context.route('**/search/properties**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildSearchResponse(currency)),
    })
  })
}

export async function mockHotelDetail(context: BrowserContext, currency = 'COP'): Promise<void> {
  await context.route('**/hotels/1**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildHotelDetailResponse(currency)),
    })
  })
}

export async function mockBookingHold(context: BrowserContext, bookingId = 'e2e-hold-001'): Promise<void> {
  await context.route('**/bookings/hold**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        booking_id: bookingId,
        status: 'ON_HOLD',
        expires_at: new Date(Date.now() + 900_000).toISOString(),
      }),
    })
  })
}

export async function mockBookingBatch(context: BrowserContext, batchId = 'e2e-batch-001'): Promise<void> {
  await context.route('**/bookings/batch**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ booking_id: batchId }),
    })
  })
}

export async function mockGetBookingBatch(
  context: BrowserContext,
  batchId = 'e2e-batch-001',
  bookingIds: string[] = ['e2e-hold-001'],
): Promise<void> {
  await context.route(`**/bookings/batch/${batchId}**`, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ booking_ids: bookingIds }),
    })
  })
}

export async function mockPaymentSummary(
  context: BrowserContext,
  opts: {
    currency: string
    total: number
    accommodation: number
    fees: number
    taxes: number
    insurance: number
    discount: number
  },
): Promise<{ hits: { count: number; lastCurrency: string | null } }> {
  const hits = { count: 0, lastCurrency: null as string | null }
  await context.route('**/bookings/**/payment-summary**', async (route) => {
    hits.count += 1
    const url = new URL(route.request().url())
    const displayCurrency = url.searchParams.get('display_currency') || opts.currency
    hits.lastCurrency = displayCurrency
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildPaymentSummaryResponse({ ...opts, currency: displayCurrency })),
    })
  })
  return { hits }
}
