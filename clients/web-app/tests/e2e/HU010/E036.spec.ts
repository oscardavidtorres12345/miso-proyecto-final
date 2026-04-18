import { expect, request as playwrightRequest, test } from '@playwright/test'

const STORAGE_KEY = 'travel-hub-auth'
const SESSION_EXPIRES_AT = new Date(Date.now() + 3_600_000).toISOString()

const buildSession = (role: 'STAFF' | 'GUEST') => ({
  user: {
    user_id: role === 'STAFF' ? 1 : 2,
    username: role === 'STAFF' ? 'staff.argentina' : 'guest.user',
    email: role === 'STAFF' ? 'staff.argentina@travelhub.com' : 'guest@example.com',
    role,
    is_active: true,
  },
  permissions: [],
  sessionExpiresAt: SESSION_EXPIRES_AT,
})

test.beforeAll(async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU010 - Autenticacion de usuarios (portal)', () => {
  test('E036 - Validar permisos según rol del usuario (usuario STAFF accede al dashboard del portal)', async ({ page }) => {
    // Given: existe una sesion activa con rol STAFF
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, JSON.stringify(buildSession('STAFF'))],
    )

    // When: navega al dashboard del portal
    await page.goto('/portal/dashboard', { waitUntil: 'domcontentloaded' })

    // Then: accede correctamente al dashboard
    await expect(page).toHaveURL('/portal/dashboard')
    await expect(page.getByRole('main')).not.toContainText('403')
    await expect(page.getByRole('main')).not.toContainText('Acceso denegado')
  })

  test('E036 - Validar permisos según rol del usuario (usuario GUEST no puede acceder al dashboard del portal)', async ({ page }) => {
    // Given: existe una sesion activa con rol GUEST
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, JSON.stringify(buildSession('GUEST'))],
    )

    // When: intenta navegar al dashboard del portal
    await page.goto('/portal/dashboard', { waitUntil: 'domcontentloaded' })

    // Then: se muestra la pagina de acceso denegado (403)
    await expect(page.getByRole('main')).toContainText('403')
    await expect(page.getByRole('main')).toContainText('Acceso denegado')

    // And: se ofrece volver al inicio (no al portal)
    await expect(page.getByRole('button', { name: 'Volver al inicio' })).toBeVisible()
  })
})
