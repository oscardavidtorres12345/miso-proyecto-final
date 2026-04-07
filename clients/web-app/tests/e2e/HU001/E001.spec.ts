import { expect, request, test } from '@playwright/test'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU001 - Autenticacion de usuarios (web)', () => {
  test('E001 - Registro exitoso de nuevo usuario con datos validos', async ({ page }) => {
    // Given: el usuario navega a la pantalla de registro
    await page.goto('/signup', { waitUntil: 'domcontentloaded' })

    const ts = Date.now()
    const uniqueEmail = `e001_${ts}@example.com`
    const uniqueDocument = `E001${ts}`
    const password = 'SecurePass123!'

    // When: completa el formulario con datos personales validos
    await page.locator('#firstName').fill('E2E')
    await page.locator('#lastName').fill('Playwright')
    await page.locator('#documentId').fill(uniqueDocument)
    await page.locator('#email').fill(uniqueEmail)
    await page.locator('#password').fill(password)
    await page.locator('#confirmPassword').fill(password)
    await page.locator('#terms').check()

    const registerResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/identity/auth/register') &&
        response.request().method() === 'POST',
    )

    await page.locator('.signup-card__submit').click()

    // Then: el backend responde exitosamente al registro
    const registerResponse = await registerResponsePromise
    expect(registerResponse.ok()).toBeTruthy()

    // And: el frontend redirige al usuario al login tras registro exitoso
    await expect(page).toHaveURL('/login', { timeout: 10_000 })
  })
})
