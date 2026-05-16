import { expect, test } from '@playwright/test'
import { authenticateStaff, mockMonthlyReport } from './helpers'

test('E042 - Visualización de gráficos de tendencias de ingresos', async ({ page, context }) => {
  await mockMonthlyReport(context)
  await authenticateStaff(page)
  await page.goto('/portal/reports', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('Tendencia de ingresos')).toBeVisible()
  await expect(page.locator('.portal-reports svg').first()).toBeVisible()
})
