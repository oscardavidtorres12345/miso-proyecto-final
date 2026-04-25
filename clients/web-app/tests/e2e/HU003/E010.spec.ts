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

const MOCK_UPCOMING = {
  user_id: '1',
  reservations: [
    {
      id: 'res-e010-1',
      imageUrl: 'https://picsum.photos/seed/hotel1/640/400',
      accommodationName: 'Aonang Villa Resort',
      location: 'Cartagena de Indias',
      arrival: '2026-06-15',
      departure: '2026-06-22',
      guestCount: 2,
      showCancel: true,
    },
  ],
  status: 'ok',
  sprint: 3,
  hu_id: 'HU003',
}

const MOCK_PAST = {
  user_id: '1',
  reservations: [
    {
      id: 'past-e010-1',
      imageUrl: 'https://picsum.photos/seed/past1/640/400',
      accommodationName: 'Cabaña Verde',
      location: 'Bogotá, Colombia',
      arrival: '2025-11-01',
      departure: '2025-11-08',
      guestCount: 2,
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
  test('E010 - Filtrado de reservas por estado (confirmadas, canceladas, completadas)', async ({ page }) => {
    // Given: usuario autenticado con reservas en ambos estados
    await authenticatePage(page)

    await page.route('**/bookings/users/*/confirmed-upcoming', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_UPCOMING),
      })
    })

    await page.route('**/bookings/users/*/confirmed-past', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PAST),
      })
    })

    // When: navega a reservas activas (estado: confirmadas)
    await page.goto('/reservations', { waitUntil: 'domcontentloaded' })

    // Then: se muestran solo las reservas confirmadas (futuras)
    await expect(page.locator('.bookings-page__title')).toContainText('Mis reservas')
    await expect(page.locator('.reservation-card')).toHaveCount(1)
    await expect(page.locator('.reservation-card__name')).toContainText('Aonang Villa Resort')

    // And: las reservas confirmadas muestran opción de cancelar (desktop + mobile → usar first())
    await expect(page.locator('.reservation-card__cancel').first()).toBeVisible()

    // When: cambia al filtro de viajes pasados (estado: completadas)
    await page.locator('.bookings-page__switch').click()
    await page.waitForURL('**/past-trips')

    // Then: se muestran solo los viajes completados (pasados)
    await expect(page.locator('.bookings-page__title')).toContainText('Mis viajes anteriores')
    await expect(page.locator('.past-trip-card')).toHaveCount(1)
    await expect(page.locator('.past-trip-card__name')).toContainText('Cabaña Verde')

    // And: los viajes completados NO muestran botón de cancelar en el DOM
    await expect(page.locator('.reservation-card__cancel').first()).not.toBeAttached()

    // When: vuelve al filtro de reservas activas
    await page.locator('.bookings-page__switch').click()
    await page.waitForURL('**/reservations')

    // Then: regresa correctamente al listado de reservas confirmadas
    await expect(page.locator('.bookings-page__title')).toContainText('Mis reservas')
    await expect(page.locator('.reservation-card')).toHaveCount(1)
  })
})
