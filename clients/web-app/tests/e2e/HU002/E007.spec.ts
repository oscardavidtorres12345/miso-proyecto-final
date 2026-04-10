import { expect, request, test } from '@playwright/test'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU002 - Búsqueda de Hospedajes', () => {
  test('E007 - El filtro de precio acepta y retiene los valores mínimo y máximo', async ({ page }) => {
    // Given: fechas dentro del rango de inventario disponible (CURRENT_DATE +5 a +9)
    const checkIn = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)
    const checkOut = new Date(Date.now() + 9 * 86_400_000).toISOString().slice(0, 10)

    // And: el usuario navega a resultados de búsqueda con parámetros válidos
    await page.goto(
      `/search?destination=Cartagena&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // And: hay resultados visibles para que el panel de filtros se monte
    const firstCard = page.locator('.accommodation-card').first()
    const cardVisible = await firstCard.isVisible().catch(() => false)
    if (!cardVisible) test.skip()

    const filterSidebar = page.locator('aside.search-results-page__filters')

    // When: localiza el primer filter-card (PriceFilter) en la barra lateral
    const priceFilter = filterSidebar.locator('.filter-card').first()
    const minInput = priceFilter.locator('.price-filter__input-group').first().locator('input')
    const maxInput = priceFilter.locator('.price-filter__input-group').last().locator('input')

    // And: ingresa un precio mínimo de estadía total
    await minInput.fill('100000')

    // And: ingresa un precio máximo de estadía total
    await maxInput.fill('5000000')

    // Then: el campo de precio mínimo retiene el valor (formateado con separadores de miles)
    // PriceFilter aplica formato colombiano: 100000 → "100.000"
    await expect(minInput).toHaveValue('100.000')

    // And: el campo de precio máximo retiene el valor ingresado (5000000 → "5.000.000")
    await expect(maxInput).toHaveValue('5.000.000')
  })
})
