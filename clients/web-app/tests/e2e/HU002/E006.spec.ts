import { expect, request, test } from '@playwright/test'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU002 - Búsqueda de Hospedajes', () => {
  test('E006 - El panel de huéspedes permite ajustar el número de adultos', async ({ page }) => {
    // Given: el usuario está en la página principal
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const searchBar = page.locator('.hero__search')

    // When: hace clic en el campo de huéspedes para abrir el panel
    await searchBar.getByText('¿Cuántos?').click()
    const guestsPanel = page.locator('.guests-input__dropdown')

    // Then: el panel de huéspedes se despliega
    await expect(guestsPanel).toBeVisible()

    // When: hace clic en el botón "+" de adultos
    // Orden en GuestsPanel: [0] adults−  [1] adults+  [2] children−  [3] children+  [4] rooms−  [5] rooms+
    const counterButtons = guestsPanel.locator('button:not([role="switch"])')
    await counterButtons.nth(1).click()

    // Then: el display de huéspedes refleja el nuevo total (3 adultos: default 2 + 1 click)
    await expect(searchBar.locator('.input-display:not(.date-input__display)')).toContainText('3 huéspedes')
  })
})
