import { type Page, expect, request, test } from '@playwright/test'

async function authenticateStaff(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: {
          user_id: 1,
          username: 'staff.e2e',
          email: 'staff.argentina@travelhub.com',
          role: 'STAFF',
          is_active: true,
        },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        token: 'e2e-staff-token',
      }),
    )
  })
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU021 - Visualizacion integrada de feedback de clientes (portal)', () => {
  test('E073 - Visualizacion de todas las resenas y calificaciones de una propiedad', async ({ page }) => {
    const portalFeedbackUrl = '**/bookings/admin/feedback*'

    await page.route(portalFeedbackUrl, async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [
            {
              id: 7301,
              booking_id: 'bk-7301',
              property_id: 501,
              room_id: 1001,
              hotel_name: 'Hotel Nevado Real',
              room_name: 'Suite Junior',
              guest_name: 'Ana Perez',
              rating: 5,
              comment: 'Excelente estadia y servicio.',
              review_date: '2026-04-10T13:00:00Z',
            },
            {
              id: 7302,
              booking_id: 'bk-7302',
              property_id: 501,
              room_id: 1002,
              hotel_name: 'Hotel Nevado Real',
              room_name: 'Habitacion Estandar',
              guest_name: 'Luis Gomez',
              rating: 4,
              comment: 'Muy buena ubicacion.',
              review_date: '2026-04-12T09:30:00Z',
            },
          ],
          status: 'ok',
        }),
      })
    })

    // Given: staff autenticado
    await authenticateStaff(page)

    // When: ingresa al modulo de feedback
    await page.goto('/portal/feedback', { waitUntil: 'domcontentloaded' })

    // Then: visualiza todas las resenas y su calificacion
    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeVisible()
    await expect(page.locator('.portal-feedback__item')).toHaveCount(2)
    await expect(page.getByText('Hotel Nevado Real — Suite Junior')).toBeVisible()
    await expect(page.getByText('Excelente estadia y servicio.')).toBeVisible()
    await expect(page.getByLabel('Rating 5 de 5')).toBeVisible()
    await expect(page.getByText('Hotel Nevado Real — Habitacion Estandar')).toBeVisible()
    await expect(page.getByText('Muy buena ubicacion.')).toBeVisible()
    await expect(page.getByLabel('Rating 4 de 5')).toBeVisible()
  })
})
