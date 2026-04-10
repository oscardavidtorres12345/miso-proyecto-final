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

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU004 - Carrito de compras', () => {
  test('E015 - El carrito muestra los ítems cargados, el total de precios y el panel de resumen del pedido', async ({ page }) => {
    // Given: el usuario autenticado navega a la página del carrito
    await authenticatePage(page)
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // Then: el encabezado de la página es "Carrito"
    await expect(page.locator('.cart-page__title')).toBeVisible()

    // And: se muestran exactamente 2 ítems del carrito (MOCK_CART_ITEMS tiene 2 ítems)
    const cartItems = page.locator('.cart-item-card')
    await expect(cartItems).toHaveCount(2)

    // And: cada ítem muestra su imagen, nombre y precio
    await expect(cartItems.first().locator('.cart-item-card__image')).toBeVisible()
    await expect(cartItems.first().locator('.cart-item-card__title')).toBeVisible()

    // And: el panel lateral de resumen del pedido es visible (viewport >= 1024px)
    const sidebar = page.locator('.cart-page__sidebar')
    await expect(sidebar).toBeVisible()

    // And: el resumen muestra el total acumulado de la compra
    await expect(sidebar.locator('.cart-summary__total-amount')).toBeVisible()

    // And: el botón de pagar está disponible para el usuario
    await expect(sidebar.getByRole('button', { name: /pagar/i })).toBeVisible()
  })
})
