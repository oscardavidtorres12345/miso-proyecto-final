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

const MOCK_UPCOMING_RESERVATIONS = {
  user_id: '1',
  reservations: [
    {
      id: 'res-e008-1',
      imageUrl: 'https://picsum.photos/seed/hotel1/640/400',
      accommodationName: 'Aonang Villa Resort',
      location: 'Cartagena de Indias',
      arrival: '2026-06-15',
      departure: '2026-06-22',
      guestCount: 2,
      showCancel: true,
    },
    {
      id: 'res-e008-2',
      imageUrl: 'https://picsum.photos/seed/hotel2/640/400',
      accommodationName: 'Hotel Medellín Plaza',
      location: 'Medellín, Colombia',
      arrival: '2026-07-10',
      departure: '2026-07-15',
      guestCount: 3,
      showCancel: true,
    },
  ],
  status: 'ok',
  sprint: 3,
  hu_id: 'HU003',
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU003 - Consulta de reservas de usuario (web)', () => {
  test('E008 - Visualización correcta de listado de reservas futuras con información completa', async ({ page }) => {
    // Given: usuario autenticado con reservas futuras confirmadas
    await authenticatePage(page)

    await page.route('**/bookings/users/*/confirmed-upcoming', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_UPCOMING_RESERVATIONS),
      })
    })

    // When: navega a la página de reservas
    await page.goto('/reservations', { waitUntil: 'domcontentloaded' })

    // Then: el título de la página es correcto
    await expect(page.locator('.bookings-page__title')).toContainText('Mis reservas')

    // And: se muestran todas las tarjetas de reserva
    const cards = page.locator('.reservation-card')
    await expect(cards).toHaveCount(2)

    // And: la primera tarjeta contiene la información completa del alojamiento
    const firstCard = cards.first()
    await expect(firstCard.locator('.reservation-card__name')).toContainText('Aonang Villa Resort')
    await expect(firstCard.locator('.reservation-card__location')).toContainText('Cartagena de Indias')

    // And: la sección de fechas muestra llegada y salida
    await expect(firstCard.locator('.reservation-card__date-col--arrival')).toBeVisible()
    await expect(firstCard.locator('.reservation-card__date-col--departure')).toBeVisible()

    // And: la sección de huéspedes es visible
    await expect(firstCard.locator('.reservation-card__section--guests')).toBeVisible()

    // And: el botón de cancelar reserva está disponible (showCancel: true)
    // La tarjeta tiene dos instancias del botón (desktop e inline-mobile); basta que alguna sea visible
    await expect(firstCard.locator('.reservation-card__cancel').first()).toBeVisible()

    // And: el enlace para ver viajes pasados está disponible
    await expect(page.locator('.bookings-page__switch')).toContainText('Viajes anteriores')
  })
})
