import { expect, request, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('Accesibilidad - Páginas públicas (sin autenticación)', () => {
  test('A001 - Home: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('A002 - Login: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('A003 - Signup: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('A004 - Resultados de búsqueda: sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await page.goto(
      '/search?destination=Bogota&checkIn=2026-05-01&checkOut=2026-05-05&adults=2&children=0&rooms=1',
      { waitUntil: 'domcontentloaded' },
    )

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('A005 - Página 404 (Not Found): sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/ruta-que-no-existe', { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
