import { expect, test } from '@playwright/test'
import { authenticateStaff, mockMonthlyReport } from './helpers'

test('E044 - Descarga de reporte en múltiples formatos (PDF, Excel, CSV)', async ({ page, context }) => {
  await mockMonthlyReport(context)
  await authenticateStaff(page)
  await page.goto('/portal/reports', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('button', { name: 'Exportar PDF' })).toBeEnabled()
  await page.evaluate(() => {
    ;(window as any).__downloads = []
    const original = URL.createObjectURL
    URL.createObjectURL = (blob: Blob | MediaSource) => {
      if (blob instanceof Blob) (window as any).__downloads.push(blob.type)
      return original(blob)
    }
  })

  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  await page.getByRole('button', { name: 'Exportar Excel' }).click()
  await page.getByRole('button', { name: 'Exportar CSV' }).click()

  await expect
    .poll(async () => {
      return page.evaluate(() => ((window as any).__downloads as string[]).length)
    })
    .toBeGreaterThanOrEqual(3)

  const types = await page.evaluate(() => (window as any).__downloads as string[])
  expect(types.some((t) => t.includes('application/pdf'))).toBeTruthy()
  expect(types.some((t) => t.includes('sheet'))).toBeTruthy()
  expect(types.some((t) => t.includes('text/csv'))).toBeTruthy()
})
