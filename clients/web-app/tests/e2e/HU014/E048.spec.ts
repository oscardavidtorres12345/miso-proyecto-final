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
  test('E048 - Visualizacion completa de detalles de reserva pendiente de confirmacion', async ({ page }) => {
    const portalReservationsUrl = '**/bookings/portal/reservations*'

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
              booking_id: 'e2e-booking-048',
              hold_id: 'e2e-hold-048',
              property_id: 901,
              property_name: 'Hotel Nevado Real',
              room_id: 9201,
              user_id: 'guest.e2e',
              check_in: '2026-06-10',
              check_out: '2026-06-14',
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

    // Given: usuario staff autenticado con una reserva pendiente de confirmacion
    await authenticateStaff(page)

    // When: navega al portal de reservas
    await page.goto('/portal/reservations', { waitUntil: 'domcontentloaded' })

    // Then: visualiza el detalle completo disponible en tarjeta de la reserva pendiente
    await expect(page.getByRole('heading', { name: 'Reservas' })).toBeVisible()
    await expect(page.locator('.portal-reservations__item')).toHaveCount(1)

    const card = page.locator('.portal-reservation-card').first()
    await expect(card).toContainText('Llegada')
    await expect(card).toContainText(/10\s+de\s+jun\.?/i)
    await expect(card).toContainText('Salida')
    await expect(card).toContainText(/14\s+de\s+jun\.?/i)
    await expect(card).toContainText('Habitación')
    await expect(card).toContainText('Suite Junior')
    await expect(card).toContainText('Huespedes')
    await expect(card).toContainText('2')

    // And: al estar pendiente, la reserva permite confirmar o cancelar
    await expect(card.getByRole('button', { name: 'Confirmar' })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  })
})
