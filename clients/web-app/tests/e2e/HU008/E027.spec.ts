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

async function fillStripeCard(page: Page, cardNumber: string): Promise<void> {
  const stripeFrame = page.frameLocator('iframe[title*="Secure card"]').first()
  await stripeFrame.locator('[name="cardnumber"]').fill(cardNumber)
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
  test('E027 - Rechazo de transacción con tarjeta declinada', async ({ page }) => {
    const bookingId = 'e2e-booking-027a'
    const paymentId = 'e2e-payment-027a'

    // Mock: POST /payments/intent
    await page.route((url) => url.pathname.includes('/api/v1/payments/intent'), async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          payment_id: paymentId,
          client_secret: 'pi_test_secret_027a',
          publishable_key: 'pk_test_mock',
          amount: 5000000,
          currency: 'COP',
          status: 'PROCESSING',
        }),
      })
    })

    // Autenticar y navegar
    await authenticatePage(page)
    await page.goto(
      `/checkout/payment?bookingId=${bookingId}&amount=5000000&currency=COP`,
    )

    // Esperar a que cargue
    await expect(page.getByRole('heading', { name: /pago seguro/i })).toBeVisible({ timeout: 10000 })

    // Esperar a que Stripe Elements cargue
    await page.waitForTimeout(3000)

    // Llenar tarjeta de PRUEBA que será DECLINADA (Stripe test mode)
    await fillStripeCard(page, '4000000000000002')

    await page.waitForTimeout(1000)

    // Click en confirmar pago (botón enabled porque Stripe Elements está ready)
    const confirmButton = page.getByRole('button', { name: /confirmar.*pago|pagar/i })
    await expect(confirmButton).toBeEnabled({ timeout: 5000 })
    await confirmButton.click()

    // Verificar mensaje de error (Stripe real retorna error de tarjeta declinada)
    await expect(
      page.getByText(/declined|rechazada|declinada|error/i),
    ).toBeVisible({ timeout: 8000 })

    // Verificar que NO redirige (sigue en payment)
    await expect(page).toHaveURL(/\/checkout\/payment/, { timeout: 2000 })
  })

  test('E027 - Rechazo de transacción por fondos insuficientes', async ({ page }) => {
    const bookingId = 'e2e-booking-027b'
    const paymentId = 'e2e-payment-027b'

    // Mock: POST /payments/intent
    await page.route((url) => url.pathname.includes('/api/v1/payments/intent'), async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          payment_id: paymentId,
          client_secret: 'pi_test_secret_027b',
          publishable_key: 'pk_test_mock',
          amount: 5000000,
          currency: 'COP',
          status: 'PROCESSING',
        }),
      })
    })

    // Autenticar y navegar
    await authenticatePage(page)
    await page.goto(
      `/checkout/payment?bookingId=${bookingId}&amount=5000000&currency=COP`,
    )

    // Esperar a que cargue
    await expect(page.getByRole('heading', { name: /pago seguro/i })).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(3000)

    // Llenar tarjeta de PRUEBA - fondos insuficientes (Stripe test card)
    await fillStripeCard(page, '4000000000009995')
    await page.waitForTimeout(1000)

    // Click en confirmar pago
    const confirmButton = page.getByRole('button', { name: /confirmar.*pago|pagar/i })
    await expect(confirmButton).toBeEnabled({ timeout: 5000 })
    await confirmButton.click()

    // Verificar mensaje de error
    await expect(
      page.getByText(/insufficient.*funds|fondos.*insuficientes|sin.*fondos|error/i),
    ).toBeVisible({ timeout: 8000 })

    // Verificar que NO redirige
    await expect(page).toHaveURL(/\/checkout\/payment/)
  })
})
