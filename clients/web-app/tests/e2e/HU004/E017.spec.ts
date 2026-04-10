import { expect, request, test } from '@playwright/test'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU004 - Acceso a rutas protegidas', () => {
  test('E017 - Un usuario no autenticado que accede al carrito ve la página de acceso restringido', async ({ page }) => {
    // Given: el usuario NO está autenticado (no hay sesión en localStorage)
    // (no se llama authenticatePage — el localStorage queda vacío)

    // When: intenta navegar directamente a la ruta protegida /cart
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // Then: el sistema muestra el componente Unauthorized con el código de error
    await expect(page.locator('.unauthorized__code')).toBeVisible()

    // And: el título comunica claramente que el acceso está restringido
    await expect(page.locator('.unauthorized__title')).toContainText('Acceso restringido')

    // And: el mensaje explica al usuario que necesita iniciar sesión
    await expect(page.locator('.unauthorized__description')).toContainText('Necesitas iniciar sesión')

    // And: hay un botón visible para que el usuario pueda ir al login
    await expect(page.locator('.unauthorized__btn')).toBeVisible()

    // And: la URL sigue siendo /cart (no redirige — el guard se renderiza inline)
    await expect(page).toHaveURL('/cart')
  })
})
