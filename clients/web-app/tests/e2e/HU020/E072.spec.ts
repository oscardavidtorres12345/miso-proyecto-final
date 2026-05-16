import { expect, request, test } from '@playwright/test'
import {
  authenticateGuest,
  buildSearchResponse,
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
  test('E072 - Mantenimiento de moneda seleccionada durante todo el proceso de reserva', async ({ page, context }) => {
    const batchId = 'e2e-batch-072'
    const holdId = 'e2e-hold-072'

    await authenticateGuest(page)
    await mockHotelDetail(context, 'COP')

    // Mockear búsqueda con COP
    await context.route('**/search/properties**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildSearchResponse('COP')),
      })
    })

    await mockBookingHold(context, holdId)
    await mockBookingBatch(context, batchId)
    await mockGetBookingBatch(context, batchId, [holdId])

    // Simular que el backend persiste la preferencia de USD tras selección
    let persistedCurrency = 'COP'

    await context.route('**/bookings/**/payment-summary**', async (route) => {
      const url = new URL(route.request().url())
      const reqCurrency = url.searchParams.get('display_currency') || 'COP'

      // Una vez que el usuario selecciona USD, el backend la recuerda
      if (reqCurrency === 'USD') persistedCurrency = 'USD'

      const total = persistedCurrency === 'USD' ? 130 : 500_000
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          payment_summary: {
            total,
            currency: persistedCurrency,
            accommodation: total * 0.8,
            fees: total * 0.1,
            taxes: total * 0.06,
            insurance: total * 0.04,
            discount: 0,
          },
          user: { first_name: 'E2E', last_name: 'Guest', email: 'guest@travelhub.com' },
        }),
      })
    })

    // 1. Resultados de búsqueda muestran COP
    await page.goto('/search?destination=Cancun&checkIn=2026-08-01&checkOut=2026-08-03&adults=2&rooms=1', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.locator('.accommodation-card__price-currency').first()).toContainText('COP')

    // 2. Detalle del hospedaje muestra COP
    await page.goto('/accommodation/1?checkIn=2026-08-01&checkOut=2026-08-03&adults=2&rooms=1', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.locator('.accommodation-detail__widget-price-currency')).toContainText('COP')

    // 3. Agregar habitación al carrito (no navega directo a checkout)
    await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).first().click()

    // Esperar toast de éxito y luego ir al carrito
    await expect(page.locator('.snackbar--visible')).toContainText('Habitación añadida al carrito')
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })

    // Carrito muestra COP
    await expect(page.locator('.cart-summary__total-code')).toContainText('COP')

    // 4. Ir al checkout desde el carrito
    await page.getByRole('button', { name: 'Pagar', exact: true }).click()
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10_000 })

    // Checkout inicial muestra COP
    await expect(page.locator('.checkout-page__currency-trigger-text')).toContainText('COP')
    await expect(page.locator('.cart-summary__total-code')).toContainText('COP')

    // 5. Cambiar moneda a USD en checkout
    await page.locator('#checkout-currency').click()
    await page.locator('.checkout-page__currency-dropdown-option', { hasText: 'USD' }).click()
    await expect(page.locator('.checkout-page__currency-trigger-text')).toContainText('USD')
    await expect(page.locator('.cart-summary__total-code')).toContainText('USD')

    // 6. Continuar a pago: verificar que la URL y el total mantienen USD
    await page.getByRole('button', { name: 'Pagar', exact: true }).click()
    await expect(page).toHaveURL(/\/checkout\/payment/)
    await expect(page).toHaveURL(/currency=USD/)
    await expect(page.getByText(/\$130\.00/).first()).toBeVisible()

    // 7. Regresar al checkout: verificar que se mantiene USD
    await page.goBack()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.locator('.checkout-page__currency-trigger-text')).toContainText('USD')
    await expect(page.locator('.cart-summary__total-code')).toContainText('USD')
  })
})
