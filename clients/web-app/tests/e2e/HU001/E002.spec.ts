import { expect, request as playwrightRequest, test } from '@playwright/test'

const IDENTITY_API_BASE_URL = process.env.IDENTITY_API_BASE_URL ?? 'http://localhost:8001/api/v1'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU001 - Autenticacion de usuarios (web)', () => {
  test('E002 - Login exitoso con credenciales validas y sesion activa', async ({ page, request }) => {
    // Given: existe un usuario valido registrado en identity-service
    const ts = Date.now()
    const userEmail = `e002_${ts}@example.com`
    const userPassword = 'SecurePass123!'

    const registerResponse = await request.post(`${IDENTITY_API_BASE_URL}/identity/auth/register`, {
      data: {
        first_name: 'E2E',
        last_name: 'Login',
        email: userEmail,
        document_id: `E002${ts}`,
        document_type_id: 1,
        jurisdiction_id: 1,
        password: userPassword,
        password_confirmation: userPassword,
      },
    })
    expect(registerResponse.ok()).toBeTruthy()

    // When: el usuario accede a login y envia credenciales validas
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.locator('#email').fill(userEmail)
    await page.locator('#password').fill(userPassword)

    const loginResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/identity/auth/web/login') &&
        response.request().method() === 'POST',
    )

    await page.locator('.login-card__submit').click()

    // Then: el backend responde exitosamente al login
    const loginResponse = await loginResponsePromise
    expect(loginResponse.ok()).toBeTruthy()

    // And: el frontend persiste sesion activa
    await expect.poll(async () => {
      const stored = await page.evaluate(() => window.localStorage.getItem('travel-hub-auth'))
      return stored !== null
    }).toBeTruthy()

    const authSessionRaw = await page.evaluate(() => window.localStorage.getItem('travel-hub-auth'))
    const authSession = JSON.parse(authSessionRaw ?? '{}') as { user?: { email?: string } }
    expect(authSession.user?.email).toBe(userEmail)

    // And: el usuario es redirigido al home
    await expect(page).toHaveURL('/', { timeout: 10_000 })
  })
})
