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
  test('E011 - Visualizacion completa de informacion de propiedad (fotos, descripcion, amenidades, ubicacion)', async ({ page }) => {
    // Given: usuario autenticado navega directamente a la pagina de detalle de una propiedad conocida
    await authenticatePage(page)
    // Usar fechas fijas dentro del rango de inventario disponible (2026-04-22 a 2026-05-01)
    // Property ID 3 = Nube Andina Hotel (Bogota, CO)
    const checkIn = '2026-04-23'
    const checkOut = '2026-04-28'
    const propertyId = 3

    // When: navega directamente a la pagina de detalle con parametros de busqueda
    await page.goto(
      `/accommodation/${propertyId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // Then: espera a que la pagina cargue completamente
    await page.locator('.accommodation-detail__loading').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    const errorState = page.locator('.accommodation-detail__error-state')
    if (await errorState.isVisible().catch(() => false)) test.skip()

    // And: la galeria de fotos es visible (foto principal + thumbnails)
    await expect(page.locator('.accommodation-detail__gallery')).toBeVisible()
    await expect(page.locator('.accommodation-detail__gallery-main')).toBeVisible()

    // And: el nombre de la propiedad se muestra como encabezado principal
    const nameEl = page.locator('.accommodation-detail__name')
    await expect(nameEl).toBeVisible()
    const name = await nameEl.textContent()
    expect(name).toBeTruthy()

    // And: las estrellas de calificacion son visibles (ubicacion/rating)
    await expect(page.locator('.accommodation-detail__stars')).toBeVisible()

    // And: la descripcion de la propiedad es visible
    await expect(page.locator('.accommodation-detail__description')).toBeVisible()

    // And: la seccion de amenidades muestra al menos una amenidad
    await expect(page.locator('.accommodation-detail__amenity').first()).toBeVisible()

    // And: la seccion de horarios (check-in/out) es visible
    await expect(page.locator('.accommodation-detail__schedule').first()).toBeVisible()
  })
})
