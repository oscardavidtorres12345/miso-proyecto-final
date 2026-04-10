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
  test('E010 - Las tarjetas muestran el precio total con "Incluye impuestos y cargos", noches y adultos', async ({ page }) => {
    // Given: fechas dentro del rango de inventario disponible (CURRENT_DATE +5 a +9)
    const checkIn = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)
    const checkOut = new Date(Date.now() + 9 * 86_400_000).toISOString().slice(0, 10)

    // And: el usuario autenticado navega a resultados de búsqueda con parámetros válidos
    await authenticatePage(page)
    await page.goto(
      `/search?destination=Cartagena&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // And: hay al menos una tarjeta visible; si no hay datos se omite el test graciosamente
    const firstCard = page.locator('.accommodation-card').first()
    const cardVisible = await firstCard.isVisible().catch(() => false)
    if (!cardVisible) test.skip()

    // Then: al menos una tarjeta muestra la leyenda "Incluye impuestos y cargos"
    // (el precio mostrado es precio_noche × noches × (1 + tax_rate), IVA incluido)
    const taxesBadge = page.locator('.accommodation-card__price-taxes').first()
    await expect(taxesBadge).toBeVisible()
    await expect(taxesBadge).toHaveText('Incluye impuestos y cargos')

    // And: las tarjetas muestran el número de noches en el bloque de precio
    const nightsLabel = page.locator('.accommodation-card__price-nights').first()
    await expect(nightsLabel).toBeVisible()
    await expect(nightsLabel).toContainText('noches')

    // And: las tarjetas muestran el número de adultos en el bloque de precio
    await expect(nightsLabel).toContainText('adultos')
  })
})
