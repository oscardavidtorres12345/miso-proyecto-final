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

const MOCK_PAST_RESERVATIONS = {
  user_id: '1',
  reservations: [
    {
      id: 'past-e009-1',
      imageUrl: 'https://picsum.photos/seed/past1/640/400',
      accommodationName: 'Cabaña Verde',
      location: 'Bogotá, Colombia',
      arrival: '2025-11-01',
      departure: '2025-11-08',
      guestCount: 2,
      showCancel: false,
    },
    {
      id: 'past-e009-2',
      imageUrl: 'https://picsum.photos/seed/past2/640/400',
      accommodationName: 'Hotel El Poblado',
      location: 'Medellín, Colombia',
      arrival: '2025-09-05',
      departure: '2025-09-10',
      guestCount: 1,
      showCancel: false,
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
  test('E009 - Consulta de historial de reservas pasadas con detalles y estados finales', async ({ page }) => {
    // Given: usuario autenticado con historial de viajes pasados
    await authenticatePage(page)

    await page.route('**/bookings/users/*/confirmed-past', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PAST_RESERVATIONS),
      })
    })

    // When: navega a la página de viajes anteriores
    await page.goto('/past-trips', { waitUntil: 'domcontentloaded' })

    // Then: el título de la página indica viajes pasados
    await expect(page.locator('.bookings-page__title')).toContainText('Mis viajes anteriores')

    // And: se muestran las tarjetas de viajes pasados
    const cards = page.locator('.past-trip-card')
    await expect(cards).toHaveCount(2)

    // And: la primera tarjeta muestra el nombre del alojamiento
    const firstCard = cards.first()
    await expect(firstCard.locator('.past-trip-card__name')).toContainText('Cabaña Verde')

    // And: los detalles del viaje (ubicación, fechas, huéspedes) son visibles — hay 3 líneas de meta
    await expect(firstCard.locator('.past-trip-card__meta').first()).toBeVisible()
    expect(await firstCard.locator('.past-trip-card__meta').count()).toBeGreaterThanOrEqual(3)

    // And: las tarjetas de viajes pasados NO muestran botón de cancelar (estado final)
    await expect(firstCard.locator('.reservation-card__cancel').first()).not.toBeAttached()

    // And: el enlace para volver a reservas activas está disponible
    await expect(page.locator('.bookings-page__switch')).toContainText('Reservas')
  })
})
