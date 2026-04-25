import { type Page, expect, request, test } from '@playwright/test'

const BOOKING_ID = 'e2e-booking-019'
const EXPIRES_AT = new Date(Date.now() + 15 * 60_000).toISOString()

async function setupPage(page: Page): Promise<void> {
  await page.addInitScript(
    ({ bookingId, expiresAt }: { bookingId: string; expiresAt: string }) => {
      window.localStorage.setItem(
        'travel-hub-auth',
        JSON.stringify({
          user: { user_id: 1, username: 'e2e-playwright', email: 'e2e@test.com', role: 'GUEST', is_active: true },
          permissions: [],
          sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        }),
      )
      window.localStorage.setItem(
        'travelhub_cart_v1_1',
        JSON.stringify([
          {
            bookingId,
            roomId: 101,
            hotelName: 'Aonang Villa Resort',
            roomName: 'Habitación Deluxe',
            image: 'https://picsum.photos/seed/hotel1/600/400',
            amount: 5000000,
            currency: 'COP',
            checkIn: '2026-04-11',
            checkOut: '2026-04-13',
            expiresAt,
          },
        ]),
      )
    },
    { bookingId: BOOKING_ID, expiresAt: EXPIRES_AT },
  )
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU006 - Cálculo automático de tarifa total (web)', () => {
  test('E019 - Cálculo correcto de tarifa base multiplicada por número de noches', async ({ page }) => {
    // Given: usuario autenticado con 1 ítem en el carrito (stayBase: 3.500.000 COP)
    await setupPage(page)

    await page.route('**/bookings/users/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          bookings: [
            {
              booking_id: BOOKING_ID,
              hold_id: 'e2e-hold-019',
              room_id: 101,
              user_id: '1',
              check_in: '2026-04-11',
              check_out: '2026-04-13',
              units: 1,
              status: 'ON_HOLD',
              expires_at: EXPIRES_AT,
            },
          ],
          status: 'ok',
          sprint: 2,
          hu_id: 'HU006',
        }),
      })
    })

    await page.route(`**/${BOOKING_ID}/payment-summary`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          booking_id: BOOKING_ID,
          property_id: 1,
          room_id: 101,
          check_in: '2026-04-11',
          check_out: '2026-04-13',
          units: 2,
          payment_summary: {
            accommodation: 3500000,
            fees: 500000,
            taxes: 1500000,
            insurance: 200000,
            discount: 700000,
            total: 5000000,
            currency: 'COP',
          },
        }),
      })
    })

    // When: navega al carrito
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // Then: el resumen muestra la tarifa base de alojamiento correcta (3.500.000 COP)
    const stayLine = page.locator('.cart-summary__line').first()
    await expect(stayLine.locator('.cart-summary__value')).toContainText('3.500.000')

    // And: el total reflejado incluye la tarifa base + cargos + impuestos - descuento (5.000.000 COP)
    await expect(page.locator('.cart-summary__total-amount')).toContainText('5.000.000')
  })
})
