import { type Page, expect, request, test } from '@playwright/test'

const BOOKING_ID_A = 'e2e-booking-022a'
const BOOKING_ID_B = 'e2e-booking-022b'
const EXPIRES_AT = new Date(Date.now() + 15 * 60_000).toISOString()

async function setupPage(page: Page): Promise<void> {
  await page.addInitScript(
    ({ bookingIdA, bookingIdB, expiresAt }: { bookingIdA: string; bookingIdB: string; expiresAt: string }) => {
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
            bookingId: bookingIdA,
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
          {
            bookingId: bookingIdB,
            roomId: 102,
            hotelName: 'Hotel Cartagena Plaza',
            roomName: 'Suite Ejecutiva',
            image: 'https://picsum.photos/seed/hotel2/600/400',
            amount: 8200000,
            currency: 'COP',
            checkIn: '2026-04-15',
            checkOut: '2026-04-18',
            expiresAt,
          },
        ]),
      )
    },
    { bookingIdA: BOOKING_ID_A, bookingIdB: BOOKING_ID_B, expiresAt: EXPIRES_AT },
  )
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU006 - Cálculo automático de tarifa total (web)', () => {
  test('E022 - Actualización dinámica del total al modificar el carrito', async ({ page }) => {
    // Given: usuario autenticado con 2 ítems en el carrito (total: 13.200.000 COP)
    await setupPage(page)

    await page.route('**/bookings/users/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          bookings: [
            {
              booking_id: BOOKING_ID_A,
              hold_id: 'e2e-hold-022a',
              room_id: 101,
              user_id: '1',
              check_in: '2026-04-11',
              check_out: '2026-04-13',
              units: 1,
              status: 'ON_HOLD',
              expires_at: EXPIRES_AT,
            },
            {
              booking_id: BOOKING_ID_B,
              hold_id: 'e2e-hold-022b',
              room_id: 102,
              user_id: '1',
              check_in: '2026-04-15',
              check_out: '2026-04-18',
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

    await page.route('**/bookings/*/payment-summary', async (route) => {
      const url = route.request().url()
      if (url.includes(BOOKING_ID_A)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            booking_id: BOOKING_ID_A,
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
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            booking_id: BOOKING_ID_B,
            property_id: 2,
            room_id: 102,
            check_in: '2026-04-15',
            check_out: '2026-04-18',
            units: 2,
            payment_summary: {
              accommodation: 5740000,
              fees: 820000,
              taxes: 2460000,
              insurance: 330000,
              discount: 1150000,
              total: 8200000,
              currency: 'COP',
            },
          }),
        })
      }
    })

    await page.route(`**/${BOOKING_ID_A}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'CANCELLED' }),
        })
      } else {
        await route.continue()
      }
    })

    // When: navega al carrito
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // Then: el total inicial muestra la suma de ambos ítems (13.200.000 COP)
    await expect(page.locator('.cart-summary__total-amount')).toContainText('13.200.000')
    await expect(page.locator('.cart-item-card')).toHaveCount(2)

    // When: elimina el primer ítem (Aonang Villa Resort — 5.000.000 COP)
    await page.locator('.cart-item-card__remove').first().click()

    // Then: el total se actualiza dinámicamente al del ítem restante (8.200.000 COP)
    await expect(page.locator('.cart-summary__total-amount')).toContainText('8.200.000')

    // And: solo queda 1 ítem visible en el carrito
    await expect(page.locator('.cart-item-card')).toHaveCount(1)
  })
})
