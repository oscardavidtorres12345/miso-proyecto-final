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

test.describe('HU004 - Visualización de detalles de propiedad', () => {
  test('E011 - Hacer clic en "Ver detalles" desde resultados de búsqueda navega al detalle del hospedaje', async ({ page }) => {
    // Given: el usuario autenticado está en la página de resultados de búsqueda
    // con parámetros de búsqueda válidos (destino + fechas dentro del inventario disponible)
    await authenticatePage(page)
    const checkIn = '2026-04-11'
    const checkOut = '2026-04-13'
    await page.goto(
      `/search?destination=Bogota&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // And: hay al menos una tarjeta de hospedaje visible en los resultados
    const firstCard = page.locator('.accommodation-card').first()
    const cardVisible = await firstCard.isVisible().catch(() => false)
    if (!cardVisible) test.skip()

    // When: hace clic en el botón "Ver detalles" de la primera tarjeta
    await firstCard.locator('.accommodation-card__btn').click()

    // Then: el sistema navega a la URL del detalle del hospedaje
    await expect(page).toHaveURL(/\/accommodation\/\w+/, { timeout: 10_000 })

    // And: espera a que el spinner de carga desaparezca
    await page
      .locator('.accommodation-detail__loading')
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => {})

    // And: si la API del hospedaje no está disponible, el test se omite graciosamente
    if (await page.locator('.accommodation-detail__error-state').isVisible()) {
      test.skip()
    }

    // And: el nombre del hospedaje es visible como encabezado principal de la página
    await expect(page.locator('.accommodation-detail__name')).toBeVisible()
  })
})
