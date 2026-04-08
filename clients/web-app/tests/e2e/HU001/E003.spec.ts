import { expect, request as playwrightRequest, test } from '@playwright/test'

const IDENTITY_API_BASE_URL = process.env.IDENTITY_API_BASE_URL ?? 'http://localhost:8001/api/v1'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU001 - Autenticacion de usuarios (web)', () => {
  test('E003 - Rechazo de registro con email duplicado', async ({ page, request }) => {
    // Given: existe un usuario ya registrado con un email especifico
    const ts = Date.now()
    const duplicatedEmail = `e003_dup_${ts}@example.com`
    const password = 'SecurePass123!'

    const firstRegister = await request.post(`${IDENTITY_API_BASE_URL}/identity/auth/register`, {
      data: {
        first_name: 'E2E',
        last_name: 'Duplicate',
        email: duplicatedEmail,
        document_id: `E003A${ts}`,
        document_type_id: 1,
        jurisdiction_id: 1,
        password,
        password_confirmation: password,
      },
    })
    expect(firstRegister.ok()).toBeTruthy()

    // When: el usuario intenta registrarse nuevamente con el mismo email
    await page.goto('/signup', { waitUntil: 'domcontentloaded' })
    await page.locator('#firstName').fill('E2E')
    await page.locator('#lastName').fill('DuplicateRetry')
    await page.locator('#documentId').fill(`E003B${ts}`)
    await page.locator('#email').fill(duplicatedEmail)
    await page.locator('#password').fill(password)
    await page.locator('#confirmPassword').fill(password)
    await page.locator('#terms').check()

    const duplicateResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/identity/auth/register') &&
        response.request().method() === 'POST',
    )

    await page.locator('.signup-card__submit').click()

    // Then: el backend rechaza el registro por conflicto (email duplicado)
    const duplicateResponse = await duplicateResponsePromise
    expect(duplicateResponse.status()).toBe(409)

    // And: el usuario no queda autenticado
    const authSession = await page.evaluate(() => window.localStorage.getItem('travel-hub-auth'))
    expect(authSession).toBeNull()
  })

  test('E003 - Rechazo de registro con password que no cumple politicas', async ({ page }) => {
    // Given: el usuario esta en la pantalla de registro
    await page.goto('/signup', { waitUntil: 'domcontentloaded' })

    const ts = Date.now()

    // When: completa el formulario con password invalida (menos de 8 caracteres)
    await page.locator('#firstName').fill('E2E')
    await page.locator('#lastName').fill('WeakPassword')
    await page.locator('#documentId').fill(`E003C${ts}`)
    await page.locator('#email').fill(`e003_weak_${ts}@example.com`)
    await page.locator('#password').fill('abc123')
    await page.locator('#confirmPassword').fill('abc123')
    await page.locator('#terms').check()

    // Then: el boton de registro permanece deshabilitado por validacion de politica
    await expect(page.locator('.signup-card__submit')).toBeDisabled()

    // And: no existe sesion autenticada
    const authSession = await page.evaluate(() => window.localStorage.getItem('travel-hub-auth'))
    expect(authSession).toBeNull()
  })
})
