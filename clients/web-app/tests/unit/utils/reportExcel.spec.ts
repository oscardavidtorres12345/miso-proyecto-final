import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { buildReportExcel } from '@/utils/reportExcel'
import * as XLSX from 'xlsx'
import type { PortalMonthlyReportResponseDto } from '@/services/bookingService'

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

const MOCK_REPORT: PortalMonthlyReportResponseDto = {
  staff_user_id: 1,
  property_ids: [1],
  month: '2026-05',
  kpis_month: {
    total_reservations: 42,
    cancelled_reservations: 3,
    new_guests: 15,
    returning_guests: 7,
    occupied_rooms: 20,
    available_rooms: 10,
    gross_income: 2_000_000,
    net_income: 1_700_000,
  },
  distribution_by_category: [
    { category: 'Suite', room_type: 'King', value: 40, percentage: 40 },
    { category: 'Estándar', room_type: null, value: 60, percentage: 60 },
  ],
  bars_by_period: [
    { period: '2026-05-01', value: 500_000 },
    { period: '2026-05-02', value: 300_000 },
  ],
  additional_charts: [
    {
      key: 'occupancy_by_room_type',
      title: 'Ocupación por tipo de habitación',
      points: [{ period: 'Suite', value: 20 }],
    },
  ],
  consistency: {
    period_total_reservations: 42,
    period_income_total: 2_000_000,
    matches_total_reservations: true,
    matches_income_total: true,
  },
  meta: { month: '2026-05', currency: 'COP', top_n: 5, warnings: [] },
  status: 'ok',
}

beforeEach(() => {
  i18n.changeLanguage('es-CO')
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildReportExcel', () => {
  it('llama a XLSX.writeFile con el nombre de archivo correcto', () => {
    buildReportExcel(MOCK_REPORT, i18n.t, 'COP')
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'reporte-mensual-2026-05.xlsx')
  })

  it('crea las 3 hojas base (KPIs, Distribución, Reservas por día)', () => {
    buildReportExcel(MOCK_REPORT, i18n.t, 'COP')
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(4) // 3 base + 1 additional
  })

  it('crea solo las 3 hojas base cuando no hay gráficas adicionales', () => {
    const reportSinAdicionales = { ...MOCK_REPORT, additional_charts: [] }
    buildReportExcel(reportSinAdicionales, i18n.t, 'COP')
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3)
  })

  it('crea una hoja extra por cada gráfica adicional', () => {
    const reportConDosAdicionales = {
      ...MOCK_REPORT,
      additional_charts: [
        { key: 'chart1', title: 'Gráfica 1', points: [{ period: '05-01', value: 100 }] },
        { key: 'chart2', title: 'Gráfica 2', points: [{ period: '05-02', value: 200 }] },
      ],
    }
    buildReportExcel(reportConDosAdicionales, i18n.t, 'COP')
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(5) // 3 + 2
  })

  it('la primera hoja tiene el nombre KPIs', () => {
    buildReportExcel(MOCK_REPORT, i18n.t, 'COP')
    expect(XLSX.utils.book_append_sheet).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.anything(),
      'KPIs',
    )
  })

  it('la hoja KPIs contiene los 8 indicadores', () => {
    buildReportExcel(MOCK_REPORT, i18n.t, 'COP')
    const firstCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as unknown[][]
    // Row 0 = header, rows 1-8 = KPI data
    expect(firstCall).toHaveLength(9)
  })

  it('la hoja de distribución incluye los datos de cada categoría', () => {
    buildReportExcel(MOCK_REPORT, i18n.t, 'COP')
    const secondCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[1][0] as unknown[][]
    // Row 0 = header, rows 1-2 = distribution items
    expect(secondCall).toHaveLength(3)
    expect(secondCall[1]).toContain('Suite')
    expect(secondCall[2]).toContain('Estándar')
  })

  it('la hoja de reservas por día incluye los datos del período', () => {
    buildReportExcel(MOCK_REPORT, i18n.t, 'COP')
    const thirdCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[2][0] as unknown[][]
    // Row 0 = header, rows 1-2 = period data
    expect(thirdCall).toHaveLength(3)
    expect(thirdCall[1]).toContain('2026-05-01')
    expect(thirdCall[2]).toContain('2026-05-02')
  })

  it('trunca el nombre de hoja de gráficas adicionales a 31 caracteres', () => {
    const tituloLargo = 'Este es un título muy largo que supera los 31 caracteres'
    const reportConTituloLargo = {
      ...MOCK_REPORT,
      additional_charts: [{ key: 'x', title: tituloLargo, points: [] }],
    }
    buildReportExcel(reportConTituloLargo, i18n.t, 'COP')
    const sheetNameCall = vi.mocked(XLSX.utils.book_append_sheet).mock.calls[3]
    expect((sheetNameCall[2] as string).length).toBeLessThanOrEqual(31)
  })

  it('rellena con cadena vacía cuando room_type es null', () => {
    buildReportExcel(MOCK_REPORT, i18n.t, 'COP')
    const secondCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[1][0] as unknown[][]
    const estandardRow = secondCall[2] as string[]
    expect(estandardRow[1]).toBe('')
  })
})
