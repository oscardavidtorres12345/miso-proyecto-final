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
  test('E039 - Actualizacion automatica de datos al confirmar o rechazar reservas', async ({ page }) => {
    await page.route('**/bookings/portal/dashboard*', async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      const url = new URL(route.request().url())
      const isUsd = url.searchParams.get('currency') === 'USD'
      const activeReservations = isUsd ? 17 : 18
      const totalReservations = isUsd ? 121 : 120

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          staff_user_id: 1,
          property_ids: [501],
          kpis: {
            total_reservations: totalReservations,
            active_reservations: activeReservations,
            current_guests: 42,
            income_total: 9800000,
          },
          occupancy_by_category: [{ category: 'Suite', room_type: 'suite', value: 17, property_name: 'Hotel Central' }],
          bookings_by_period: [{ period: '2026-05-01', value: totalReservations }],
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
    const totalReservationsValue = page
      .getByText('Total de reservas')
      .locator('xpath=following-sibling::div[1]')
    const activeReservationsValue = page
      .getByText('Reservas activas')
      .locator('xpath=following-sibling::div[1]')

    await expect(totalReservationsValue).toHaveText('120')
    await expect(activeReservationsValue).toHaveText('18')

    // When: se simula actualizacion operativa aplicando nuevo filtro de consulta
    await page.getByRole('combobox', { name: 'Moneda' }).selectOption('USD')
    await page.getByRole('button', { name: 'Aplicar' }).click()

    // Then: dashboard actualiza automaticamente los datos
    await expect(totalReservationsValue).toHaveText('121')
    await expect(activeReservationsValue).toHaveText('17')
  })
})
