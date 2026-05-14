import { expect, request, test } from '@playwright/test'
import {
  authenticateGuest,
  buildHotelDetailResponse,
  buildSearchResponse,
  mockSearchProperties,
} from './helpers'

test.beforeAll(async ({ baseURL }) => {
  const ctx = await request.newContext()
  const res = await ctx.get(baseURL ?? '/', { timeout: 10_000 }).catch(() => null)
  await ctx.dispose()
  if (!res || !res.ok()) test.skip()
})

test.describe('HU020 - Conversión automática multi-moneda (web)', () => {
  test('E069 - Detección automática de ubicación del usuario y conversión a moneda local', async ({ page, context }) => {
    await authenticateGuest(page)
    await mockSearchProperties(context, 'COP')

    // Parte 1: Usuario de primera visita sin país guardado → default Colombia/COP
    await page.goto('/search?destination=Cancun&checkIn=2026-08-01&checkOut=2026-08-03&adults=2&rooms=1', {
      waitUntil: 'domcontentloaded',
    })

    // Verificar que la bandera por defecto es Colombia
    await expect(page.locator('.header__flag-img')).toHaveAttribute('alt', 'Colombia')

    // Verificar precios en COP
    const firstCardCurrency = page.locator('.accommodation-card__price-currency').first()
    await expect(firstCardCurrency).toContainText('COP')

    // Parte 2: Simular usuario detectado como Argentina (localStorage = 'ar')
    await page.evaluate(() => {
      window.localStorage.setItem('travel-hub-country', 'ar')
    })

    // Mockear detalle del hotel con ARS
    await context.route('**/hotels/1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildHotelDetailResponse('ARS')),
      })
    })

    // Navegar a detalle de hospedaje (se lee localStorage 'ar' en el mount)
    await page.goto('/accommodation/1?checkIn=2026-08-01&checkOut=2026-08-03&adults=2&rooms=1', {
      waitUntil: 'domcontentloaded',
    })

    // Verificar que la bandera es Argentina
    await expect(page.locator('.header__flag-img')).toHaveAttribute('alt', 'Argentina')

    const widgetCurrency = page.locator('.accommodation-detail__widget-price-currency')
    await expect(widgetCurrency).toContainText('ARS')

    const roomCurrency = page.locator('.accommodation-detail__room-price-currency').first()
    await expect(roomCurrency).toContainText('ARS')
  })
})
