import { expect, request, test, type Page } from '@playwright/test'

async function authenticatePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: {
          user_id: 999,
          username: 'e2e-payment-user',
          email: 'payment@e2e.com',
          role: 'GUEST',
        },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    )
  })
}

async function fillStripeCard(page: Page): Promise<void> {
  const stripeFrame = page.frameLocator('iframe[title*="Secure card"]').first()
  await stripeFrame.locator('[name="cardnumber"]').fill('4242424242424242')
  await stripeFrame.locator('[name="exp-date"]').fill('1229')
  await stripeFrame.locator('[name="cvc"]').fill('123')
  const postalField = stripeFrame.locator('[name="postal"]')
  if (await postalField.isVisible().catch(() => false)) {
    await postalField.fill('12345')
  }
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) {
    test.skip()
  }
})

test.describe('HU008 - Integración con proveedor de pagos (web)', () => {
  test('E028a - Manejo de timeout al crear payment intent', async ({ page }) => {
    const bookingId = 'e2e-booking-028a'

    // Mock: POST /payments/intent con delay largo y luego abort (simula timeout backend)
    await page.route((url) => url.pathname.includes('/api/v1/payments/intent'), async (route) => {
      // Simular delay de 5 segundos y luego abortar
      await page.waitForTimeout(5000)
      await route.abort('timedout')
    })

    await authenticatePage(page)
    await page.goto(
      `/checkout/payment?bookingId=${bookingId}&amount=5000000&currency=COP`,
    )

    await expect(page.getByRole('heading', { name: /pago seguro/i })).toBeVisible({ timeout: 10000 })

    // Esperar a que Stripe Elements cargue
    await page.waitForTimeout(3000)

    // Llenar tarjeta válida
    await fillStripeCard(page)
    await page.waitForTimeout(1000)

    // Click en confirmar pago
    const confirmButton = page.getByRole('button', { name: /confirmar.*pago|pagar/i })
    await expect(confirmButton).toBeEnabled({ timeout: 5000 })
    await confirmButton.click()

    // Verificar mensaje de error de timeout/network (después de ~5s)
    await expect(
      page.getByText(/error|timeout|failed|conexión/i),
    ).toBeVisible({ timeout: 8000 })

    // Verificar que NO redirige
    await expect(page).toHaveURL(/\/checkout\/payment/)
  })

  test('E028b - Manejo de timeout en verificación de pago (polling)', async ({ page }) => {
    const bookingId = 'e2e-booking-028b'
    const paymentId = 'e2e-payment-028b'

    // Mock: POST /payments/intent exitoso
    await page.route((url) => url.pathname.includes('/api/v1/payments/intent'), async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          payment_id: paymentId,
          client_secret: 'pi_test_secret_028b',
          publishable_key: 'pk_test_mock',
          amount: 5000000,
          currency: 'COP',
          status: 'PROCESSING',
        }),
      })
    })

    // Mock: GET /payments/{id}/status - Simula que siempre está PROCESSING (webhook nunca llega)
    // Después de 3 intentos (~6 segundos), retornar FAILED para simular timeout
    let pollCount = 0
    await page.route((url) => url.pathname.includes('/api/v1/payments/') && url.pathname.endsWith('/status'), async (route) => {
      pollCount++

      if (pollCount >= 3) {
        // Después de 3 polls, simular que el sistema detectó timeout
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            payment_id: paymentId,
            booking_id: bookingId,
            status: 'FAILED',
            amount: 5000000,
            currency: 'COP',
            failure_code: 'timeout',
            failure_message: 'Payment verification timeout',
            created_at: new Date().toISOString(),
          }),
        })
      } else {
        // Primeros polls: PROCESSING
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            payment_id: paymentId,
            booking_id: bookingId,
            status: 'PROCESSING',
            amount: 5000000,
            currency: 'COP',
            created_at: new Date().toISOString(),
          }),
        })
      }
    })

    await authenticatePage(page)
    await page.goto(
      `/checkout/payment?bookingId=${bookingId}&amount=5000000&currency=COP`,
    )

    await expect(page.getByRole('heading', { name: /pago seguro/i })).toBeVisible({ timeout: 10000 })

    // Esperar a que Stripe Elements cargue
    await page.waitForTimeout(3000)

    // Llenar tarjeta válida (Stripe Test Mode procesará el pago exitosamente)
    await fillStripeCard(page)
    await page.waitForTimeout(1000)

    const confirmButton = page.getByRole('button', { name: /confirmar.*pago|pagar/i })
    await expect(confirmButton).toBeEnabled({ timeout: 5000 })
    await confirmButton.click()

    // Stripe procesa rápido, esperar a que el polling comience
    await page.waitForTimeout(1000)

    // Esperar a que se hagan los 3 polls (~6 segundos: 2s + 2s + 2s)
    // El tercer poll retornará FAILED con timeout
    await page.waitForTimeout(7000)

    // Verificar mensaje de error de timeout/failed
    // (puede mostrar "FAILED", "timeout", o mensaje de error genérico)
    await expect(
      page.getByText(/timeout|failed|error|falló|fallo/i),
    ).toBeVisible({ timeout: 5000 })

    // Verificar que NO redirige (sigue en checkout/payment)
    await expect(page).toHaveURL(/\/checkout\/payment/)
  })
})
