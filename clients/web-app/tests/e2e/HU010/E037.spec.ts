import { expect, request as playwrightRequest, test } from '@playwright/test'

const STORAGE_KEY = 'travel-hub-auth'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU010 - Autenticacion de usuarios (portal)', () => {
  test('E037 - Cierre automatico de sesion por expiracion', async ({ page }) => {
    // Given: existe una sesion STAFF activa que expira en 2 segundos
    const sessionExpiresAt = new Date(Date.now() + 2_000).toISOString()
    const fakeSession = {
      user: {
        user_id: 1,
        username: 'staff.argentina',
        email: 'staff.argentina@travelhub.com',
        role: 'STAFF',
        is_active: true,
      },
      permissions: [],
      sessionExpiresAt,
    }

    await page.goto('/portal/dashboard', { waitUntil: 'domcontentloaded' })
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, JSON.stringify(fakeSession)],
    )

    // When: el usuario recarga la pagina con la sesion activa
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL('/portal/dashboard', { timeout: 5_000 })

    // Then: tras expirar la sesion, localStorage queda limpio
    await expect.poll(
      async () => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
      { timeout: 10_000, intervals: [500] },
    ).toBeNull()

    // And: se muestra el snackbar de sesion expirada
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('alert')).toContainText('sesión')
  })
})
