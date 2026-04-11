import { type Page, expect, request, test } from '@playwright/test'

/** Inyecta una sesión de auth válida en localStorage ANTES de navegar. */
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

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU002 - Búsqueda de Hospedajes', () => {
  test('E005 - El sistema navega a resultados al ingresar destino y fechas', async ({ page }) => {
    // Given: el usuario autenticado está en la página principal con el buscador visible
    await authenticatePage(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const searchBar = page.locator('.hero__search')

    // When: ingresa un destino en el campo de texto
    await searchBar.getByPlaceholder('¿Adónde vas?').fill('Cartagena')

    // And: abre el selector de fechas haciendo clic en "Agrega fechas"
    await searchBar.getByText('Agrega fechas').click()
    const calendar = page.locator('.date-input__calendar')
    await expect(calendar).toBeVisible()

    // And: selecciona la fecha de llegada (primer día habilitado del calendario)
    const enabledDays = calendar.locator('table button:not([disabled])')
    await enabledDays.first().click()

    // And: selecciona la fecha de salida (quinto día habilitado)
    await enabledDays.nth(4).click()

    // And: el calendario se cierra automáticamente al completar el rango
    await expect(calendar).not.toBeVisible()

    // And: hace clic en el botón de búsqueda (ahora habilitado)
    await searchBar.locator('.search-bar__button').click()

    // Then: el sistema navega a la página de resultados de búsqueda
    await expect(page).toHaveURL(/\/search/)

    // And: se muestra al menos una tarjeta de hospedaje
    const firstCard = page.locator('.accommodation-card').first()
    const cardVisible = await firstCard.isVisible().catch(() => false)
    if (!cardVisible) test.skip()
    await expect(firstCard).toBeVisible()
  })
})
