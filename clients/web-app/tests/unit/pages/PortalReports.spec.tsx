import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import PortalReports from '@/pages/PortalReports'
import { renderWithProviders } from '../renderWithProviders'
import * as AuthContext from '@/context/AuthContext'
import * as bookingService from '@/services/bookingService'
import { UserRole } from '@/types/user'

const MOCK_REPORT: bookingService.PortalMonthlyReportResponseDto = {
  staff_user_id: 99,
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
    net_income: 1_800_000,
  },
  distribution_by_category: [
    { category: 'Suite', room_type: null, value: 40, percentage: 40 },
    { category: 'Estándar', room_type: null, value: 60, percentage: 60 },
  ],
  bars_by_period: [
    { period: '2026-05-01', value: 10 },
    { period: '2026-05-02', value: 8 },
  ],
  additional_charts: [
    {
      key: 'occupancy_by_room_type',
      title: 'Ocupación por tipo de habitación',
      points: [{ period: 'Suite', value: 20 }, { period: 'Estándar', value: 30 }],
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
  meta: {
    month: '2026-05',
    currency: 'COP',
    top_n: 5,
    warnings: [],
  },
  status: 'ok',
}

describe('PortalReports', () => {
  beforeEach(() => {
    i18n.changeLanguage('es-CO')

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      session: {
        user: {
          user_id: 99,
          username: 'staff',
          email: 'staff@test.com',
          role: UserRole.STAFF,
          is_active: true,
        },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        token: 'mock-jwt-token',
      },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      autoLoggedOut: false,
      setAuthData: vi.fn(),
      clearAuthData: vi.fn(),
      clearAutoLoggedOut: vi.fn(),
    })

    vi.spyOn(bookingService, 'getPortalMonthlyReport').mockResolvedValue(MOCK_REPORT)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('estructura y título', () => {
    it('renderiza el título del reporte mensual', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: 'Reporte mensual' })).toBeInTheDocument(),
      )
    })

    it('renderiza el subtítulo', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(
          screen.getByText('Análisis financiero mensual de tu propiedades'),
        ).toBeInTheDocument(),
      )
    })

    it('renderiza el botón Aplicar', () => {
      renderWithProviders(<PortalReports />)
      expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
    })
  })

  describe('carga de datos', () => {
    it('muestra los labels de los 8 KPIs', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(screen.getByText('Total de reservas')).toBeInTheDocument(),
      )
      expect(screen.getByText('Reservas canceladas')).toBeInTheDocument()
      expect(screen.getByText('Nuevos huéspedes')).toBeInTheDocument()
      expect(screen.getByText('Huéspedes recurrentes')).toBeInTheDocument()
      expect(screen.getByText('Habitaciones ocupadas')).toBeInTheDocument()
      expect(screen.getByText('Habitaciones disponibles')).toBeInTheDocument()
    })

    it('muestra los valores numéricos de los KPIs', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('7').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1)
    })

    it('renderiza elementos SVG para las gráficas', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
      const svgs = document.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThanOrEqual(2)
    })

    it('llama a getPortalMonthlyReport con auth correcto', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(bookingService.getPortalMonthlyReport).toHaveBeenCalledWith(
          { token: 'mock-jwt-token', userId: 99 },
          expect.objectContaining({ currency: 'COP' }),
        ),
      )
    })

    it('muestra los labels de las gráficas de distribución y barras', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(screen.getByText('Distribución por categoría')).toBeInTheDocument(),
      )
      expect(screen.getByText('Reservas por día del mes')).toBeInTheDocument()
    })

    it('muestra los títulos de las gráficas adicionales', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(screen.getByText('Ocupación por tipo de habitación')).toBeInTheDocument(),
      )
      expect(screen.getByText('Ingresos acumulados')).toBeInTheDocument()
    })
  })

  describe('filtros', () => {
    it('vuelve a llamar al servicio con nueva moneda al presionar Aplicar', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(bookingService.getPortalMonthlyReport).toHaveBeenCalledTimes(1),
      )

      const selects = screen.getAllByRole('combobox')
      const currencySelect = selects.find(
        (s) => (s as HTMLSelectElement).value === 'COP',
      )!
      fireEvent.change(currencySelect, { target: { value: 'USD' } })
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))

      await waitFor(() =>
        expect(bookingService.getPortalMonthlyReport).toHaveBeenCalledTimes(2),
      )
      expect(bookingService.getPortalMonthlyReport).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ currency: 'USD' }),
      )
    })

    it('no re-fetcha si cambia draft sin presionar Aplicar', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(bookingService.getPortalMonthlyReport).toHaveBeenCalledTimes(1),
      )

      const selects = screen.getAllByRole('combobox')
      const currencySelect = selects.find(
        (s) => (s as HTMLSelectElement).value === 'COP',
      )!
      fireEvent.change(currencySelect, { target: { value: 'USD' } })

      expect(bookingService.getPortalMonthlyReport).toHaveBeenCalledTimes(1)
    })
  })

  describe('warnings', () => {
    it('muestra el banner de advertencias cuando meta incluye warnings', async () => {
      vi.spyOn(bookingService, 'getPortalMonthlyReport').mockResolvedValueOnce({
        ...MOCK_REPORT,
        meta: { ...MOCK_REPORT.meta, warnings: ['Conversión de moneda no disponible'] },
      })
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(
          screen.getByText(/Conversión de moneda no disponible/),
        ).toBeInTheDocument(),
      )
    })

    it('no muestra el banner si no hay warnings', async () => {
      renderWithProviders(<PortalReports />)
      await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
      expect(screen.queryByText(/⚠/)).not.toBeInTheDocument()
    })
  })

  describe('manejo de errores', () => {
    it('muestra snackbar de error cuando falla el fetch', async () => {
      vi.spyOn(bookingService, 'getPortalMonthlyReport').mockRejectedValueOnce(
        new Error('500'),
      )
      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          'No se pudo cargar el reporte. Intenta de nuevo.',
        ),
      )
    })
  })

  describe('sin autenticación', () => {
    it('no llama al servicio cuando no hay auth', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        session: null,
        token: null,
        isAuthenticated: false,
        autoLoggedOut: false,
        setAuthData: vi.fn(),
        clearAuthData: vi.fn(),
        clearAutoLoggedOut: vi.fn(),
      })

      renderWithProviders(<PortalReports />)
      await waitFor(() =>
        expect(bookingService.getPortalMonthlyReport).not.toHaveBeenCalled(),
      )
    })
  })
})
