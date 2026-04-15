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
  test('E015 - Creación exitosa de hold temporal de 15 minutos sobre habitación disponible', async ({ page }) => {
    let holdRequestBody: Record<string, unknown> | null = null
    const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString()
    const bookingId = 'e2e-booking-015'

    await page.route('**/bookings/holds', async (route) => {
      holdRequestBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ON_HOLD',
          sprint: 1,
          hu_id: 'HU005',
          booking_id: bookingId,
          hold_id: 'e2e-hold-015',
          expires_at: expiresAt,
        }),
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
              hold_id: 'e2e-hold-015',
              room_id: Number(holdRequestBody?.room_id ?? 101),
              user_id: '1',
              check_in: '2026-04-11',
              check_out: '2026-04-13',
              units: 1,
              status: 'ON_HOLD',
              expires_at: expiresAt,
            },
          ],
          status: 'ok',
          sprint: 2,
          hu_id: 'HU003',
        }),
      })
    })

    // Given: el usuario autenticado entra al detalle de un hospedaje con fechas válidas
    await authenticatePage(page)
    await goToDetailOrSkip(page, '1')

    // And: existe al menos una habitación con botón "Agregar al carrito"
    const addToCartButton = page.locator('.accommodation-detail__room-btn--cart').first()
    await expect(addToCartButton).toBeVisible()

    // When: agrega la habitación al carrito
    await addToCartButton.click()

    // Then: se crea el hold con los campos esperados
    await expect.poll(() => holdRequestBody).not.toBeNull()
    expect(holdRequestBody).toMatchObject({
      room_id: expect.any(Number),
      user_id: '1',
      check_in: '2026-04-11',
      check_out: '2026-04-13',
      units: 1,
    })

    // And: la UI notifica éxito de agregado al carrito
    await expect(page.getByRole('alert')).toContainText('Habitación añadida al carrito')

    // And: se muestra el contador regresivo del hold activo (~15 minutos)
    const timer = page.getByRole('timer')
    await expect(timer).toBeVisible()
    await expect(timer).toHaveText(/1[45]:[0-5]\d/)

    // And: al ir al carrito, el ítem reservado se encuentra cargado
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.cart-item-card')).toHaveCount(1)
  })
})
