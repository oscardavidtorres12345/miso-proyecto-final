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

async function replaceNumericInput(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector)
  await expect(input).toBeVisible()
  await input.click()
  await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await input.type(value)
  await expect(input).toHaveValue(value)
}

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU013 - Gestion de tarifas (portal)', () => {
  test('E046 - Modificacion de tarifas existentes con aplicacion inmediata o programada', async ({ page }) => {
    const ratesListUrl = /\/inventory\/rates(?:\/)?(?:\?.*)?$/
    const ratesDetailUrl = /\/inventory\/rates\/\d+(?:\?.*)?$/
    const rates = [
      {
        room_id: 9101,
        property_id: 201,
        property_name: 'Hotel Costanera',
        room_type: 'Suite Premium',
        base_rate: 420000,
        offer_rate: 390000,
        offer_active: true,
        effective_rate: 390000,
        currency: 'COP',
        occupied_units: 4,
        available_rooms: 8,
        total_units: 12,
        offer_status: 'Activa',
        updated_at: new Date().toISOString(),
      },
      {
        room_id: 9102,
        property_id: 201,
        property_name: 'Hotel Costanera',
        room_type: 'Habitación Familiar',
        base_rate: 360000,
        offer_rate: 330000,
        offer_active: true,
        effective_rate: 330000,
        currency: 'COP',
        occupied_units: 2,
        available_rooms: 10,
        total_units: 12,
        offer_status: 'Activa',
        updated_at: new Date().toISOString(),
      },
    ]

    const updatePayloads: Array<Record<string, unknown>> = []

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

      const payload = route.request().postDataJSON() as Record<string, unknown>
      updatePayloads.push(payload)

      const url = route.request().url()
      const roomId = Number(url.split('/').pop())
      const target = rates.find(r => r.room_id === roomId)

      if (!target) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Rate not found' }),
        })
        return
      }

      target.room_type = String(payload.room_type ?? target.room_type)
      target.base_rate = Number(payload.base_rate ?? target.base_rate)
      target.offer_rate = Number(payload.offer_rate ?? target.offer_rate)
      target.offer_active = Boolean(payload.offer_active)
      target.total_units = Number(payload.total_units ?? target.total_units)
      target.occupied_units = Number(payload.occupied_units ?? target.occupied_units)
      target.available_rooms = target.total_units - target.occupied_units
      target.effective_rate = target.offer_active ? target.offer_rate : target.base_rate
      target.offer_status = target.offer_active ? 'Activa' : 'Inactiva'
      target.updated_at = new Date().toISOString()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target),
      })
    })

    // Given: usuario staff autenticado en gestion de tarifas con registros existentes
    await authenticateStaff(page)
    await page.goto('/portal/rates', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Gestión de tarifas' })).toBeVisible()
    await expect(page.locator('.portal-rates__table tbody tr')).toHaveCount(2)

    // When: edita la primera tarifa para aplicacion inmediata (oferta activa)
    await page.getByRole('button', { name: 'Editar tarifa' }).first().click()
    await expect(page.getByRole('heading', { name: 'Editar tarifa' })).toBeVisible()

    await replaceNumericInput(page, '#add-base-rate', '450000')
    await replaceNumericInput(page, '#add-offer-rate', '405000')
    await replaceNumericInput(page, 'input[aria-label="Habitaciones disponibles"]', '7')
    await replaceNumericInput(page, 'input[aria-label="Total de habitaciones"]', '12')

    const immediateUpdatePromise = page.waitForResponse(
      response =>
        response.url().includes('/inventory/rates/9101') &&
        response.request().method() === 'PUT',
    )

    const immediateSaveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(immediateSaveButton).toBeEnabled()
    await immediateSaveButton.click()

    // Then: primera actualizacion exitosa con aplicacion inmediata
    const immediateUpdateResponse = await immediateUpdatePromise
    expect(immediateUpdateResponse.ok()).toBeTruthy()
    expect(updatePayloads[0]).toMatchObject({
      property_id: 201,
      room_type: 'Suite Premium',
      base_rate: 450000,
      offer_rate: 405000,
      total_units: 12,
      occupied_units: 5,
      offer_active: true,
      currency: 'COP',
      horizon_days: 30,
    })

    await expect(page.locator('.snackbar--success').last()).toContainText('Tarifa actualizada exitosamente')
    await expect(page.locator('.portal-rates__table tbody tr').first()).toContainText('Activa')
    await expect(page.locator('.portal-rates__table tbody tr').first()).toContainText('7/12')

    // When: edita la segunda tarifa para aplicacion programada (oferta inactiva)
    await page.getByRole('button', { name: 'Editar tarifa' }).nth(1).click()
    await expect(page.getByRole('heading', { name: 'Editar tarifa' })).toBeVisible()

    await replaceNumericInput(page, '#add-base-rate', '380000')
    await replaceNumericInput(page, '#add-offer-rate', '340000')
    await replaceNumericInput(page, 'input[aria-label="Habitaciones disponibles"]', '9')
    await replaceNumericInput(page, 'input[aria-label="Total de habitaciones"]', '12')
    const offerStatusToggle = page.locator('#add-offer-status')
    if (await offerStatusToggle.isChecked()) {
      await page.locator('.rate-form__toggle').click()
    }
    await expect(offerStatusToggle).not.toBeChecked()

    const scheduledUpdatePromise = page.waitForResponse(
      response =>
        response.url().includes('/inventory/rates/9102') &&
        response.request().method() === 'PUT',
    )

    const scheduledSaveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(scheduledSaveButton).toBeEnabled()
    await scheduledSaveButton.click()

    // Then: segunda actualizacion exitosa con aplicacion programada/deferida
    const scheduledUpdateResponse = await scheduledUpdatePromise
    expect(scheduledUpdateResponse.ok()).toBeTruthy()
    expect(updatePayloads[1]).toMatchObject({
      property_id: 201,
      room_type: 'Habitación Familiar',
      base_rate: 380000,
      offer_rate: 340000,
      total_units: 12,
      occupied_units: 3,
      offer_active: false,
      currency: 'COP',
      horizon_days: 30,
    })

    await expect(page.locator('.snackbar--success').last()).toContainText('Tarifa actualizada exitosamente')
    await expect(page.locator('.portal-rates__table tbody tr').nth(1)).toContainText('Inactiva')
    await expect(page.locator('.portal-rates__table tbody tr').nth(1)).toContainText('9/12')
  })
})
