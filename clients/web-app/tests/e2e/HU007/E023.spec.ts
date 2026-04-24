import { test, expect } from '@playwright/test'

import { resolveHu007Env, triggerBatchConfirm, waitForBookingMail } from './mailTestUtils'

test.describe('HU007 - Confirmación de reserva por mail (web)', () => {
  test('E023 - Envío exitoso de email de confirmación inmediatamente después de completar pago', async ({ request }) => {
    test.setTimeout(60_000)
    const envVars = resolveHu007Env('E2E_HU007_BATCH_BOOKING_ID_E023')
    test.skip(!envVars, 'Missing E2E_BOOKING_API_URL, E2E_MAIL_API_URL, E2E_HU007_BATCH_BOOKING_ID or E2E_HU007_RECIPIENT_EMAIL')

    const confirm = await triggerBatchConfirm(request, envVars!)
    expect(confirm.status).toBe('CONFIRMED')
    expect(confirm.booking_id).toBe(envVars!.batchBookingId)

    const emailStatus = String(confirm.email_notification?.status ?? '')
    expect(emailStatus).toBe('sent')

    const received = await waitForBookingMail(request, envVars!, envVars!.batchBookingId)
    expect(received.subject.toLowerCase()).toContain('confirmación')
  })
})
