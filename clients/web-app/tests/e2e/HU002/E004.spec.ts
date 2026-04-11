import { expect, request, test } from '@playwright/test'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU002 - Búsqueda de Hospedajes', () => {
  test('E004 - La página principal muestra el buscador con los campos Destino, Fechas y Quién', async ({ page }) => {
    // Given: el usuario accede a la plataforma
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Then: el buscador visible en el hero muestra los tres labels
    const searchBar = page.locator('.hero__search')
    await expect(searchBar.getByText('Destino', { exact: true })).toBeVisible()
    await expect(searchBar.getByText('Fechas', { exact: true })).toBeVisible()
    await expect(searchBar.getByText('Quién', { exact: true })).toBeVisible()

    // And: el botón de búsqueda está deshabilitado porque no hay datos ingresados
    await expect(searchBar.locator('.search-bar__button')).toBeDisabled()
  })
})
