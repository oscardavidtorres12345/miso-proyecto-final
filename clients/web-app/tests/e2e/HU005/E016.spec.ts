import { type Page, expect, request, test } from '@playwright/test'

async function authenticatePageWithHoldAboutToExpire(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const userId = 1

    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: { user_id: userId, username: 'e2e-playwright', email: 'e2e@test.com', role: 'GUEST', is_active: true },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    )

    window.localStorage.setItem(
      `travelhub_cart_v1_${userId}`,
      JSON.stringify([
        {
          bookingId: 'e2e-booking-expire-016',
          roomId: 101,
          hotelName: 'Hotel E2E',
          roomName: 'Habitación estándar',
          image: 'https://picsum.photos/seed/e016/600/400',
          amount: 350000,
          currency: 'COP',
          checkIn: '2026-04-11',
          checkOut: '2026-04-13',
          expiresAt: new Date(Date.now() + 300_000).toISOString(),
        },
      ]),
    )

    // Hold ya vencido: al montar la app, SessionCountdownContext notifica expiración.
    window.localStorage.setItem(
      'travelhub_hold_countdown_v1',
      JSON.stringify({ v: 1, userId, endMs: Date.now() - 1_000 }),
    )
  })
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU005 - Carrito provisional con hold temporal (web)', () => {
  test('E016 - Liberación automática de inventario al expirar el tiempo de hold sin completar pago', async ({ page }) => {
    await page.route('**/bookings/users/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          bookings: [],
          status: 'ok',
          sprint: 2,
          hu_id: 'HU003',
        }),
      })
    })

    // Given: el usuario autenticado tiene una línea en carrito con hold ya expirado
    await authenticatePageWithHoldAboutToExpire(page)

    // When: entra al carrito
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // Then: la UI notifica que el tiempo de reserva expiró (copy depende de i18n)
    await expect(page.locator('.snackbar.snackbar--error.snackbar--visible')).toContainText(
      /tiempo de reserva ha expirado|reservation time has expired/i,
    )

    // And: el carrito se limpia automáticamente (sin pago)
    await expect(page.locator('.cart-item-card')).toHaveCount(0)
    await expect(page.locator('.cart-page__layout--empty')).toBeVisible()
    await expect(page.locator('.cart-page__empty-message')).toBeVisible()

    // And: no queda hold activo y el carrito persistido queda vacío (null o [])
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const cart = localStorage.getItem('travelhub_cart_v1_1')
          const hold = localStorage.getItem('travelhub_hold_countdown_v1')
          return {
            validCartState: cart === null || cart === '[]',
            hold,
          }
        }),
      )
      .toEqual({ validCartState: true, hold: null })
  })
})
