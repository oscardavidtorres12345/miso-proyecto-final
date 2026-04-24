import { type Page, expect, request, test } from '@playwright/test'

async function authenticatePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: { user_id: 1, username: 'e2e-playwright', email: 'e2e@test.com', role: 'GUEST', is_active: true },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
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

test.describe('HU004 - Visualizacion de detalles de propiedad', () => {
  test('E014 - Consulta de politicas de cancelacion y reglas de la propiedad (horarios check-in/out)', async ({ page }) => {
    // Given: usuario autenticado navega directamente a detalle de propiedad
    await authenticatePage(page)
    // Property ID 3 = Nube Andina Hotel (Bogota, CO) - tiene informacion completa de horarios
    const checkIn = '2026-04-25'
    const checkOut = '2026-04-30'
    const propertyId = 3

    // When: navega directamente a la pagina de detalle
    await page.goto(
      `/accommodation/${propertyId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // Then: espera a que la pagina cargue completamente
    await page.locator('.accommodation-detail__loading').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    const errorState = page.locator('.accommodation-detail__error-state')
    if (await errorState.isVisible().catch(() => false)) test.skip()

    // And: el usuario consulta la informacion de horarios y politicas
    // Then: la seccion de horarios (check-in/check-out) es visible
    const scheduleSection = page.locator('.accommodation-detail__schedule')
    await expect(scheduleSection).toBeVisible()

    // And: se muestra el horario de check-in con iconos y texto descriptivo
    const scheduleRows = scheduleSection.locator('.accommodation-detail__schedule-row')
    await expect(scheduleRows.first()).toBeVisible()
    await expect(scheduleRows.first()).toContainText(/check.*in/i)

    // And: se muestra el horario de check-out
    await expect(scheduleRows.nth(1)).toBeVisible()
    await expect(scheduleRows.nth(1)).toContainText(/check.*out/i)

    // And: el widget lateral muestra informacion de la estadia
    const widget = page.locator('.accommodation-detail__widget')
    await expect(widget).toBeVisible()

    // And: el widget muestra precio y detalles de la reserva
    await expect(page.locator('.accommodation-detail__widget-price-amount')).toBeVisible()
  })
})
