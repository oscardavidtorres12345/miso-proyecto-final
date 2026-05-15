import { expect, request, test } from '@playwright/test'
import {
  authenticateGuest,
  mockBookingBatch,
  mockBookingHold,
  mockGetBookingBatch,
  mockHotelDetail,
} from './helpers'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU020 - Conversión automática multi-moneda (web)', () => {
  test('E070 - Selección manual de moneda preferida con conversión en tiempo real', async ({ page, context }) => {
    const batchId = 'e2e-batch-070'
    const holdId = 'e2e-hold-070'

    await authenticateGuest(page)
    await mockHotelDetail(context, 'COP')
    await mockBookingHold(context, holdId)
    await mockBookingBatch(context, batchId)
    await mockGetBookingBatch(context, batchId, [holdId])

    // Mock payment-summary dinámico según moneda solicitada
    await context.route('**/bookings/**/payment-summary**', async (route) => {
      const url = new URL(route.request().url())
      const currency = url.searchParams.get('display_currency') || 'COP'

      const responses: Record<string, object> = {
        COP: {
          payment_summary: {
            total: 500_000,
            currency: 'COP',
            accommodation: 400_000,
            fees: 50_000,
            taxes: 30_000,
            insurance: 20_000,
            discount: 0,
          },
          user: { first_name: 'E2E', last_name: 'Guest', email: 'guest@travelhub.com' },
        },
        USD: {
          payment_summary: {
            total: 130,
            currency: 'USD',
            accommodation: 104,
            fees: 13,
            taxes: 7.8,
            insurance: 5.2,
            discount: 0,
          },
          user: { first_name: 'E2E', last_name: 'Guest', email: 'guest@travelhub.com' },
        },
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responses[currency] || responses['COP']),
      })
    })

    // Ir a detalle de hospedaje y seleccionar habitación para checkout
    await page.goto('/accommodation/1?checkIn=2026-08-01&checkOut=2026-08-03&adults=2&rooms=1', {
      waitUntil: 'domcontentloaded',
    })

    await page.getByRole('button', { name: 'Seleccionar', exact: true }).first().click()

    // Esperar navegación a checkout
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10_000 })

    // Verificar moneda inicial COP
    await expect(page.locator('.checkout-page__currency-trigger-text')).toContainText('COP')
    await expect(page.locator('.cart-summary__total-code')).toContainText('COP')

    // Verificar montos iniciales en COP (formato colombiano: 500.000)
    const totalAmountCOP = page.locator('.cart-summary__total-amount')
    await expect(totalAmountCOP).toContainText('500.000')

    // Abrir selector de moneda
    await page.locator('#checkout-currency').click()
    await expect(page.locator('.checkout-page__currency-dropdown-panel')).toBeVisible()

    // Seleccionar USD
    await page.locator('.checkout-page__currency-dropdown-option', { hasText: 'USD' }).click()

    // Verificar que la moneda cambió a USD
    await expect(page.locator('.checkout-page__currency-trigger-text')).toContainText('USD')
    await expect(page.locator('.cart-summary__total-code')).toContainText('USD')

    // Verificar montos convertidos a USD
    const totalAmountUSD = page.locator('.cart-summary__total-amount')
    await expect(totalAmountUSD).toContainText('130')

    // Verificar que los valores de breakdown también se actualizaron (alojamiento base)
    const lines = page.locator('.cart-summary__value')
    await expect(lines.first()).toContainText('104')
  })
})
