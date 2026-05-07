import { type Page, expect, request, test } from '@playwright/test'

async function authenticateStaff(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: {
          user_id: 1,
          username: 'staff.e2e',
          email: 'staff.argentina@travelhub.com',
          role: 'STAFF',
          is_active: true,
        },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        token: 'e2e-staff-token',
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

test.describe('HU021 - Visualizacion integrada de feedback de clientes (portal)', () => {
  test('E076 - Respuesta del hotel a comentarios de huespedes', async ({ page }) => {
    const portalFeedbackUrl = '**/bookings/admin/feedback*'
    const replyUrl = '**/bookings/admin/feedback/7601/reply*'

    await page.route(portalFeedbackUrl, async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [
            {
              id: 7601,
              booking_id: 'bk-7601',
              property_id: 501,
              room_id: 1001,
              hotel_name: 'Hotel Nevado Real',
              room_name: 'Suite Junior',
              guest_name: 'Ana Perez',
              rating: 4,
              comment: 'Buen servicio, pero el check-in fue lento.',
              review_date: '2026-04-10T13:00:00Z',
            },
          ],
          status: 'ok',
        }),
      })
    })

    await page.route(replyUrl, async route => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }

      const body = route.request().postDataJSON() as { message?: string }
      expect(body.message).toBe('Gracias por tu comentario, mejoraremos el proceso de check-in.')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review_id: 7601,
          reply_id: 1,
          status: 'ok',
          reply_message: body.message,
          replied_by_user_id: 1,
        }),
      })
    })

    // Given: staff autenticado con una resena pendiente de respuesta
    await authenticateStaff(page)
    await page.goto('/portal/feedback', { waitUntil: 'domcontentloaded' })

    // When: responde el comentario desde el portal
    await page.getByRole('button', { name: /responder/i }).click()
    await page.getByLabel(/respuesta del hotel/i).fill('Gracias por tu comentario, mejoraremos el proceso de check-in.')

    const replyResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/bookings/admin/feedback/7601/reply') &&
        response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /enviar respuesta/i }).click()

    // Then: la API registra respuesta y la UI la refleja
    const replyResponse = await replyResponsePromise
    expect(replyResponse.ok()).toBeTruthy()
    await expect(page.getByText('Respuesta enviada')).toBeVisible()
    await expect(page.getByText('Gracias por tu comentario, mejoraremos el proceso de check-in.')).toBeVisible()
  })
})
