import { expect, request as playwrightRequest, test } from '@playwright/test'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU010 - Autenticacion de usuarios (portal)', () => {
  test('E034 - Login exitoso de hotel con credenciales validas y acceso al dashboard', async ({ page }) => {
    // Given: existe un usuario staff registrado en identity-service
    const staffEmail = 'staff.argentina@travelhub.com'
    const staffPassword = 'Staff2026!'

    // When: el usuario accede al login y envia credenciales validas de staff
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.locator('#email').fill(staffEmail)
    await page.locator('#password').fill(staffPassword)

    const loginResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/identity/auth/web/login') &&
        response.request().method() === 'POST',
    )

    await page.locator('.login-card__submit').click()

    // Then: el backend responde exitosamente al login del portal
    const loginResponse = await loginResponsePromise
    expect(loginResponse.ok()).toBeTruthy()

    // And: el frontend persiste sesion activa con rol STAFF
    await expect.poll(async () => {
      const stored = await page.evaluate(() => window.localStorage.getItem('travel-hub-auth'))
      return stored !== null
    }).toBeTruthy()

    const authSessionRaw = await page.evaluate(() => window.localStorage.getItem('travel-hub-auth'))
    const authSession = JSON.parse(authSessionRaw ?? '{}') as { user?: { email?: string; role?: string } }
    expect(authSession.user?.email).toBe(staffEmail)
    expect(authSession.user?.role).toBe('STAFF')

    // And: el usuario es redirigido al dashboard del portal
    await expect(page).toHaveURL('/portal/dashboard', { timeout: 10_000 })
  })
})
