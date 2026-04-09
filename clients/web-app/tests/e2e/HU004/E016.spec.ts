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
  test('E016 - El usuario puede eliminar un ítem del carrito y la lista se actualiza', async ({ page }) => {
    // Given: el usuario autenticado está en la página del carrito
    await authenticatePage(page)
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // And: el carrito tiene 2 ítems al inicio (MOCK_CART_ITEMS)
    const cartItems = page.locator('.cart-item-card')
    await expect(cartItems).toHaveCount(2)

    // When: hace clic en el botón "Quitar del carrito" del primer ítem
    const firstRemoveBtn = cartItems.first().locator('.cart-item-card__remove')
    await firstRemoveBtn.click()

    // Then: la lista del carrito se actualiza y ahora contiene un solo ítem
    await expect(cartItems).toHaveCount(1)

    // And: el ítem restante sigue siendo visible y está completo
    await expect(cartItems.first().locator('.cart-item-card__title')).toBeVisible()

    // And: el total del resumen se recalcula (el elemento sigue visible)
    await expect(page.locator('.cart-summary__total-amount')).toBeVisible()
  })
})
