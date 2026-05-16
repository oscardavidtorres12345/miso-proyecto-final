import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { useReportExport } from '@/hooks/useReportExport'
import * as reportPdf from '@/utils/reportPdf'
import * as reportExcel from '@/utils/reportExcel'
import type { PortalMonthlyReportResponseDto } from '@/services/bookingService'
import { UserRole } from '@/types/user'

vi.mock('@/utils/reportPdf', () => ({ buildReportPdf: vi.fn() }))
vi.mock('@/utils/reportExcel', () => ({ buildReportExcel: vi.fn() }))

const MOCK_REPORT: PortalMonthlyReportResponseDto = {
  staff_user_id: 1,
  property_ids: [1],
  month: '2026-05',
  kpis_month: {
    total_reservations: 10,
    cancelled_reservations: 1,
    new_guests: 3,
    returning_guests: 2,
    occupied_rooms: 5,
    available_rooms: 5,
    gross_income: 500_000,
    net_income: 425_000,
  },
  distribution_by_category: [{ category: 'Suite', room_type: null, value: 10, percentage: 100 }],
  bars_by_period: [{ period: '2026-05-01', value: 500_000 }],
  additional_charts: [],
  consistency: {
    period_total_reservations: 10,
    period_income_total: 500_000,
    matches_total_reservations: true,
    matches_income_total: true,
  },
  meta: { month: '2026-05', currency: 'COP', top_n: 5, warnings: [] },
  status: 'ok',
}

const MOCK_AUTH = {
  session: {
    user: { user_id: 1, username: 'staff', email: 'staff@test.com', role: UserRole.STAFF, is_active: true },
    permissions: [],
    sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    token: 'token',
  },
  token: 'token',
  isAuthenticated: true,
  autoLoggedOut: false,
  setAuthData: vi.fn(),
  clearAuthData: vi.fn(),
  clearAutoLoggedOut: vi.fn(),
}
void MOCK_AUTH

beforeEach(() => {
  i18n.changeLanguage('es-CO')
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useReportExport', () => {
  describe('estado inicial', () => {
    it('pdfLoading empieza en false', () => {
      const { result } = renderHook(() => useReportExport(null, 'COP'))
      expect(result.current.pdfLoading).toBe(false)
    })

    it('excelLoading empieza en false', () => {
      const { result } = renderHook(() => useReportExport(null, 'COP'))
      expect(result.current.excelLoading).toBe(false)
    })
  })

  describe('handleExportPdf', () => {
    it('no llama a buildReportPdf si report es null', async () => {
      const { result } = renderHook(() => useReportExport(null, 'COP'))
      await act(async () => { await result.current.handleExportPdf() })
      expect(reportPdf.buildReportPdf).not.toHaveBeenCalled()
    })

    it('llama a buildReportPdf con el report y currency correctos', async () => {
      const { result } = renderHook(() => useReportExport(MOCK_REPORT, 'COP'))
      await act(async () => { await result.current.handleExportPdf() })
      expect(reportPdf.buildReportPdf).toHaveBeenCalledWith(MOCK_REPORT, expect.any(Function), 'COP')
    })

    it('llama a buildReportPdf con la currency recibida como parámetro', async () => {
      const { result } = renderHook(() => useReportExport(MOCK_REPORT, 'USD'))
      await act(async () => { await result.current.handleExportPdf() })
      expect(reportPdf.buildReportPdf).toHaveBeenCalledWith(MOCK_REPORT, expect.any(Function), 'USD')
    })

    it('pdfLoading vuelve a false tras completar la exportación', async () => {
      const { result } = renderHook(() => useReportExport(MOCK_REPORT, 'COP'))
      await act(async () => { await result.current.handleExportPdf() })
      expect(result.current.pdfLoading).toBe(false)
    })
  })

  describe('handleExportExcel', () => {
    it('no llama a buildReportExcel si report es null', async () => {
      const { result } = renderHook(() => useReportExport(null, 'COP'))
      await act(async () => { await result.current.handleExportExcel() })
      expect(reportExcel.buildReportExcel).not.toHaveBeenCalled()
    })

    it('llama a buildReportExcel con el report y currency correctos', async () => {
      const { result } = renderHook(() => useReportExport(MOCK_REPORT, 'COP'))
      await act(async () => { await result.current.handleExportExcel() })
      expect(reportExcel.buildReportExcel).toHaveBeenCalledWith(MOCK_REPORT, expect.any(Function), 'COP')
    })

    it('llama a buildReportExcel con la currency recibida como parámetro', async () => {
      const { result } = renderHook(() => useReportExport(MOCK_REPORT, 'ARS'))
      await act(async () => { await result.current.handleExportExcel() })
      expect(reportExcel.buildReportExcel).toHaveBeenCalledWith(MOCK_REPORT, expect.any(Function), 'ARS')
    })

    it('excelLoading vuelve a false tras completar la exportación', async () => {
      const { result } = renderHook(() => useReportExport(MOCK_REPORT, 'COP'))
      await act(async () => { await result.current.handleExportExcel() })
      expect(result.current.excelLoading).toBe(false)
    })
  })
})
