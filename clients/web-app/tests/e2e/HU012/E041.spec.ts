import { expect, test } from '@playwright/test'
import { authenticateStaff, mockMonthlyReport } from './helpers'

test('E041 - Generación correcta de reporte mensual con totales y desglose por día', async ({ page, context }) => {
  const { hits } = await mockMonthlyReport(context)
  await authenticateStaff(page)
  await page.goto('/portal/reports', { waitUntil: 'domcontentloaded' })

  await expect.poll(() => hits.count).toBeGreaterThan(0)
  await expect(page.getByText('No se pudo cargar el reporte. Intenta de nuevo.')).toHaveCount(0)
  await expect(page.getByText('120', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/\$\s?12\.500\.000/)).toBeVisible()
  await expect(page.getByText('Reservas del periodo por día')).toBeVisible()
})
