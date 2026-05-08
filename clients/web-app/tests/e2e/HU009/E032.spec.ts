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
  test('E032 - Procesamiento automatico de reembolso y aparicion en viajes pasados', async ({ page }) => {
    const upcomingUrl = '**/bookings/users/*/confirmed-upcoming'
    const previewUrl = '**/bookings/e2e-reserva-032/cancel-preview'
    const cancelUrl = '**/bookings/e2e-reserva-032/user-cancel'
    const pastUrl = '**/bookings/users/*/confirmed-past'

    await page.route(upcomingUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          reservations: [
            {
              id: 'e2e-reserva-032',
              imageUrl: 'https://picsum.photos/seed/hotel3/640/400',
              accommodationName: 'Hotel Santa Marta Playa',
              location: 'Santa Marta, Colombia',
              arrival: '2026-07-01',
              departure: '2026-07-05',
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
          refund_amount: 1800000,
          refund_currency: 'COP',
          conditions: 'Reembolso completo antes del check-in',
          days_until_checkin: 20,
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
          booking_id: 'e2e-reserva-032',
          refund: {
            status: 'processed',
            amount: 1800000,
            currency: 'COP',
            reference: 'ref-e2e-032',
          },
        }),
      })
    })

    await page.route(pastUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          reservations: [
            {
              id: 'e2e-reserva-032',
              imageUrl: 'https://picsum.photos/seed/hotel3/640/400',
              accommodationName: 'Hotel Santa Marta Playa',
              location: 'Santa Marta, Colombia',
              arrival: '2026-07-01',
              departure: '2026-07-05',
              guestCount: 2,
              status: 'CANCELLED',
            },
          ],
          status: 'ok',
          sprint: 4,
          hu_id: 'HU009',
        }),
      })
    })

    await authenticatePage(page)
    await page.goto('/reservations', { waitUntil: 'domcontentloaded' })

    const cards = page.locator('.reservation-card')
    await expect(cards).toHaveCount(1)
    const card = cards.first()

    await card.locator('.reservation-card__cancel').first().click()

    const cancelResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/bookings/e2e-reserva-032/user-cancel') &&
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
        amount: 1800000,
        currency: 'COP',
      }),
    )

    await expect(cards).toHaveCount(0)
    await expect(page.locator('.snackbar--visible')).toContainText('Su reserva ha sido cancelada')

    await page.getByRole('link', { name: 'Viajes anteriores' }).click()
    await page.waitForURL('**/past-trips')

    const pastCards = page.locator('.past-trip-card')
    await expect(pastCards).toHaveCount(1)
    const pastCard = pastCards.first()
    await expect(pastCard.locator('.past-trip-card__name')).toContainText('Hotel Santa Marta Playa')

    await expect(pastCard.locator('.past-trip-card__status--cancelled')).toBeVisible()
    await expect(pastCard.locator('.past-trip-card__status--cancelled')).toContainText('Cancelada')
  })
})
