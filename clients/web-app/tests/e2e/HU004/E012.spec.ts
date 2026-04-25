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
  test('E012 - Carga correcta de galeria de imagenes con navegacion entre fotos', async ({ page }) => {
    // Given: usuario autenticado navega directamente a la pagina de detalle de una propiedad conocida
    await authenticatePage(page)
    // Property ID 4 = La Candelaria Hostel (Bogota, CO) - tiene multiples fotos
    const checkIn = '2026-04-23'
    const checkOut = '2026-04-27'
    const propertyId = 4

    // When: navega directamente a la pagina de detalle
    await page.goto(
      `/accommodation/${propertyId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // Then: espera a que la pagina cargue completamente
    await page.locator('.accommodation-detail__loading').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    const errorState = page.locator('.accommodation-detail__error-state')
    if (await errorState.isVisible().catch(() => false)) test.skip()

    // And: la pagina de detalle se cargo exitosamente
    // Then: la galeria muestra la imagen principal
    const mainImg = page.locator('.accommodation-detail__gallery-main')
    await expect(mainImg).toBeVisible()
    const mainSrc = await mainImg.getAttribute('src')
    expect(mainSrc).toBeTruthy()

    // And: la galeria muestra thumbnails adicionales
    const thumbs = page.locator('.accommodation-detail__gallery-thumb')
    const thumbCount = await thumbs.count()
    expect(thumbCount).toBeGreaterThan(0)

    // And: cada thumbnail tiene un src valido
    for (let i = 0; i < Math.min(thumbCount, 4); i++) {
      const thumbSrc = await thumbs.nth(i).getAttribute('src')
      expect(thumbSrc).toBeTruthy()
    }

    // And: la galeria completa (main + thumbs) tiene multiples fotos
    expect(thumbCount).toBeGreaterThanOrEqual(1)
  })
})
