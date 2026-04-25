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

test.describe('HU014 - Detalle de reserva con confirmacion o rechazo (portal)', () => {
  test('E049 - Confirmacion exitosa de reserva con notificacion automatica al cliente', async ({ page }) => {
    const portalReservationsUrl = '**/bookings/portal/reservations*'
    const confirmUrl = '**/bookings/e2e-booking-049/hotel-confirm*'

    let confirmRequestHeaders: Record<string, string> | null = null

    await page.route(portalReservationsUrl, async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          properties: [{ property_id: 901, property_name: 'Hotel Nevado Real' }],
          staff_user_id: 1,
          property_ids: [901],
          bookings: [
            {
              booking_id: 'e2e-booking-049',
              hold_id: 'e2e-hold-049',
              property_id: 901,
              property_name: 'Hotel Nevado Real',
              room_id: 9201,
              user_id: 'guest.e2e',
              check_in: '2026-07-01',
              check_out: '2026-07-05',
              units: 1,
              guest_count: 2,
              room_type: 'Suite Junior',
              hotel_confirmation_status: 'PENDING',
              hotel_confirmed_at: null,
              status: 'ON_HOLD',
            },
          ],
          status: 'ok',
          sprint: 4,
          hu_id: 'HU014',
        }),
      })
    })

    await page.route(confirmUrl, async route => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }

      confirmRequestHeaders = route.request().headers()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'CONFIRMED',
          sprint: 4,
          hu_id: 'HU014',
          booking_id: 'e2e-booking-049',
          email_notification: {
            status: 'sent',
            to: 'guest.e2e@travelhub.test',
            channel: 'email',
          },
        }),
      })
    })

    // Given: staff autenticado con reserva pendiente
    await authenticateStaff(page)
    await page.goto('/portal/reservations', { waitUntil: 'domcontentloaded' })

    const card = page.locator('.portal-reservation-card').first()
    await expect(card.getByRole('button', { name: 'Confirmar' })).toBeVisible()

    // When: confirma la reserva desde el portal
    const confirmResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/bookings/e2e-booking-049/hotel-confirm') &&
        response.request().method() === 'POST',
    )
    await card.getByRole('button', { name: 'Confirmar' }).click()

    // Then: el backend confirma la reserva y reporta notificacion automatica al cliente
    const confirmResponse = await confirmResponsePromise
    expect(confirmResponse.ok()).toBeTruthy()

    const payload = (await confirmResponse.json()) as {
      status?: string
      booking_id?: string
      email_notification?: { status?: string; to?: string; channel?: string }
    }

    expect(payload.status).toBe('CONFIRMED')
    expect(payload.booking_id).toBe('e2e-booking-049')
    expect(payload.email_notification).toEqual(
      expect.objectContaining({
        status: 'sent',
        to: 'guest.e2e@travelhub.test',
        channel: 'email',
      }),
    )

    expect(confirmRequestHeaders).not.toBeNull()
    if (!confirmRequestHeaders) {
      throw new Error('Expected confirm request headers to be captured')
    }

    // And: la llamada incluye autenticacion del staff
    expect(confirmRequestHeaders.authorization).toBe('Bearer e2e-staff-token')
    expect(confirmRequestHeaders['x-user-id']).toBe('1')

    // And: la UI informa confirmacion exitosa y oculta accion de confirmar
    await expect(page.getByRole('alert')).toContainText('La reserva ha sido confirmada')
    await expect(card.getByRole('button', { name: 'Confirmar' })).toHaveCount(0)
    await expect(card.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  })
})
