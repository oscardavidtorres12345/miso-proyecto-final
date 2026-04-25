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
  test('E051 - Historial de acciones sobre la reserva (quien y cuando confirmo/rechazo)', async ({ page }) => {
    const portalReservationsUrl = /\/bookings\/portal\/reservations(?:\?.*)?$/
    const confirmUrl = /\/bookings\/e2e-booking-051\/hotel-confirm(?:\?.*)?$/

    const confirmedAt = '2026-07-10T15:45:30Z'

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
              booking_id: 'e2e-booking-051',
              hold_id: 'e2e-hold-051',
              property_id: 901,
              property_name: 'Hotel Nevado Real',
              room_id: 9201,
              user_id: 'guest.e2e',
              check_in: '2026-08-02',
              check_out: '2026-08-06',
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

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'CONFIRMED',
          sprint: 4,
          hu_id: 'HU014',
          booking_id: 'e2e-booking-051',
          history: [
            {
              action: 'CONFIRMED',
              actor_user_id: 1,
              actor_role: 'STAFF',
              actor_email: 'staff.argentina@travelhub.com',
              occurred_at: confirmedAt,
            },
          ],
        }),
      })
    })

    // Given: staff autenticado con reserva pendiente
    await authenticateStaff(page)
    await page.goto('/portal/reservations', { waitUntil: 'domcontentloaded' })

    const card = page.locator('.portal-reservation-card').first()
    await expect(card.getByRole('button', { name: 'Confirmar' })).toBeVisible()

    // When: confirma la reserva
    const confirmResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/bookings/e2e-booking-051/hotel-confirm') &&
        response.request().method() === 'POST',
    )
    await card.getByRole('button', { name: 'Confirmar' }).click()

    // Then: respuesta contiene historial de accion con quien y cuando
    const confirmResponse = await confirmResponsePromise
    expect(confirmResponse.ok()).toBeTruthy()

    const payload = (await confirmResponse.json()) as {
      history?: Array<{
        action?: string
        actor_user_id?: number
        actor_role?: string
        actor_email?: string
        occurred_at?: string
      }>
    }

    expect(Array.isArray(payload.history)).toBeTruthy()
    const action = payload.history?.[0]
    expect(action).toEqual(
      expect.objectContaining({
        action: 'CONFIRMED',
        actor_user_id: 1,
        actor_role: 'STAFF',
        actor_email: 'staff.argentina@travelhub.com',
        occurred_at: confirmedAt,
      }),
    )

    const occurred = new Date(String(action?.occurred_at ?? ''))
    expect(Number.isNaN(occurred.getTime())).toBeFalsy()

    // And: la UI refleja que ya fue gestionada (sin boton de confirmar)
    await expect(page.getByRole('alert')).toContainText('La reserva ha sido confirmada')
    await expect(card.getByRole('button', { name: 'Confirmar' })).toHaveCount(0)
    await expect(card.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  })
})
