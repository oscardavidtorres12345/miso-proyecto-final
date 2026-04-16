import { type Page, expect, request, test } from '@playwright/test'

async function authenticatePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: { user_id: 1, username: 'e2e-playwright', email: 'e2e@test.com', role: 'user', is_active: true },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    )
  })
}

async function goToDetailOrSkip(page: Page, hotelId = '1'): Promise<void> {
  const checkIn = '2026-04-11'
  const checkOut = '2026-04-13'
  await page.goto(
    `/accommodation/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
    { waitUntil: 'domcontentloaded' },
  )
  await page
    .locator('.accommodation-detail__loading')
    .waitFor({ state: 'hidden', timeout: 10_000 })
    .catch(() => {})
  if (await page.locator('.accommodation-detail__error-state').isVisible()) {
    test.skip()
  }
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU005 - Carrito provisional con hold temporal (web)', () => {
  test('E018 - Prevención de doble reserva sobre la misma habitación durante hold activo', async ({ page }) => {
    let holdCalls = 0
    const requestBodies: Array<Record<string, unknown>> = []
    const bookingId = 'e2e-booking-018-ok'

    await page.route('**/bookings/holds', async (route) => {
      holdCalls += 1
      requestBodies.push(route.request().postDataJSON() as Record<string, unknown>)

      if (holdCalls === 1) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'ON_HOLD',
            sprint: 1,
            hu_id: 'HU005',
            booking_id: bookingId,
            hold_id: 'e2e-hold-018-ok',
            expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
          }),
        })
        return
      }

      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Inventory request failed.' }),
      })
    })
    await page.route('**/bookings/users/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          bookings: [
            {
              booking_id: bookingId,
              hold_id: 'e2e-hold-018-ok',
              room_id: Number(requestBodies[0]?.room_id ?? 101),
              user_id: '1',
              check_in: '2026-04-11',
              check_out: '2026-04-13',
              units: 1,
              status: 'ON_HOLD',
              expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
            },
          ],
          status: 'ok',
          sprint: 2,
          hu_id: 'HU003',
        }),
      })
    })

    // Given: usuario autenticado en detalle de hospedaje con fechas válidas
    await authenticatePage(page)
    await goToDetailOrSkip(page, '1')

    const addToCartButton = page.locator('.accommodation-detail__room-btn--cart').first()
    await expect(addToCartButton).toBeVisible()

    // When: intenta reservar 2 veces la misma habitación durante el hold activo
    await addToCartButton.click()
    await expect(page.getByRole('alert')).toContainText('Habitación añadida al carrito')

    await addToCartButton.click()

    // Then: el segundo intento falla por conflicto y la UI notifica error
    await expect(page.getByRole('alert')).toContainText('No pudimos reservar la habitación')

    // And: se ejecutaron dos llamadas al endpoint con el mismo room_id (doble intento real)
    await expect.poll(() => holdCalls).toBe(2)
    expect(requestBodies[0]?.room_id).toBeDefined()
    expect(requestBodies[0]?.room_id).toBe(requestBodies[1]?.room_id)

    // And: no se duplica la reserva en el carrito
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.cart-item-card')).toHaveCount(1)
  })
})
