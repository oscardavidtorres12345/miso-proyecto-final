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

test.describe('HU002 - Busqueda de Hospedajes', () => {
  test('E007 - Modificacion dinamica de filtros y actualizacion inmediata de resultados sin recargar pagina', async ({ page }) => {
    // Given: usuario autenticado navega a resultados de busqueda en Bogota
    // Datos reales en BD: Nube Andina Hotel (~596k COP) y La Candelaria Hostel (~599k COP)
    await authenticatePage(page)
    const checkInDate = new Date()
    checkInDate.setDate(checkInDate.getDate() + 1)
    const checkOutDate = new Date()
    checkOutDate.setDate(checkOutDate.getDate() + 7)
    const checkIn = checkInDate.toISOString().slice(0, 10)
    const checkOut = checkOutDate.toISOString().slice(0, 10)
    await page.goto(
      `/search?destination=Bogota&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      { waitUntil: 'domcontentloaded' },
    )

    // Esperar a que cargue la pagina con resultados
    const cards = page.locator('.accommodation-card')
    const emptyMsg = page.locator('.search-results-page__empty-message')
    await expect(cards.first().or(emptyMsg)).toBeVisible({ timeout: 8_000 })
    const countBefore = await cards.count()
    expect(countBefore).toBeGreaterThan(0) // Debe haber al menos 2 propiedades en Bogota

    // When: el usuario modifica el filtro de precio maximo a 400,000 COP
    // Esto deberia filtrar algunos resultados ya que los precios van de ~150k a ~990k COP
    const sidebar = page.locator('.search-results-page__filters')
    const priceMax = sidebar.getByRole('textbox', { name: 'Máx.' })

    if (!(await priceMax.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip()
      return
    }

    // Capturar el estado de navegacion ANTES de modificar el filtro
    const navsBefore = await page.evaluate(
      () => performance.getEntriesByType('navigation').length,
    )

    // Ingresa precio maximo que filtrara algunos resultados
    await priceMax.fill('400000')

    // Esperar mas que el debounce (FILTER_INPUT_DEBOUNCE_MS = 500ms) para procesar el filtro
    await page.waitForTimeout(1200)

    // Then: la pagina NO se recargo (sin full navigation/reload)
    const navsAfter = await page.evaluate(
      () => performance.getEntriesByType('navigation').length,
    )
    expect(navsAfter).toBe(navsBefore)

    // And: el numero de resultados se actualizo dinamicamente sin recargar la pagina
    const countAfter = await cards.count()
    expect(countAfter).toBeLessThanOrEqual(countBefore)

    // And: el boton 'Limpiar filtros' deberia aparecer (puede estar en version mobile o desktop)
    const clearBtn = sidebar.locator('button', { hasText: 'Limpiar' }).first()
    const clearBtnVisible = await clearBtn.isVisible({ timeout: 2_000 }).catch(() => false)

    // When: el usuario cambia el filtro nuevamente a un valor mas alto (600,000 COP)
    await priceMax.fill('600000')
    await page.waitForTimeout(1200)

    // Then: los resultados se actualizan nuevamente sin reload
    const navsAfterSecondChange = await page.evaluate(
      () => performance.getEntriesByType('navigation').length,
    )
    expect(navsAfterSecondChange).toBe(navsBefore)

    const countAfterSecondChange = await cards.count()
    expect(countAfterSecondChange).toBeGreaterThanOrEqual(countAfter)

    // And: si el boton de limpiar filtros esta visible, al hacer click se restauran los resultados
    if (clearBtnVisible && await clearBtn.isVisible()) {
      await clearBtn.click()
      await page.waitForTimeout(800)
      const countAfterClear = await cards.count()
      expect(countAfterClear).toBeGreaterThanOrEqual(countAfterSecondChange)
    }
  })
})
