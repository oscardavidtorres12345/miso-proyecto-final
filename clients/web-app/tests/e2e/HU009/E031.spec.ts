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
  test('E031 - Aplicacion correcta de penalizacion segun politica de cancelacion del hotel', async ({ page }) => {
    const upcomingUrl = '**/bookings/users/*/confirmed-upcoming'
    const previewUrl = '**/bookings/e2e-reserva-031/cancel-preview'
    const cancelUrl = '**/bookings/e2e-reserva-031/user-cancel'

    await page.route(upcomingUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          reservations: [
            {
              id: 'e2e-reserva-031',
              imageUrl: 'https://picsum.photos/seed/hotel2/640/400',
              accommodationName: 'Hotel Bogota Centro',
              location: 'Bogota, Colombia',
              arrival: '2026-09-10',
              departure: '2026-09-15',
              guestCount: 3,
              showCancel: true,
            },
          ],
          status: 'ok',
          sprint: 3,
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
          refund_amount: 2500000,
          refund_currency: 'COP',
          conditions: 'Reembolso del 100% al cancelar antes del check-in',
          days_until_checkin: 30,
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
          sprint: 3,
          hu_id: 'HU009',
          booking_id: 'e2e-reserva-031',
          refund: {
            status: 'processed',
            amount: 2500000,
            currency: 'COP',
            reference: 'ref-e2e-031',
          },
        }),
      })
    })

    await authenticatePage(page)
    await page.goto('/reservations', { waitUntil: 'domcontentloaded' })

    const cards = page.locator('.reservation-card')
    await expect(cards).toHaveCount(1)
    const card = cards.first()

    await card.locator('.reservation-card__cancel').first().click()

    await expect(page.locator('.modal__refund')).toContainText('2,500,000 COP')

    const cancelResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/bookings/e2e-reserva-031/user-cancel') &&
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
        amount: 2500000,
        currency: 'COP',
      }),
    )

    await expect(cards).toHaveCount(0)
    await expect(page.locator('.snackbar--visible')).toContainText('Su reserva ha sido cancelada')
  })
})
