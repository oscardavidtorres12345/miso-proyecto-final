import { expect, request, test } from '@playwright/test'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU002 - Búsqueda de Hospedajes', () => {
  test('E008 - El usuario puede seleccionar múltiples filtros y quedan marcados', async ({ page }) => {
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

    // When: selecciona el servicio "Piscina" en el grupo de servicios
    await filterSidebar.getByLabel('Piscina').check()

    // And: selecciona el tipo de alojamiento "Hoteles"
    await filterSidebar.getByLabel('Hoteles').check()

    // And: selecciona la opción de alimentación "Desayuno" (exacto para no confundir con "Desayuno buffet")
    await filterSidebar.getByLabel('Desayuno', { exact: true }).check()

    // And: selecciona la calificación de 5 estrellas
    await filterSidebar.locator('.filter-stars').getByLabel('★★★★★').check()

    // Then: el checkbox de "Piscina" queda marcado
    await expect(filterSidebar.getByLabel('Piscina')).toBeChecked()

    // And: el checkbox de "Hoteles" queda marcado
    await expect(filterSidebar.getByLabel('Hoteles')).toBeChecked()

    // And: el checkbox de "Desayuno" queda marcado
    await expect(filterSidebar.getByLabel('Desayuno', { exact: true })).toBeChecked()

    // And: el checkbox de 5 estrellas queda marcado
    await expect(filterSidebar.locator('.filter-stars').getByLabel('★★★★★')).toBeChecked()
  })
})
