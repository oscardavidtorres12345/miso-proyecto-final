import { expect, test } from '@playwright/test'
import { authenticateStaff, mockMonthlyReport } from './helpers'

test('E043 - Comparación de ingresos entre diferentes períodos (mes actual vs anterior)', async ({ page, context }) => {
  await mockMonthlyReport(context)
  await authenticateStaff(page)
  await page.goto('/portal/reports', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText(/\$\s?12\.500\.000/)).toBeVisible()
  await page.locator('.portal-reports__month-filter select').selectOption('04')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText(/\$\s?10\.000\.000/)).toBeVisible()
})
