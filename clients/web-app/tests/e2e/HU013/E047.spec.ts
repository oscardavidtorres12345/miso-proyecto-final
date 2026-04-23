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

test.describe('HU013 - Gestion de tarifas (portal)', () => {
  test('E047 - Aplicacion de descuentos por temporada o promociones especiales', async ({ page }) => {
    const ratesListUrl = /\/inventory\/rates(?:\/)?(?:\?.*)?$/
    const ratesDetailUrl = /\/inventory\/rates\/\d+(?:\?.*)?$/
    const rates = [
      {
        room_id: 9201,
        property_id: 301,
        property_name: 'Hotel Nevado Real',
        room_type: 'Cabaña Superior',
        base_rate: 500000,
        offer_rate: 470000,
        offer_active: true,
        effective_rate: 470000,
        currency: 'COP',
        occupied_units: 2,
        available_rooms: 6,
        total_units: 8,
        offer_status: 'Activa',
        updated_at: new Date().toISOString(),
      },
    ]

    let updatePayload: Record<string, unknown> | null = null

    await page.route(ratesListUrl, async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates }),
      })
    })

    await page.route(ratesDetailUrl, async route => {
      if (route.request().method() !== 'PUT') {
        await route.continue()
        return
      }

      updatePayload = route.request().postDataJSON() as Record<string, unknown>

      rates[0] = {
        ...rates[0],
        base_rate: Number(updatePayload.base_rate ?? rates[0].base_rate),
        offer_rate: Number(updatePayload.offer_rate ?? rates[0].offer_rate),
        offer_active: Boolean(updatePayload.offer_active),
        total_units: Number(updatePayload.total_units ?? rates[0].total_units),
        occupied_units: Number(updatePayload.occupied_units ?? rates[0].occupied_units),
        available_rooms:
          Number(updatePayload.total_units ?? rates[0].total_units) -
          Number(updatePayload.occupied_units ?? rates[0].occupied_units),
        effective_rate: Boolean(updatePayload.offer_active)
          ? Number(updatePayload.offer_rate ?? rates[0].offer_rate)
          : Number(updatePayload.base_rate ?? rates[0].base_rate),
        offer_status: Boolean(updatePayload.offer_active) ? 'Activa' : 'Inactiva',
        updated_at: new Date().toISOString(),
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rates[0]),
      })
    })

    // Given: usuario staff autenticado con una tarifa existente
    await authenticateStaff(page)
    await page.goto('/portal/rates', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Gestión de tarifas' })).toBeVisible()
    await expect(page.locator('.portal-rates__table tbody tr')).toHaveCount(1)

    // When: aplica una promocion estacional (descuento) en la tarifa oferta
    await page.getByRole('button', { name: 'Editar tarifa' }).first().click()
    await expect(page.getByRole('heading', { name: 'Editar tarifa' })).toBeVisible()

    await page.locator('#add-base-rate').fill('520000')
    await page.locator('#add-offer-rate').fill('390000')
    await page.getByLabel('Habitaciones disponibles').fill('5')
    await page.getByLabel('Total de habitaciones').fill('8')
    await page.locator('#add-offer-status').check()

    const updateResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/inventory/rates/9201') &&
        response.request().method() === 'PUT',
    )

    await page.getByRole('button', { name: 'Guardar' }).click()

    // Then: el backend registra la promocion aplicada
    const updateResponse = await updateResponsePromise
    expect(updateResponse.ok()).toBeTruthy()

    expect(updatePayload).not.toBeNull()
    expect(updatePayload).toMatchObject({
      property_id: 301,
      room_type: 'Cabaña Superior',
      base_rate: 520000,
      offer_rate: 390000,
      offer_active: true,
      total_units: 8,
      occupied_units: 3,
      currency: 'COP',
      horizon_days: 30,
    })

    const discountAmount = Number(updatePayload?.base_rate) - Number(updatePayload?.offer_rate)
    const discountPercent = (discountAmount / Number(updatePayload?.base_rate)) * 100

    // And: el descuento es valido (oferta menor que base) y visible como oferta activa
    expect(discountAmount).toBeGreaterThan(0)
    expect(discountPercent).toBeCloseTo(25, 0)

    await expect(page.getByRole('alert')).toContainText('Tarifa actualizada')
    await expect(page.locator('.portal-rates__table tbody tr').first()).toContainText('Activa')
    await expect(page.locator('.portal-rates__table tbody tr').first()).toContainText('5/8')

    // And: la tarifa oferta mostrada en tabla corresponde al valor promocional
    await expect(page.locator('.portal-rates__table tbody tr').first()).toContainText('390.000')
  })
})
