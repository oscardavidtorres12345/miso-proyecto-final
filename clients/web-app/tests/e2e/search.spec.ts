/**
 * HU002 - Búsqueda de Hospedajes
 * Suite de pruebas End-to-End (Playwright) — Estilo BDD (Given / When / Then)
 *
 * Escenarios cubiertos:
 *   E004 — Pantalla de búsqueda inicial
 *   E005 — Búsqueda válida por destino y fechas
 *   E006 — Selector de número de huéspedes
 *   E007 — Filtro de precio en resultados
 *   E008 — Filtros por servicios, tipo, estrellas y alimentación
 *   E009 — Paginación de resultados
 *   E010 — Precio total con impuestos indicado en tarjetas
 */

import { test, expect, request } from '@playwright/test'

// ── Health check: skip the whole suite if the app is not reachable ──────────
// This avoids 7 tests × 15s timeout × 2 retries = ~3min of wasted CI time
// when the frontend simply isn't deployed yet.
test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  E2E suite skipped — app not reachable at ${baseURL} (status: ${res?.status() ?? 'no response'})`)
    test.skip()
  }
})

test.describe('HU002 - Búsqueda de Hospedajes', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // E004: Pantalla de búsqueda inicial
  // ─────────────────────────────────────────────────────────────────────────
  test('E004 - La página principal muestra el buscador con los campos Destino, Fechas y Quién', async ({ page }) => {
    // Given: el usuario accede a la plataforma
    // waitUntil: 'domcontentloaded' is much faster than the default 'load' and
    // avoids the networkidle hang on CDN/CloudFront served pages
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Then: el buscador visible en el hero muestra los tres labels
    const searchBar = page.locator('.hero__search')
    await expect(searchBar.getByText('Destino', { exact: true })).toBeVisible()
    await expect(searchBar.getByText('Fechas', { exact: true })).toBeVisible()
    await expect(searchBar.getByText('Quién', { exact: true })).toBeVisible()

    // And: el botón de búsqueda está deshabilitado porque no hay datos ingresados
    await expect(searchBar.locator('.search-bar__button')).toBeDisabled()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // E005: Búsqueda válida — destino + fechas → navegar a resultados
  // ─────────────────────────────────────────────────────────────────────────
  test('E005 - El sistema navega a resultados al ingresar destino y fechas', async ({ page }) => {
    // Given: el usuario está en la página principal con el buscador visible
    await page.goto('/')
    const searchBar = page.locator('.hero__search')

    // When: ingresa un destino en el campo de texto
    await searchBar.getByPlaceholder('¿Adónde vas?').fill('Cartagena')

    // And: abre el selector de fechas haciendo clic en "Agrega fechas"
    await searchBar.getByText('Agrega fechas').click()
    const calendar = page.locator('.date-input__calendar')
    await expect(calendar).toBeVisible()

    // And: selecciona la fecha de llegada (primer día disponible)
    const enabledDays = calendar.locator('table button:not([disabled])')
    await enabledDays.first().click()

    // And: selecciona la fecha de salida (quinto día disponible)
    await enabledDays.nth(4).click()

    // And: el calendario se cierra automáticamente al completar el rango
    await expect(calendar).not.toBeVisible()

    // And: hace clic en el botón de búsqueda (ahora habilitado)
    await searchBar.locator('.search-bar__button').click()

    // Then: el sistema navega a la página de resultados de búsqueda
    await expect(page).toHaveURL('/search')

    // And: se muestra al menos una tarjeta de hospedaje
    await expect(page.locator('.accommodation-card').first()).toBeVisible()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // E006: Selector de número de huéspedes
  // ─────────────────────────────────────────────────────────────────────────
  test('E006 - El panel de huéspedes permite ajustar el número de adultos', async ({ page }) => {
    // Given: el usuario está en la página principal
    await page.goto('/')
    const searchBar = page.locator('.hero__search')

    // When: hace clic en el campo de huéspedes para abrir el panel
    await searchBar.getByText('¿Cuántos?').click()
    const guestsPanel = page.locator('.guests-input__dropdown')

    // Then: el panel de huéspedes se despliega
    await expect(guestsPanel).toBeVisible()

    // When: hace clic en el botón "+" de adultos (índice 1 entre botones no-switch)
    // Orden en GuestsPanel: [0] adults−  [1] adults+  [2] children−  [3] children+  [4] rooms−  [5] rooms+
    const counterButtons = guestsPanel.locator('button:not([role="switch"])')
    await counterButtons.nth(1).click()

    // Then: el display de huéspedes refleja el nuevo total (3 adultos: default 2 + 1 click)
    // Usamos :not(.date-input__display) para evitar ambigüedad con el display de fechas
    await expect(searchBar.locator('.input-display:not(.date-input__display)')).toContainText('3 huéspedes')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // E007: Filtro de precio en resultados
  // ─────────────────────────────────────────────────────────────────────────
  test('E007 - El filtro de precio acepta y retiene los valores mínimo y máximo', async ({ page }) => {
    // Given: el usuario está en la página de resultados de búsqueda
    await page.goto('/search')
    const filterSidebar = page.locator('aside.search-results-page__filters')

    // When: localiza el primer filter-card (PriceFilter) en la barra lateral
    const priceFilter = filterSidebar.locator('.filter-card').first()
    const minInput = priceFilter.locator('.price-filter__input-group').first().locator('input')
    const maxInput = priceFilter.locator('.price-filter__input-group').last().locator('input')

    // And: ingresa un precio mínimo
    await minInput.fill('100000')

    // And: ingresa un precio máximo
    await maxInput.fill('5000000')

    // Then: el campo de precio mínimo retiene el valor ingresado
    await expect(minInput).toHaveValue('100000')

    // And: el campo de precio máximo retiene el valor ingresado
    await expect(maxInput).toHaveValue('5000000')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // E008: Filtros por servicios, tipo de alojamiento, estrellas y alimentación
  // ─────────────────────────────────────────────────────────────────────────
  test('E008 - El usuario puede seleccionar múltiples filtros y quedan marcados', async ({ page }) => {
    // Given: el usuario está en la página de resultados de búsqueda
    await page.goto('/search')
    const filterSidebar = page.locator('aside.search-results-page__filters')

    // When: selecciona el servicio "Piscina" en el grupo de servicios
    await filterSidebar.getByLabel('Piscina').check()

    // And: selecciona el tipo de alojamiento "Hoteles"
    await filterSidebar.getByLabel('Hoteles').check()

    // And: selecciona la opción de alimentación "Desayuno" (exacto para no confundir con "Desayuno buffet")
    await filterSidebar.getByLabel('Desayuno', { exact: true }).check()

    // And: selecciona la calificación de 5 estrellas en el grupo de estrellas
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

  // ─────────────────────────────────────────────────────────────────────────
  // E009: Paginación de resultados
  // ─────────────────────────────────────────────────────────────────────────
  test('E009 - El sistema pagina los resultados y permite navegar entre páginas', async ({ page }) => {
    // Given: el usuario está en la página de resultados (viewport desktop 1280px)
    await page.goto('/search')
    const cards = page.locator('.accommodation-card')

    // When: verifica que la primera página muestra 20 hospedajes (PAGE_SIZE_DESKTOP = 20)
    await expect(cards).toHaveCount(20)

    // And: el botón de la página 1 tiene aria-current="page" (página activa)
    await expect(page.getByRole('button', { name: 'Ir a página 1' })).toHaveAttribute('aria-current', 'page')

    // When: navega a la página 2 haciendo clic en su botón de paginación
    await page.getByRole('button', { name: 'Ir a página 2' }).click()

    // Then: la página 2 queda activa (aria-current="page")
    await expect(page.getByRole('button', { name: 'Ir a página 2' })).toHaveAttribute('aria-current', 'page')

    // And: muestra los 5 hospedajes restantes (25 total − 20 primera página)
    await expect(cards).toHaveCount(5)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // E010: Precio total incluye impuestos y cargos
  // ─────────────────────────────────────────────────────────────────────────
  test('E010 - Las tarjetas muestran el precio con "Incluye impuestos y cargos", noches y adultos', async ({ page }) => {
    // Given: el usuario está en la página de resultados de búsqueda
    await page.goto('/search')

    // When: visualiza las tarjetas de hospedaje disponibles en la primera página
    // (no se requiere acción adicional — las tarjetas se cargan automáticamente)

    // Then: al menos una tarjeta muestra la leyenda "Incluye impuestos y cargos"
    const taxesBadge = page.locator('.accommodation-card__price-taxes').first()
    await expect(taxesBadge).toBeVisible()
    await expect(taxesBadge).toHaveText('Incluye impuestos y cargos')

    // And: las tarjetas muestran el número de noches en el bloque de precio
    const nightsLabel = page.locator('.accommodation-card__price-nights').first()
    await expect(nightsLabel).toBeVisible()
    await expect(nightsLabel).toContainText('noches')

    // And: las tarjetas muestran el número de adultos en el bloque de precio
    await expect(nightsLabel).toContainText('adultos')
  })
})

