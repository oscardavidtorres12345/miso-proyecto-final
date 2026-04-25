import { test, expect } from '@playwright/test'

import { resolveHu007Env, triggerBatchConfirm, waitForBookingMail } from './mailTestUtils'

test.describe('HU007 - Confirmación de reserva por mail (web)', () => {
  test('E025 - Inclusión de código de confirmación único y enlaces útiles en el email', async ({ request }) => {
    test.setTimeout(60_000)
    const envVars = resolveHu007Env('E2E_HU007_BATCH_BOOKING_ID_E025')
    test.skip(!envVars, 'Missing E2E_BOOKING_API_URL, E2E_MAIL_API_URL, E2E_HU007_BATCH_BOOKING_ID or E2E_HU007_RECIPIENT_EMAIL')

    const confirm = await triggerBatchConfirm(request, envVars!)
    expect(confirm.status).toBe('CONFIRMED')

    const received = await waitForBookingMail(request, envVars!, envVars!.batchBookingId)
    const body = `${received.text}\n${received.html}`

    expect(body).toMatch(/TH-\d{4}-[A-Z0-9]{4}/)

    const links = [...received.html.matchAll(/href="([^"]+)"/g)].map(m => m[1])
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).not.toBe('#')
    }
  })
})
