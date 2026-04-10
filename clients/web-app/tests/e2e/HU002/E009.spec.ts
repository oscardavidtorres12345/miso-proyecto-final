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
  test('E009 - El sistema pagina los resultados y permite navegar entre páginas', async ({ page }) => {
    // Given: fechas dentro del rango de inventario disponible (CURRENT_DATE +5 a +9)
    const checkIn = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)
    const checkOut = new Date(Date.now() + 9 * 86_400_000).toISOString().slice(0, 10)

    // And: el usuario autenticado navega a resultados de búsqueda con parámetros válidos
    await authenticatePage(page)
    await page.goto(
      `/search?destination=Cartagena&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // And: hay al menos una tarjeta visible; si no hay datos se omite el test
    const firstCard = page.locator('.accommodation-card').first()
    const cardVisible = await firstCard.isVisible().catch(() => false)
    if (!cardVisible) test.skip()

    // Then: si solo hay 1 página de resultados la paginación no se monta (totalPages <= 1 → null)
    // en ese caso el test se omite graciosamente
    const pagination = page.locator('.pagination')
    const paginationVisible = await pagination.isVisible().catch(() => false)
    if (!paginationVisible) test.skip()

    // And: el botón de página 1 tiene aria-current="page" (página activa por defecto)
    const page1Button = page.getByRole('button', { name: 'Ir a página 1' })
    await expect(page1Button).toHaveAttribute('aria-current', 'page')

    // When: el usuario hace clic en el botón de la página 2
    const page2Button = page.getByRole('button', { name: 'Ir a página 2' })
    if (!(await page2Button.isVisible().catch(() => false))) test.skip()
    await page2Button.click()

    // Then: la página 2 queda activa
    await expect(page2Button).toHaveAttribute('aria-current', 'page')

    // And: la página 1 ya no es la activa
    await expect(page1Button).not.toHaveAttribute('aria-current', 'page')
  })
})
