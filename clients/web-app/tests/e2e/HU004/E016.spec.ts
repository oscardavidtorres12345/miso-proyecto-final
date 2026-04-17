import { type Page, expect, request, test } from '@playwright/test'

const MOCK_CART_LINES = [
  {
    bookingId: 'cart-1',
    roomId: 101,
    hotelName: 'Aonang Villa Resort',
    roomName: 'Suite',
    image: 'https://picsum.photos/seed/hotel1/600/400',
    amount: 5000000,
    currency: 'COP',
    checkIn: '2026-04-11',
    checkOut: '2026-04-13',
  },
  {
    bookingId: 'cart-2',
    roomId: 102,
    hotelName: 'Hotel Cartagena Plaza',
    roomName: 'Doble',
    image: 'https://picsum.photos/seed/hotel2/600/400',
    amount: 8200000,
    currency: 'COP',
    checkIn: '2026-04-11',
    checkOut: '2026-04-13',
  },
]

async function authenticatePage(page: Page): Promise<void> {
  await page.addInitScript((cartLines) => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: { user_id: 1, username: 'e2e-playwright', email: 'e2e@test.com', role: 'GUEST', is_active: true },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    )
    window.localStorage.setItem('travelhub_cart_v1_1', JSON.stringify(cartLines))
  }, MOCK_CART_LINES)
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU004 - Carrito de compras', () => {
  test('E016 - El usuario puede eliminar un ítem del carrito y la lista se actualiza', async ({ page }) => {
    await page.route('**/bookings/users/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          bookings: MOCK_CART_LINES.map((l) => ({
            booking_id: l.bookingId,
            hold_id: `hold-${l.bookingId}`,
            room_id: l.roomId,
            user_id: '1',
            check_in: l.checkIn,
            check_out: l.checkOut,
            units: 1,
            status: 'ON_HOLD',
            expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
          })),
          status: 'ok',
        }),
      })
    })
    await page.route('**/bookings/*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
    })

    // Given: el usuario autenticado está en la página del carrito
    await authenticatePage(page)
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // And: el carrito tiene 2 ítems al inicio (MOCK_CART_ITEMS)
    const cartItems = page.locator('.cart-item-card')
    await expect(cartItems).toHaveCount(2)

    // When: hace clic en el botón "Quitar del carrito" del primer ítem
    const firstRemoveBtn = cartItems.first().locator('.cart-item-card__remove')
    await firstRemoveBtn.click()

    // Then: la lista del carrito se actualiza y ahora contiene un solo ítem
    await expect(cartItems).toHaveCount(1)

    // And: el ítem restante sigue siendo visible y está completo
    await expect(cartItems.first().locator('.cart-item-card__title')).toBeVisible()

    // And: el total del resumen se recalcula (el elemento sigue visible)
    await expect(page.locator('.cart-summary__total-amount')).toBeVisible()
  })
})
