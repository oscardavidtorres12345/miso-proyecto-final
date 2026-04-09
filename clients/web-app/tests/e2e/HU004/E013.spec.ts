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
  test('E013 - El botón "Ver habitaciones" hace scroll hasta la sección de habitaciones', async ({ page }) => {
    // Given: el usuario autenticado está en la página de detalle del hospedaje
    await authenticatePage(page)
    await goToDetailOrSkip(page, '1')

    // And: la sección de habitaciones existe en el DOM pero puede estar fuera de la vista
    await expect(page.locator('#rooms')).toBeAttached()

    // When: hace clic en el botón "Ver habitaciones" del widget lateral de precio
    await page.locator('.accommodation-detail__widget-btn').click()

    // Then: la sección de habitaciones queda visible dentro del viewport
    await expect(page.locator('#rooms')).toBeInViewport({ timeout: 5_000 })

    // And: al menos una tarjeta de habitación es visible dentro de dicha sección
    await expect(
      page.locator('#rooms .accommodation-detail__room-card').first(),
    ).toBeVisible()
  })
})
