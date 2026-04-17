import { type Page, expect, request, test } from '@playwright/test'

function mmssToSeconds(value: string): number {
  const match = value.trim().match(/^(\d{2}):(\d{2})$/)
  if (!match) return Number.NaN
  const mm = Number(match[1])
  const ss = Number(match[2])
  return mm * 60 + ss
}

async function authenticatePageWithActiveHold(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const userId = 1

    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: { user_id: userId, username: 'e2e-playwright', email: 'e2e@test.com', role: 'GUEST', is_active: true },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    )

    // Hold activo: ~90 segundos para validar que el contador se muestra y disminuye.
    window.localStorage.setItem(
      'travelhub_hold_countdown_v1',
      JSON.stringify({ v: 1, userId, endMs: Date.now() + 90_000 }),
    )
  })
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU005 - Carrito provisional con hold temporal (web)', () => {
  test('E017 - Visualización de contador regresivo durante el período de hold activo', async ({ page }) => {
    // Given: usuario autenticado con hold activo persistido
    await authenticatePageWithActiveHold(page)

    // When: navega al carrito
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // Then: el contador regresivo está visible
    const timer = page.getByRole('timer')
    await expect(timer).toBeVisible()

    // And: el formato mostrado es mm:ss
    const initialLabel = (await timer.textContent())?.trim() ?? ''
    expect(initialLabel).toMatch(/^\d{2}:\d{2}$/)

    // And: el contador disminuye con el paso de los segundos
    await page.waitForTimeout(1_500)
    const nextLabel = (await timer.textContent())?.trim() ?? ''
    expect(nextLabel).toMatch(/^\d{2}:\d{2}$/)
    expect(mmssToSeconds(nextLabel)).toBeLessThan(mmssToSeconds(initialLabel))
  })
})
