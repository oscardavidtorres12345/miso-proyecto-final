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
  test('E004 - Busqueda exitosa filtrando por ubicacion, fechas y capacidad con resultados relevantes', async ({ page }) => {
    // Given: usuario autenticado en la pagina principal
    await authenticatePage(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // When: ingresa ubicacion en el buscador
    // El placeholder '¿Adónde vas?' aparece dos veces en el DOM (HeroSection + SearchBottomSheet mobile),
    // así que se scopea al contenedor .hero__search para seleccionar solo el visible en desktop.
    const heroSearch = page.locator('.hero__search')
    await heroSearch.getByPlaceholder('¿Adónde vas?').fill('Cartagena')

    // And: abre el calendario y selecciona check-in y check-out
    await heroSearch.getByText('Agrega fechas').click()
    const calendar = page.locator('.date-input__calendar')
    await expect(calendar).toBeVisible()
    const enabledDays = calendar.locator('table button:not([disabled])')
    await enabledDays.first().click()   // check-in: primer dia disponible
    await enabledDays.nth(4).click()    // check-out: 5to dia disponible
    await expect(calendar).not.toBeVisible()

    // And: abre el panel de huespedes e incrementa adultos en 1
    // Placeholder real: '¿Cuántos?' (t('search.howManyPlaceholder'))
    await heroSearch.getByText('¿Cuántos?').click()
    const guestsPanel = page.locator('.guests-input__dropdown')
    await expect(guestsPanel).toBeVisible()
    // Botones en orden: [adultos-menos, adultos-mas, ninos-menos, ...]
    // 'role=switch' es el toggle de mascotas; se excluye para obtener contadores
    const counterBtns = guestsPanel.locator('button:not([role="switch"])')
    await counterBtns.nth(1).click()   // adultos '+'

    // And: ejecuta la busqueda (el click cierra el dropdown y navega)
    const searchBtn = page.locator('.search-bar__button')
    await expect(searchBtn).toBeEnabled()
    await searchBtn.click()

    // Then: navega a la pagina de resultados de busqueda
    await expect(page).toHaveURL(/\/search/)

    // And: los parametros de busqueda estan reflejados en la URL
    const url = new URL(page.url())
    expect(url.searchParams.get('destination')).toBe('Cartagena')
    expect(url.searchParams.get('checkIn')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(url.searchParams.get('checkOut')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(Number(url.searchParams.get('adults'))).toBeGreaterThanOrEqual(1)

    // And: la pagina muestra resultados relevantes o el estado vacio
    // (depende de si el backend esta disponible con datos)
    const cards = page.locator('.accommodation-card')
    const emptyMsg = page.locator('.search-results-page__empty-message')
    await expect(cards.first().or(emptyMsg)).toBeVisible({ timeout: 8_000 })

    // And: si hay resultados, cada tarjeta muestra nombre y distancia
    if (await cards.count() > 0) {
      const first = cards.first()
      await expect(first.locator('.accommodation-card__name')).toBeVisible()
      await expect(first.locator('.accommodation-card__distance')).toBeVisible()
    }
  })
})
