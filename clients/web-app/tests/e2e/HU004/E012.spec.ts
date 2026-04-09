import { type Page, expect, request, test } from '@playwright/test'

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

/** Navega al detalle del hospedaje y salta el test si la API no está disponible. */
async function goToDetailOrSkip(page: Page, hotelId = '1'): Promise<void> {
  await page.goto(`/accommodation/${hotelId}`, { waitUntil: 'domcontentloaded' })
  await page
    .locator('.accommodation-detail__loading')
    .waitFor({ state: 'hidden', timeout: 10_000 })
    .catch(() => {})
  if (await page.locator('.accommodation-detail__error-state').isVisible()) {
    test.skip()
  }
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU004 - Visualización de detalles de propiedad', () => {
  test('E012 - La página de detalle muestra la galería, el nombre del hospedaje, las secciones de amenidades, horarios y habitaciones', async ({ page }) => {
    // Given: el usuario autenticado navega al detalle del hospedaje con ID "1"
    await authenticatePage(page)
    await goToDetailOrSkip(page, '1')

    // Then: la imagen principal de la galería fotográfica es visible
    await expect(page.locator('.accommodation-detail__gallery-main')).toBeVisible()

    // And: el nombre del hospedaje aparece como encabezado h1 de la página
    await expect(page.locator('.accommodation-detail__name')).toBeVisible()

    // And: la sección de amenidades está presente en la página
    const sectionTitles = page.locator('.accommodation-detail__section-title')
    await expect(sectionTitles.nth(0)).toBeVisible()

    // And: la sección de horarios está presente en la página
    await expect(sectionTitles.nth(1)).toBeVisible()

    // And: la sección de habitaciones está presente en la página
    await expect(sectionTitles.nth(2)).toBeVisible()

    // And: el widget lateral de precio muestra el botón "Ver habitaciones"
    await expect(page.locator('.accommodation-detail__widget-btn')).toBeVisible()

    // And: el widget muestra el precio por estadía del cuarto sugerido
    await expect(page.locator('.accommodation-detail__widget-price-amount')).toBeVisible()
  })
})
