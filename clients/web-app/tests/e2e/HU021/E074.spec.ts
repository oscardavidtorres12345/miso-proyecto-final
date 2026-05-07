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
  test('E074 - Filtrado de comentarios por calificacion o fecha', async ({ page }) => {
    test.fixme(
      true,
      'Pendiente HU021: PortalFeedback todavia no envia ni aplica filtros por calificacion/fecha.',
    )

    const portalFeedbackUrl = '**/bookings/admin/feedback*'

    await page.route(portalFeedbackUrl, async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      const url = new URL(route.request().url())

      // Then: el request incluye filtros por calificacion o fecha
      expect(url.searchParams.get('rating')).toBe('5')
      expect(url.searchParams.get('from_date')).toBe('2026-04-01')
      expect(url.searchParams.get('to_date')).toBe('2026-04-30')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [
            {
              id: 7401,
              booking_id: 'bk-7401',
              property_id: 501,
              room_id: 1001,
              hotel_name: 'Hotel Nevado Real',
              room_name: 'Suite Junior',
              guest_name: 'Ana Perez',
              rating: 5,
              comment: 'Excelente estadia y servicio.',
              review_date: '2026-04-10T13:00:00Z',
            },
          ],
          status: 'ok',
        }),
      })
    })

    // Given: staff autenticado
    await authenticateStaff(page)

    // When: navega al portal de feedback con filtros aplicados
    await page.goto('/portal/feedback?rating=5&from_date=2026-04-01&to_date=2026-04-30', {
      waitUntil: 'domcontentloaded',
    })

    // And: solo se visualizan comentarios del filtro
    await expect(page.locator('.portal-feedback__item')).toHaveCount(1)
    await expect(page.getByLabel('Rating 5 de 5')).toBeVisible()
    await expect(page.getByText('Excelente estadia y servicio.')).toBeVisible()
  })
})
