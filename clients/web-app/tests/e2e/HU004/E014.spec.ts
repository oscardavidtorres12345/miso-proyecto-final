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
  test('E014 - Hacer clic en "Seleccionar" en una habitación redirige al usuario al checkout', async ({ page }) => {
    // Given: el usuario autenticado está en la página de detalle del hospedaje
    await authenticatePage(page)
    await goToDetailOrSkip(page, '1')

    // And: hay al menos una tarjeta de habitación disponible en la sección
    const firstRoomCard = page.locator('.accommodation-detail__room-card').first()
    await expect(firstRoomCard).toBeVisible()

    // When: hace clic en el botón "Seleccionar" de la primera habitación
    // (.accommodation-detail__room-btn sin el modificador --cart es el botón primario)
    const selectBtn = firstRoomCard.locator(
      '.accommodation-detail__room-btn:not(.accommodation-detail__room-btn--cart)',
    )
    await selectBtn.click()

    // Then: el sistema navega a la página de checkout
    await expect(page).toHaveURL('/checkout', { timeout: 10_000 })

    // And: la página de checkout muestra su título
    await expect(page.locator('.checkout-page__title')).toBeVisible()
  })
})
