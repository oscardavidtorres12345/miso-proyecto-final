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
  test('E040 - Filtrado de informacion por rango de fechas personalizado', async ({ page }) => {
    const requestedUrls: string[] = []

    await page.route('**/bookings/portal/dashboard*', async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      const url = new URL(route.request().url())
      requestedUrls.push(route.request().url())

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          staff_user_id: 1,
          property_ids: [501],
          kpis: {
            total_reservations: url.searchParams.get('date_from') ? 35 : 120,
            active_reservations: 9,
            current_guests: 20,
            income_total: 3500000,
          },
          occupancy_by_category: [{ category: 'Suite', room_type: 'suite', value: 9, property_name: 'Hotel Central' }],
          bookings_by_period: [{ period: '2026-05-01', value: 35 }],
          ranking: [{ label: 'Suite Junior', room_type: 'suite', value: 10 }],
          income_trend: [{ period: '2026-05-01', value: 3500000 }],
          meta: {
            date_from: url.searchParams.get('date_from') ?? '2026-05-01',
            date_to: url.searchParams.get('date_to') ?? '2026-05-07',
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

    // Given: estado inicial cargado con un rango por defecto
    await expect.poll(() => requestedUrls.length).toBeGreaterThan(0)
    const beforeApplyUrl = requestedUrls[requestedUrls.length - 1]
    const beforeApplyParams = new URL(beforeApplyUrl).searchParams
    const beforeFrom = beforeApplyParams.get('date_from')

    // When: selecciona un rango personalizado desde el date picker y aplica
    await page.locator('.portal-dashboard__date-filter .input-box').click()
    const dayButtons = page.locator('.rdp-day_button:not([disabled])')
    await expect(dayButtons.first()).toBeVisible()
    await dayButtons.first().click()
    await page.getByRole('button', { name: 'Aplicar' }).click()

    // Then: request incluye date_from/date_to y se reflejan nuevos datos
    await expect.poll(() => requestedUrls.length).toBeGreaterThan(1)
    const afterApplyUrl = requestedUrls[requestedUrls.length - 1]
    const afterApplyParams = new URL(afterApplyUrl).searchParams
    expect(afterApplyParams.get('date_from')).toBeTruthy()
    expect(afterApplyParams.get('date_to')).toBeTruthy()
    expect(afterApplyParams.get('date_from')).not.toBe(beforeFrom)
    await expect(
      page.getByText('Total de reservas').locator('xpath=following-sibling::span[1]'),
    ).toHaveText('35')
  })
})
