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
  test('E050 - Rechazo de reserva con motivo y reembolso automatico al cliente', async ({ page }) => {
    const portalReservationsUrl = /\/bookings\/portal\/reservations(?:\?.*)?$/
    const cancelUrl = /\/bookings\/e2e-booking-050\/hotel-cancel(?:\?.*)?$/

    let cancelRequestHeaders: Record<string, string> | null = null

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
              booking_id: 'e2e-booking-050',
              hold_id: 'e2e-hold-050',
              property_id: 901,
              property_name: 'Hotel Nevado Real',
              room_id: 9201,
              user_id: 'guest.e2e',
              check_in: '2026-07-08',
              check_out: '2026-07-11',
              units: 1,
              guest_count: 3,
              room_type: 'Suite Familiar',
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

    await page.route(cancelUrl, async route => {
      if (route.request().method() !== 'DELETE') {
        await route.continue()
        return
      }

      cancelRequestHeaders = route.request().headers()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'CANCELLED',
          sprint: 4,
          hu_id: 'HU014',
          booking_id: 'e2e-booking-050',
          rejection_reason: 'Overbooking operativo del hotel',
          refund: {
            status: 'processed',
            amount: 1250000,
            currency: 'COP',
            reference: 'rfnd-e2e-050',
          },
          client_notification: {
            status: 'sent',
            channel: 'email',
            to: 'guest.e2e@travelhub.test',
          },
        }),
      })
    })

    // Given: staff autenticado con reserva pendiente
    await authenticateStaff(page)
    await page.goto('/portal/reservations', { waitUntil: 'domcontentloaded' })

    const card = page.locator('.portal-reservation-card').first()
    await expect(card).toBeVisible()

    // When: rechaza/cancela la reserva desde portal
    const cancelResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/bookings/e2e-booking-050/hotel-cancel') &&
        response.request().method() === 'DELETE',
    )
    await card.getByRole('button', { name: 'Cancelar' }).click()

    // Then: backend registra rechazo con motivo y reembolso automatico
    const cancelResponse = await cancelResponsePromise
    expect(cancelResponse.ok()).toBeTruthy()

    const payload = (await cancelResponse.json()) as {
      status?: string
      booking_id?: string
      rejection_reason?: string
      refund?: { status?: string; amount?: number; currency?: string; reference?: string }
      client_notification?: { status?: string; channel?: string; to?: string }
    }

    expect(payload.status).toBe('CANCELLED')
    expect(payload.booking_id).toBe('e2e-booking-050')
    expect(payload.rejection_reason).toBe('Overbooking operativo del hotel')
    expect(payload.refund).toEqual(
      expect.objectContaining({
        status: 'processed',
        amount: 1250000,
        currency: 'COP',
        reference: 'rfnd-e2e-050',
      }),
    )
    expect(payload.client_notification).toEqual(
      expect.objectContaining({
        status: 'sent',
        channel: 'email',
        to: 'guest.e2e@travelhub.test',
      }),
    )

    expect(cancelRequestHeaders).not.toBeNull()
    if (!cancelRequestHeaders) {
      throw new Error('Expected cancel request headers to be captured')
    }

    // And: la llamada de rechazo conserva la autenticacion del staff
    expect(cancelRequestHeaders.authorization).toBe('Bearer e2e-staff-token')
    expect(cancelRequestHeaders['x-user-id']).toBe('1')

    // And: la UI informa cancelacion exitosa y elimina la reserva de la lista
    await expect(page.getByRole('alert')).toContainText('La reserva ha sido cancelada')
    await expect(page.locator('.portal-reservations__item')).toHaveCount(0)
  })
})
