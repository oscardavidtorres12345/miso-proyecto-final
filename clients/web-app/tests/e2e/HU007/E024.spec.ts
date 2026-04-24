import { test, expect } from '@playwright/test'

import { resolveHu007Env, triggerBatchConfirm, waitForBookingMail } from './mailTestUtils'

test.describe('HU007 - Confirmación de reserva por mail (web)', () => {
  test('E024 - Verificación de contenido completo del email', async ({ request }) => {
    const envVars = resolveHu007Env()
    test.skip(!envVars, 'Missing E2E_BOOKING_API_URL, E2E_MAIL_API_URL, E2E_HU007_BATCH_BOOKING_ID or E2E_HU007_RECIPIENT_EMAIL')

    const confirm = await triggerBatchConfirm(request, envVars!)
    expect(confirm.status).toBe('CONFIRMED')

    const received = await waitForBookingMail(request, envVars!, envVars!.batchBookingId)
    const body = `${received.text}\n${received.html}`

    expect(body).toContain(envVars!.batchBookingId)
    expect(body.toLowerCase()).toContain('detalle por reserva')
    expect(body.toLowerCase()).toContain('resumen de pago')
    expect(body.toLowerCase()).toContain('total')
    expect(body).toMatch(/\d{2}\s(?:Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\s\d{4}/)
  })
})

