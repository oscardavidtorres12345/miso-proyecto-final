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
  test('E075 - Calculo correcto de calificacion promedio global', async ({ page }) => {
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
              id: 7501,
              booking_id: 'bk-7501',
              property_id: 501,
              room_id: 1001,
              hotel_name: 'Hotel Nevado Real',
              room_name: 'Suite Junior',
              guest_name: 'Ana Perez',
              rating: 5,
              comment: 'Excelente.',
              review_date: '2026-04-01T10:00:00Z',
            },
            {
              id: 7502,
              booking_id: 'bk-7502',
              property_id: 501,
              room_id: 1002,
              hotel_name: 'Hotel Nevado Real',
              room_name: 'Deluxe',
              guest_name: 'Carlos Ruiz',
              rating: 4,
              comment: 'Muy buena.',
              review_date: '2026-04-02T11:00:00Z',
            },
            {
              id: 7503,
              booking_id: 'bk-7503',
              property_id: 501,
              room_id: 1003,
              hotel_name: 'Hotel Nevado Real',
              room_name: 'Estandar',
              guest_name: 'Laura Diaz',
              rating: 3,
              comment: 'Aceptable.',
              review_date: '2026-04-03T12:00:00Z',
            },
          ],
          average_rating: 4,
          status: 'ok',
        }),
      })
    })

    // Given: staff autenticado
    await authenticateStaff(page)

    // When: consulta el modulo de feedback
    await page.goto('/portal/feedback', { waitUntil: 'domcontentloaded' })

    // Then: se muestra el promedio global de calificacion correcto
    await expect(page.getByText(/calificacion promedio global/i)).toContainText('4.0')
  })
})
