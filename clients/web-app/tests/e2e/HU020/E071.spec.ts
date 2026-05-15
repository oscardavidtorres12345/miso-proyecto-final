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
  test('E071 - Actualización de tipos de cambio con frecuencia apropiada', async ({ page, context }) => {
    const batchId = 'e2e-batch-071'
    const holdId = 'e2e-hold-071'

    await authenticateGuest(page)
    await mockHotelDetail(context, 'COP')
    await mockBookingHold(context, holdId)
    await mockBookingBatch(context, batchId)
    await mockGetBookingBatch(context, batchId, [holdId])

    let paymentSummaryCalls = 0

    // Mock payment-summary que registra cada llamada
    await context.route('**/bookings/**/payment-summary**', async (route) => {
      paymentSummaryCalls += 1
      const url = new URL(route.request().url())
      const currency = url.searchParams.get('display_currency') || 'COP'

      const rates: Record<string, object> = {
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
        ARS: {
          payment_summary: {
            total: 55_000,
            currency: 'ARS',
            accommodation: 44_000,
            fees: 5_500,
            taxes: 3_300,
            insurance: 2_200,
            discount: 0,
          },
          user: { first_name: 'E2E', last_name: 'Guest', email: 'guest@travelhub.com' },
        },
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rates[currency] || rates['COP']),
      })
    })

    // Ir a detalle y seleccionar habitación para generar checkout
    await page.goto('/accommodation/1?checkIn=2026-08-01&checkOut=2026-08-03&adults=2&rooms=1', {
      waitUntil: 'domcontentloaded',
    })

    await page.getByRole('button', { name: 'Seleccionar', exact: true }).first().click()
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10_000 })

    // Esperar carga inicial del checkout (llama payment-summary)
    await expect(page.locator('.checkout-page__currency-trigger-text')).toContainText('COP')
    expect(paymentSummaryCalls).toBeGreaterThanOrEqual(1)
    const callsAfterLoad = paymentSummaryCalls

    // Cambiar a USD
    await page.locator('#checkout-currency').click()
    await page.locator('.checkout-page__currency-dropdown-option', { hasText: 'USD' }).click()
    await expect(page.locator('.checkout-page__currency-trigger-text')).toContainText('USD')
    await expect(page.locator('.cart-summary__total-code')).toContainText('USD')

    // Verificar que se realizó una nueva llamada para obtener rates actualizados
    expect(paymentSummaryCalls).toBeGreaterThan(callsAfterLoad)
    const callsAfterUSD = paymentSummaryCalls

    // Cambiar a ARS
    await page.locator('#checkout-currency').click()
    await page.locator('.checkout-page__currency-dropdown-option', { hasText: 'ARS' }).click()
    await expect(page.locator('.checkout-page__currency-trigger-text')).toContainText('ARS')
    await expect(page.locator('.cart-summary__total-code')).toContainText('ARS')

    // Verificar otra llamada adicional para rates de ARS
    expect(paymentSummaryCalls).toBeGreaterThan(callsAfterUSD)
  })
})
