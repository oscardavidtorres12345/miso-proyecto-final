import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { buildReportPdf } from '@/utils/reportPdf'
import type { PortalMonthlyReportResponseDto } from '@/services/bookingService'

const mockSave = vi.hoisted(() => vi.fn())
const mockAutoTable = vi.hoisted(() => vi.fn())

vi.mock('jspdf', () => ({
  default: vi.fn(function MockJsPDF() {
    return {
      setFillColor: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      rect: vi.fn(),
      text: vi.fn(),
      save: mockSave,
      lastAutoTable: { finalY: 50 },
    }
  }),
}))

vi.mock('jspdf-autotable', () => ({ default: mockAutoTable }))

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
    { category: 'Suite', room_type: null, value: 40, percentage: 40 },
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
    {
      key: 'accumulated_income',
      title: 'Ingresos acumulados',
      points: [{ period: '2026-05-01', value: 500_000 }],
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

describe('buildReportPdf', () => {
  it('llama a doc.save con el nombre de archivo correcto', () => {
    buildReportPdf(MOCK_REPORT, i18n.t, 'COP')
    expect(mockSave).toHaveBeenCalledWith('reporte-mensual-2026-05.pdf')
  })

  it('llama a doc.save exactamente una vez', () => {
    buildReportPdf(MOCK_REPORT, i18n.t, 'COP')
    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it('genera 5 tablas: KPIs + distribución + barras + 2 gráficas adicionales', () => {
    buildReportPdf(MOCK_REPORT, i18n.t, 'COP')
    // 1 KPIs + 1 distribución + 1 barras + 2 additional charts
    expect(mockAutoTable).toHaveBeenCalledTimes(5)
  })

  it('genera 3 tablas cuando no hay gráficas adicionales', () => {
    const reportSinAdicionales = { ...MOCK_REPORT, additional_charts: [] }
    buildReportPdf(reportSinAdicionales, i18n.t, 'COP')
    expect(mockAutoTable).toHaveBeenCalledTimes(3)
  })

  it('genera 4 tablas con una sola gráfica adicional', () => {
    const reportConUna = { ...MOCK_REPORT, additional_charts: [MOCK_REPORT.additional_charts[0]] }
    buildReportPdf(reportConUna, i18n.t, 'COP')
    expect(mockAutoTable).toHaveBeenCalledTimes(4)
  })

  it('el nombre del archivo incluye el mes del reporte', () => {
    const reportOtroMes = { ...MOCK_REPORT, meta: { ...MOCK_REPORT.meta, month: '2025-12' }, month: '2025-12' }
    buildReportPdf(reportOtroMes, i18n.t, 'COP')
    expect(mockSave).toHaveBeenCalledWith('reporte-mensual-2025-12.pdf')
  })
})
