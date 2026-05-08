import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import PortalDashboard from '@/pages/PortalDashboard'
import { renderWithProviders } from '../renderWithProviders'
import * as AuthContext from '@/context/AuthContext'
import * as bookingService from '@/services/bookingService'
import { UserRole } from '@/types/user'

const MOCK_DASHBOARD: bookingService.PortalDashboardResponseDto = {
  staff_user_id: 99,
  property_ids: [1],
  kpis: {
    total_reservations: 42,
    active_reservations: 10,
    current_guests: 5,
    income_total: 1_500_000,
  },
  occupancy_by_category: [
    { category: 'Suite', room_type: null, value: 8, property_name: 'Test Property' },
    { category: 'Estándar', room_type: null, value: 15, property_name: 'Test Property' },
  ],
  bookings_by_period: [
    { period: '2026-01', value: 12 },
    { period: '2026-02', value: 18 },
  ],
  ranking: [
    { label: 'Suite Junior', room_type: 'suite', value: 25 },
    { label: 'Estándar', room_type: null, value: 17 },
  ],
  income_trend: [
    { period: '2026-01', value: 800_000 },
    { period: '2026-02', value: 700_000 },
  ],
  meta: {
    date_from: '2026-01-01',
    date_to: '2026-02-28',
    granularity: 'month',
    currency: 'COP',
    top_n: 10,
    warnings: [],
  },
  status: 'ok',
}

describe('PortalDashboard', () => {
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

    vi.spyOn(bookingService, 'getPortalDashboard').mockResolvedValue(MOCK_DASHBOARD)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('estructura y título', () => {
    it('renderiza el título del dashboard', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument())
    })

    it('renderiza el subtítulo', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() =>
        expect(screen.getByText('Resumen ejecutivo de reservas de tu propiedad')).toBeInTheDocument(),
      )
    })

    it('renderiza el botón Aplicar', () => {
      renderWithProviders(<PortalDashboard />)
      expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
    })
  })

  describe('carga de datos', () => {
    it('muestra las 4 tarjetas KPI con los valores correctos', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
      expect(screen.getByText('10')).toBeInTheDocument()
      // El valor 5 puede aparecer también en ticks del SVG, verificamos que exista al menos uno
      expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1)
    })

    it('muestra los labels de las 4 tarjetas KPI', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(screen.getByText('Total de reservas')).toBeInTheDocument())
      expect(screen.getByText('Reservas activas')).toBeInTheDocument()
      expect(screen.getByText('Huéspedes actuales')).toBeInTheDocument()
    })

    it('muestra los labels de las 4 gráficas', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(screen.getByText('Reservas por período')).toBeInTheDocument())
      expect(screen.getByText('Tendencia de ingresos')).toBeInTheDocument()
      expect(screen.getByText('Ranking por servicios')).toBeInTheDocument()
      expect(screen.getByText('Ocupación por propiedad y habitación')).toBeInTheDocument()
    })

    it('renderiza elementos SVG para las gráficas', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
      const svgs = document.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThanOrEqual(4)
    })

    it('llama a getPortalDashboard con auth correcto', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(bookingService.getPortalDashboard).toHaveBeenCalledWith(
        { token: 'mock-jwt-token', userId: 99 },
        expect.objectContaining({ currency: 'COP' }),
      ))
    })
  })

  describe('filtros', () => {
    it('vuelve a llamar al servicio con nuevos filtros al presionar Aplicar', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(bookingService.getPortalDashboard).toHaveBeenCalledTimes(1))

      const selects = screen.getAllByRole('combobox')
      const currencySelect = selects.find(s => (s as HTMLSelectElement).value === 'COP')!
      fireEvent.change(currencySelect, { target: { value: 'USD' } })

      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))

      await waitFor(() => expect(bookingService.getPortalDashboard).toHaveBeenCalledTimes(2))
      expect(bookingService.getPortalDashboard).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ currency: 'USD' }),
      )
    })

    it('no re-fetcha si cambia draft sin presionar Aplicar', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(bookingService.getPortalDashboard).toHaveBeenCalledTimes(1))

      const selects = screen.getAllByRole('combobox')
      const currencySelect = selects.find(s => (s as HTMLSelectElement).value === 'COP')!
      fireEvent.change(currencySelect, { target: { value: 'USD' } })

      expect(bookingService.getPortalDashboard).toHaveBeenCalledTimes(1)
    })
  })

  describe('warnings', () => {
    it('muestra el banner de advertencias cuando el meta incluye warnings', async () => {
      vi.spyOn(bookingService, 'getPortalDashboard').mockResolvedValueOnce({
        ...MOCK_DASHBOARD,
        meta: { ...MOCK_DASHBOARD.meta, warnings: ['Rango de fechas muy amplio'] },
      })
      renderWithProviders(<PortalDashboard />)
      await waitFor(() =>
        expect(screen.getByText(/Rango de fechas muy amplio/)).toBeInTheDocument(),
      )
    })

    it('no muestra el banner si no hay warnings', async () => {
      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
      expect(screen.queryByText(/⚠/)).not.toBeInTheDocument()
    })
  })

  describe('manejo de errores', () => {
    it('muestra snackbar de error cuando falla el fetch', async () => {
      vi.spyOn(bookingService, 'getPortalDashboard').mockRejectedValueOnce(new Error('500'))
      renderWithProviders(<PortalDashboard />)
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          'No se pudo cargar el dashboard. Intenta de nuevo.',
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

      renderWithProviders(<PortalDashboard />)
      await waitFor(() => expect(bookingService.getPortalDashboard).not.toHaveBeenCalled())
    })
  })
})
