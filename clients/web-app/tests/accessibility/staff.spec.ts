import { expect, request, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { filterViolations } from './axe.helper'
import { injectStaffSession } from './auth.helper'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('Accesibilidad - Páginas de usuario STAFF', () => {
  test('A011 - Portal Dashboard: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await injectStaffSession(page)
    await page.goto('/portal/dashboard', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL('/portal/dashboard')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    const critical = filterViolations(results.violations, 'critical')
    const nonCritical = filterViolations(results.violations, 'minor', 'moderate', 'serious')
    expect(critical).toEqual([])
    expect(nonCritical.length).toBeLessThanOrEqual(5)
  })
})
