import { type BrowserContext, type Page } from '@playwright/test'

export async function authenticateStaff(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: { user_id: 1, username: 'staff.e2e', email: 'staff@travelhub.com', role: 'STAFF', is_active: true },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        token: 'e2e-staff-token',
      }),
    )
  })
}

export function reportFor(month: string) {
  const isMay = month.endsWith('-05')
  return {
    staff_user_id: 1,
    property_ids: [501],
    month,
    kpis_month: {
      total_reservations: isMay ? 120 : 100,
      cancelled_reservations: isMay ? 10 : 8,
      new_guests: isMay ? 40 : 35,
      returning_guests: isMay ? 30 : 25,
      occupied_rooms: isMay ? 80 : 70,
      available_rooms: isMay ? 20 : 30,
      gross_income: isMay ? 12_500_000 : 10_000_000,
      net_income: isMay ? 11_100_000 : 8_900_000,
    },
    distribution_by_category: [
      { category: 'Suite', room_type: 'suite', value: isMay ? 70 : 55, percentage: isMay ? 58.3 : 55 },
      { category: 'Estandar', room_type: 'standard', value: isMay ? 50 : 45, percentage: isMay ? 41.7 : 45 },
    ],
    bars_by_period: [
      { period: `${month}-01`, value: isMay ? 350000 : 300000 },
      { period: `${month}-02`, value: isMay ? 420000 : 280000 },
      { period: `${month}-03`, value: isMay ? 390000 : 320000 },
    ],
    additional_charts: [
      { key: 'income_trend', title: 'Tendencia de ingresos', points: [{ period: `${month}-W1`, value: 2500000 }, { period: `${month}-W2`, value: 3100000 }] },
    ],
    consistency: {
      period_total_reservations: isMay ? 120 : 100,
      period_income_total: isMay ? 12_500_000 : 10_000_000,
      matches_total_reservations: true,
      matches_income_total: true,
    },
    meta: { month, currency: 'COP', top_n: 5, warnings: [] },
    status: 'ok',
  }
}

export async function mockMonthlyReport(context: BrowserContext): Promise<{ hits: { count: number } }> {
  const hits = { count: 0 }
  await context.route('**/bookings/portal/reports/monthly**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    hits.count += 1
    const url = new URL(route.request().url())
    const month = url.searchParams.get('month') ?? '2026-05'
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reportFor(month)) })
  })
  return { hits }
}
