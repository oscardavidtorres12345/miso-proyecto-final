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
  test('E033 - Rechazo de cancelacion fuera del periodo permitido segun politicas', async ({ page }) => {
    const upcomingUrl = '**/bookings/users/*/confirmed-upcoming'
    const previewUrl = '**/bookings/e2e-reserva-033/cancel-preview'

    await page.route(upcomingUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: '1',
          reservations: [
            {
              id: 'e2e-reserva-033',
              imageUrl: 'https://picsum.photos/seed/hotel4/640/400',
              accommodationName: 'Hotel Medellin Plaza',
              location: 'Medellin, Colombia',
              arrival: '2026-01-01',
              departure: '2026-01-05',
              guestCount: 1,
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
          can_cancel: false,
          policy_type: 'none',
          refund_amount: null,
          refund_currency: null,
          conditions: 'La reserva ya no puede ser cancelada porque la fecha de inicio ya paso.',
          days_until_checkin: -1,
        }),
      })
    })

    await authenticatePage(page)
    await page.goto('/reservations', { waitUntil: 'domcontentloaded' })

    const cards = page.locator('.reservation-card')
    await expect(cards).toHaveCount(1)
    const card = cards.first()

    await card.locator('.reservation-card__cancel').first().click()

    const confirmButton = page.getByRole('button', { name: 'Estoy seguro' })
    await expect(confirmButton).toBeDisabled()

    await expect(page.locator('.modal__message')).toContainText('No se puede cancelar esta reserva.')

    await expect(cards).toHaveCount(1)
  })
})
