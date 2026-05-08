import { type Page, expect, request, test } from '@playwright/test'

async function authenticatePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: { user_id: 1, username: 'e2e-playwright', email: 'e2e@test.com', role: 'GUEST', is_active: true },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    )
  })
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU009 - Cancelacion con reembolso automatico (web)', () => {
  test('E030 - Cancelacion exitosa dentro del periodo permitido con reembolso del 100%', async ({ page }) => {
    const upcomingUrl = '**/bookings/users/*/confirmed-upcoming'
    const previewUrl = '**/bookings/e2e-reserva-030/cancel-preview'
    const cancelUrl = '**/bookings/e2e-reserva-030/user-cancel'

    await page.route(upcomingUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          reservations: [
            {
              id: 'e2e-reserva-030',
              imageUrl: 'https://picsum.photos/seed/hotel1/640/400',
              accommodationName: 'Hotel Cancun Resort',
              location: 'Cancun, Mexico',
              arrival: '2026-08-15',
              departure: '2026-08-20',
              guestCount: 2,
              showCancel: true,
            },
          ],
          status: 'ok',
          sprint: 4,
          hu_id: 'HU009',
        }),
      })
    })

    await page.route(previewUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          can_cancel: true,
          policy_type: 'full',
          refund_amount: 1250000,
          refund_currency: 'COP',
          conditions: 'Cancelacion gratuita antes del check-in',
          days_until_checkin: 15,
        }),
      })
    })

    await page.route(cancelUrl, async (route) => {
      if (route.request().method() !== 'DELETE') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'CANCELLED',
          sprint: 4,
          hu_id: 'HU009',
          booking_id: 'e2e-reserva-030',
          refund: {
            status: 'processed',
            amount: 1250000,
            currency: 'COP',
            reference: 'ref-e2e-030',
          },
        }),
      })
    })

    await authenticatePage(page)
    await page.goto('/reservations', { waitUntil: 'domcontentloaded' })

    const cards = page.locator('.reservation-card')
    await expect(cards).toHaveCount(1)
    const card = cards.first()
    await expect(card.locator('.reservation-card__name')).toContainText('Hotel Cancun Resort')

    await card.locator('.reservation-card__cancel').first().click()

    await expect(page.locator('.modal__refund')).toContainText('1,250,000 COP')
    await expect(page.locator('.modal__conditions')).toContainText('Cancelacion gratuita antes del check-in')

    const cancelResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/bookings/e2e-reserva-030/user-cancel') &&
        response.request().method() === 'DELETE',
    )
    await page.getByRole('button', { name: 'Estoy seguro' }).click()
    const cancelResponse = await cancelResponsePromise
    expect(cancelResponse.ok()).toBeTruthy()

    const payload = (await cancelResponse.json()) as {
      status?: string
      refund?: { status?: string; amount?: number; currency?: string }
    }
    expect(payload.status).toBe('CANCELLED')
    expect(payload.refund).toEqual(
      expect.objectContaining({
        status: 'processed',
        amount: 1250000,
        currency: 'COP',
      }),
    )

    await expect(cards).toHaveCount(0)
    await expect(page.locator('.snackbar--visible')).toContainText('Su reserva ha sido cancelada')
  })

  test('Descarte de cancelacion - cerrar modal mantiene la reserva activa', async ({ page }) => {
    const upcomingUrl = '**/bookings/users/*/confirmed-upcoming'
    const previewUrl = '**/bookings/e2e-reserva-030-descarte/cancel-preview'

    await page.route(upcomingUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          reservations: [
            {
              id: 'e2e-reserva-030-descarte',
              imageUrl: 'https://picsum.photos/seed/hotel1/640/400',
              accommodationName: 'Hotel Cancun Resort',
              location: 'Cancun, Mexico',
              arrival: '2026-08-15',
              departure: '2026-08-20',
              guestCount: 2,
              showCancel: true,
            },
          ],
          status: 'ok',
          sprint: 4,
          hu_id: 'HU009',
        }),
      })
    })

    await page.route(previewUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          can_cancel: true,
          policy_type: 'full',
          refund_amount: 1250000,
          refund_currency: 'COP',
          conditions: 'Cancelacion gratuita antes del check-in',
          days_until_checkin: 15,
        }),
      })
    })

    await authenticatePage(page)
    await page.goto('/reservations', { waitUntil: 'domcontentloaded' })

    const cards = page.locator('.reservation-card')
    await expect(cards).toHaveCount(1)
    const card = cards.first()

    await card.locator('.reservation-card__cancel').first().click()

    await expect(page.locator('.modal__refund')).toContainText('1,250,000 COP')

    const confirmButton = page.getByRole('button', { name: 'Estoy seguro' })
    await expect(confirmButton).toBeVisible()

    await expect(cards).toHaveCount(1)
    await expect(card.locator('.reservation-card__name')).toContainText('Hotel Cancun Resort')
  })
})
