import { expect, request, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { injectGuestSession } from './auth.helper'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('Accesibilidad - Páginas de usuario GUEST', () => {
  test('A006 - Carrito: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await injectGuestSession(page)
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('A007 - Checkout: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await injectGuestSession(page)
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('A008 - Mis reservas: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await injectGuestSession(page)
    await page.goto('/reservations', { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('A009 - Viajes pasados: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await injectGuestSession(page)
    await page.goto('/past-trips', { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('A010 - Detalle de hospedaje: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    // Navigate to search first to get a valid accommodation ID
    await injectGuestSession(page)
    await page.goto(
      '/search?destination=Bogota&checkIn=2026-05-01&checkOut=2026-05-05&adults=2&children=0&rooms=1',
      { waitUntil: 'domcontentloaded' },
    )

    const firstCard = page.locator('.accommodation-card').first()
    const cardVisible = await firstCard.isVisible().catch(() => false)
    if (!cardVisible) test.skip()

    await firstCard.locator('.accommodation-card__btn').click()
    await page.waitForURL(/\/accommodation\/\w+/, { timeout: 10_000 })
    await page
      .locator('.accommodation-detail__loading')
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => {})

    if (await page.locator('.accommodation-detail__error-state').isVisible()) test.skip()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
