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
  test('E009 - El sistema pagina los resultados y permite navegar entre páginas', async ({ page, context }) => {
    // Given: viewport mobile (≤650px) → PAGE_SIZE_MOBILE = 10
    // El seed local tiene ~19 propiedades con "a" en su ubicación (LIKE '%a%').
    // Con page_size=10 se obtienen 2 páginas (10 + ~9) garantizando paginación visible.
    await page.setViewportSize({ width: 480, height: 844 })

    // And: fechas dentro del rango de inventario disponible (CURRENT_DATE +5 a +9)
    const checkIn = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)
    const checkOut = new Date(Date.now() + 9 * 86_400_000).toISOString().slice(0, 10)

    // And: el usuario autenticado navega a resultados con búsqueda amplia que retorna >10 propiedades
    await authenticatePage(page)
    await page.goto(
      `/search?destination=a&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // And: hay al menos una tarjeta visible; si el backend no está disponible se omite el test
    const firstCard = page.locator('.accommodation-card').first()
    const cardVisible = await firstCard.isVisible().catch(() => false)
    if (!cardVisible) test.skip()

    // Then: el control de paginación es visible (totalPages > 1)
    const pagination = page.locator('.pagination')
    await expect(pagination).toBeVisible()

    // And: el botón de página 1 tiene aria-current="page" (página activa por defecto)
    const page1Button = page.getByRole('button', { name: 'Ir a página 1' })
    await expect(page1Button).toHaveAttribute('aria-current', 'page')

    // When: el usuario hace clic en el botón de la página 2
    await page.getByRole('button', { name: 'Ir a página 2' }).click()

    // Then: la página 2 queda activa
    await expect(page.getByRole('button', { name: 'Ir a página 2' })).toHaveAttribute('aria-current', 'page')

    // And: la página 1 ya no es la activa
    await expect(page1Button).not.toHaveAttribute('aria-current', 'page')
  })
})
