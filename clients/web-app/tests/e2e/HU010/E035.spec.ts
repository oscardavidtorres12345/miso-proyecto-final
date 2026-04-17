import { expect, request as playwrightRequest, test } from '@playwright/test'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU010 - Autenticacion de usuarios (portal)', () => {
  test('E035 - Login fallido de hotel con credenciales invalidas', async ({ page }) => {
    // Given: el usuario accede a la pantalla de login
    await page.goto('/login', { waitUntil: 'domcontentloaded' })

    // When: ingresa credenciales invalidas de staff
    await page.locator('#email').fill('staff.argentina@travelhub.com')
    await page.locator('#password').fill('WrongPassword123!')

    const loginResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/identity/auth/web/login') &&
        response.request().method() === 'POST',
    )

    await page.locator('.login-card__submit').click()

    // Then: el backend rechaza las credenciales (401)
    const loginResponse = await loginResponsePromise
    expect(loginResponse.status()).toBe(401)

    // And: no se persiste sesion en localStorage
    const authSession = await page.evaluate(() => window.localStorage.getItem('travel-hub-auth'))
    expect(authSession).toBeNull()

    // And: el usuario permanece en la pantalla de login
    await expect(page).toHaveURL('/login', { timeout: 5_000 })
  })
})
