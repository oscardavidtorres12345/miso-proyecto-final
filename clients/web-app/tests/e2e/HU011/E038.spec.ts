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

test.describe('HU011 - Dashboard ejecutivo de reservas (portal)', () => {
  test('E038 - Visualizacion de metricas clave en tiempo real', async ({ page }) => {
    await page.route('**/bookings/portal/dashboard*', async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          staff_user_id: 1,
          property_ids: [501],
          kpis: {
            total_reservations: 120,
            active_reservations: 18,
            current_guests: 42,
            income_total: 9800000,
          },
          occupancy_by_category: [
            { category: 'Suite', room_type: 'suite', value: 18, property_name: 'Hotel Central' },
          ],
          bookings_by_period: [{ period: '2026-05-01', value: 120 }],
          ranking: [{ label: 'Suite Junior', room_type: 'suite', value: 20 }],
          income_trend: [{ period: '2026-05-01', value: 9800000 }],
          meta: {
            date_from: '2026-05-01',
            date_to: '2026-05-31',
            granularity: 'day',
            currency: 'COP',
            top_n: 10,
            warnings: [],
          },
          status: 'ok',
        }),
      })
    })

    await authenticateStaff(page)
    await page.goto('/portal/dashboard', { waitUntil: 'domcontentloaded' })

    await expect(page.getByText('Total de reservas').locator('xpath=following-sibling::span[1]')).toHaveText('120')
    await expect(page.getByText('Reservas activas').locator('xpath=following-sibling::span[1]')).toHaveText('18')
    await expect(page.getByText('Huéspedes actuales').locator('xpath=following-sibling::span[1]')).toHaveText('42')
    await expect(page.getByText(/^Ingresos/).locator('xpath=following-sibling::span[1]')).toHaveText(/\$\s?9\.800\.000/)
  })
})
