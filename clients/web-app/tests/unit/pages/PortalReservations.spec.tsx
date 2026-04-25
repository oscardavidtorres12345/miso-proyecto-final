import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import PortalReservations from '@/pages/PortalReservations'
import { renderWithProviders } from '../renderWithProviders'
import * as AuthContext from '@/context/AuthContext'
import * as bookingService from '@/services/bookingService'
import { UserRole } from '@/types/user'

const MOCK_BOOKINGS: bookingService.BookingSummaryDto[] = [
  {
    booking_id: 'portal-res-1',
    hold_id: 'hold-1',
    property_id: 1,
    room_id: 1,
    user_id: 'Ana Garcia',
    check_in: '2026-02-21',
    check_out: '2026-03-16',
    units: 1,
    guest_count: 2,
    room_type: 'Suite Junior',
    status: 'CONFIRMED',
    hotel_confirmation_status: 'PENDING',
  },
  {
    booking_id: 'portal-res-2',
    hold_id: 'hold-2',
    property_id: 2,
    room_id: 2,
    user_id: 'Bruno Lopez',
    check_in: '2026-04-05',
    check_out: '2026-04-11',
    units: 1,
    guest_count: 3,
    room_type: 'Suite Deluxe',
    status: 'CONFIRMED',
    hotel_confirmation_status: 'PENDING',
  },
  {
    booking_id: 'portal-res-3',
    hold_id: 'hold-3',
    property_id: 3,
    room_id: 3,
    user_id: 'Carlos Rojas',
    check_in: '2026-05-12',
    check_out: '2026-05-20',
    units: 1,
    guest_count: 4,
    room_type: 'Habitacion Familiar',
    status: 'CONFIRMED',
    hotel_confirmation_status: 'PENDING',
  },
]

describe('PortalReservations', () => {
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
        sessionExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        token: 'mock-jwt-token',
      },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      autoLoggedOut: false,
      setAuthData: vi.fn(),
      clearAuthData: vi.fn(),
      clearAutoLoggedOut: vi.fn(),
    })

    vi.spyOn(bookingService, 'getPortalReservations').mockResolvedValue({
      properties: [],
      staff_user_id: 99,
      property_ids: [],
      bookings: MOCK_BOOKINGS,
      status: 'ok',
      sprint: 2,
      hu_id: 'HU013',
    })
    vi.spyOn(bookingService, 'hotelConfirmBooking').mockResolvedValue({
      status: 'CONFIRMED',
      sprint: 2,
      hu_id: 'HU013',
      booking_id: 'portal-res-1',
      hold_id: 'hold-1',
    })
    vi.spyOn(bookingService, 'hotelCancelBooking').mockResolvedValue({
      status: 'CANCELLED',
      sprint: 2,
      hu_id: 'HU013',
      booking_id: 'portal-res-1',
      hold_id: 'hold-1',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders reservations from API', async () => {
    renderWithProviders(<PortalReservations />)

    await waitFor(() => expect(screen.getByText('Suite Junior')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Confirmar' })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: 'Cancelar' })).toHaveLength(3)
    expect(screen.getByText('Suite Deluxe')).toBeInTheDocument()
    expect(screen.getByText('Habitacion Familiar')).toBeInTheDocument()
  })

  it('shows "-" when room_type is null', async () => {
    vi.spyOn(bookingService, 'getPortalReservations').mockResolvedValueOnce({
      properties: [],
      staff_user_id: 99,
      property_ids: [],
      bookings: [
        {
          ...MOCK_BOOKINGS[0],
          booking_id: 'portal-null-room',
          room_type: null,
        },
      ],
      status: 'ok',
      sprint: 2,
      hu_id: 'HU013',
    })

    renderWithProviders(<PortalReservations />)
    await waitFor(() => expect(screen.getByText('-')).toBeInTheDocument())
  })

  it('shows backend error message when list request fails', async () => {
    vi.spyOn(bookingService, 'getPortalReservations').mockRejectedValueOnce(new Error('boom'))
    renderWithProviders(<PortalReservations />)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('boom'),
    )
  })

  it('shows translated confirm error when confirm request fails', async () => {
    vi.spyOn(bookingService, 'hotelConfirmBooking').mockRejectedValueOnce(new Error('Conflict'))
    renderWithProviders(<PortalReservations />)
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Confirmar' })).toHaveLength(3))

    fireEvent.click(screen.getAllByRole('button', { name: 'Confirmar' })[0])

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudo confirmar la reserva. Intenta de nuevo.',
      ),
    )
  })

  it('shows translated cancel error when cancel request fails', async () => {
    vi.spyOn(bookingService, 'hotelCancelBooking').mockRejectedValueOnce(new Error('Conflict'))
    renderWithProviders(<PortalReservations />)
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Cancelar' })).toHaveLength(3))

    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudo cancelar la reserva. Intenta de nuevo.',
      ),
    )
  })

  it('does not load reservations when auth is missing', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      session: null,
      token: null,
      isAuthenticated: false,
      autoLoggedOut: false,
      setAuthData: vi.fn(),
      clearAuthData: vi.fn(),
      clearAutoLoggedOut: vi.fn(),
    })

    renderWithProviders(<PortalReservations />)
    await waitFor(() => expect(bookingService.getPortalReservations).not.toHaveBeenCalled())
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('shows success snackbar and hides confirm button for confirmed reservation', async () => {
    renderWithProviders(<PortalReservations />)
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Confirmar' })).toHaveLength(3))

    fireEvent.click(screen.getAllByRole('button', { name: 'Confirmar' })[0])

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('La reserva ha sido confirmada'))
    expect(screen.getAllByRole('button', { name: 'Confirmar' })).toHaveLength(2)
    expect(bookingService.hotelConfirmBooking).toHaveBeenCalledWith(
      { token: 'mock-jwt-token', userId: 99 },
      'portal-res-1',
    )
  })

  it('allows cancelling a reservation from the list', async () => {
    renderWithProviders(<PortalReservations />)
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Cancelar' })).toHaveLength(3))

    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('La reserva ha sido cancelada'))
    expect(screen.getAllByRole('button', { name: 'Cancelar' })).toHaveLength(2)
    expect(bookingService.hotelCancelBooking).toHaveBeenCalledWith(
      { token: 'mock-jwt-token', userId: 99 },
      'portal-res-1',
    )
  })
})
