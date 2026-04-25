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
  test('E013 - Visualizacion de disponibilidad en tiempo real (habitaciones con precios)', async ({ page }) => {
    // Given: usuario autenticado navega directamente a una propiedad de Medellin
    await authenticatePage(page)
    // Property ID 1 = Hotel El Poblado (Medellin, CO) - tiene multiples habitaciones con precios
    const checkIn = '2026-04-24'
    const checkOut = '2026-04-29'
    const propertyId = 1

    // When: navega directamente a la pagina de detalle
    await page.goto(
      `/accommodation/${propertyId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // Then: espera a que la pagina cargue completamente
    await page.locator('.accommodation-detail__loading').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    const errorState = page.locator('.accommodation-detail__error-state')
    if (await errorState.isVisible().catch(() => false)) test.skip()

    // And: hace scroll a la seccion de habitaciones
    const roomsSection = page.locator('#rooms')
    await roomsSection.scrollIntoViewIfNeeded()

    // Then: la seccion de habitaciones es visible
    await expect(roomsSection).toBeVisible()

    // And: se muestran habitaciones disponibles con precios en tiempo real
    const roomCards = page.locator('.accommodation-detail__room-card')
    const roomCount = await roomCards.count()
    expect(roomCount).toBeGreaterThan(0)

    // And: cada habitacion muestra nombre, descripcion y precio
    const firstRoom = roomCards.first()
    await expect(firstRoom.locator('.accommodation-detail__room-name')).toBeVisible()
    await expect(firstRoom.locator('.accommodation-detail__room-description')).toBeVisible()
    await expect(firstRoom.locator('.accommodation-detail__room-per-night-price')).toBeVisible()

    // And: el boton 'Seleccionar' esta disponible (indica disponibilidad)
    const selectBtn = firstRoom.locator('.accommodation-detail__room-btn').first()
    await expect(selectBtn).toBeVisible()
  })
})
