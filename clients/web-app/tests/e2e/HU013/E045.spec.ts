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
  test('E045 - Creacion exitosa de nueva tarifa con precio base y condiciones', async ({ page }) => {
    const ratesListUrl = /\/inventory\/rates(?:\/)?(?:\?.*)?$/
    const rates = [
      {
        room_id: 9001,
        property_id: 101,
        property_name: 'Hotel Andes Plaza',
        room_type: 'Suite Junior',
        base_rate: 320000,
        offer_rate: 289000,
        offer_active: true,
        effective_rate: 289000,
        currency: 'COP',
        occupied_units: 3,
        available_rooms: 7,
        total_units: 10,
        offer_status: 'Activa',
        updated_at: new Date().toISOString(),
      },
    ]

    let createPayload: Record<string, unknown> | null = null

    await page.route(ratesListUrl, async route => {
      const method = route.request().method()

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ rates }),
        })
        return
      }

      if (method !== 'POST') {
        await route.continue()
        return
      }

      createPayload = route.request().postDataJSON() as Record<string, unknown>

      const createdRate = {
        room_id: 9002,
        property_id: Number(createPayload.property_id ?? 101),
        property_name: 'Hotel Andes Plaza',
        room_type: String(createPayload.room_type ?? 'Suite Ejecutiva'),
        base_rate: Number(createPayload.base_rate ?? 350000),
        offer_rate: Number(createPayload.offer_rate ?? 315000),
        offer_active: Boolean(createPayload.offer_active),
        effective_rate: Number(createPayload.offer_active)
          ? Number(createPayload.offer_rate ?? 315000)
          : Number(createPayload.base_rate ?? 350000),
        currency: String(createPayload.currency ?? 'COP'),
        occupied_units: Number(createPayload.occupied_units ?? 3),
        available_rooms:
          Number(createPayload.total_units ?? 12) - Number(createPayload.occupied_units ?? 3),
        total_units: Number(createPayload.total_units ?? 12),
        offer_status: Boolean(createPayload.offer_active) ? 'Activa' : 'Inactiva',
        updated_at: new Date().toISOString(),
      }

      rates.push(createdRate)

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createdRate),
      })
    })

    // Given: usuario staff autenticado y gestion de tarifas disponible
    await authenticateStaff(page)
    await page.goto('/portal/rates', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Gestión de tarifas' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Añadir nueva tarifa/ })).toBeVisible()

    // When: crea una nueva tarifa con precio base, oferta y condiciones de disponibilidad
    await page.getByRole('button', { name: /Añadir nueva tarifa/ }).click()
    await expect(page.getByRole('heading', { name: 'Añadir una nueva tarifa' })).toBeVisible()

    await page.locator('#add-property').selectOption('101')
    await page.locator('#add-room-type').fill('Suite Ejecutiva')
    await page.locator('#add-base-rate').fill('350000')
    await page.locator('#add-offer-rate').fill('315000')
    await page.getByLabel('Habitaciones disponibles').fill('9')
    await page.getByLabel('Total de habitaciones').fill('12')

    const createResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/inventory/rates') &&
        response.request().method() === 'POST',
    )

    await page.getByRole('button', { name: 'Guardar' }).click()

    // Then: el backend registra la tarifa exitosamente
    const createResponse = await createResponsePromise
    expect(createResponse.ok()).toBeTruthy()

    // And: el payload enviado cumple condiciones esperadas
    expect(createPayload).not.toBeNull()
    expect(createPayload).toMatchObject({
      property_id: 101,
      room_type: 'Suite Ejecutiva',
      base_rate: 350000,
      offer_rate: 315000,
      total_units: 12,
      occupied_units: 3,
      offer_active: true,
      currency: 'COP',
      horizon_days: 30,
    })

    // And: la UI confirma guardado y muestra la nueva tarifa en tabla
    await expect(page.getByRole('alert')).toContainText('Tarifa creada exitosamente')
    await expect(page.locator('.portal-rates__table tbody tr')).toHaveCount(2)
    await expect(page.locator('.portal-rates__table tbody tr').last()).toContainText('Suite Ejecutiva')
    await expect(page.locator('.portal-rates__table tbody tr').last()).toContainText('9/12')
    await expect(page.locator('.portal-rates__table tbody tr').last()).toContainText('Activa')
  })
})
