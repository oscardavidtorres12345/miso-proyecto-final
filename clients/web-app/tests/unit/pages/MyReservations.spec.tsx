import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { I18nProvider } from '@/context/I18nContext'
import { AuthProvider } from '@/context/AuthContext'
import MyReservations from '@/pages/MyReservations'
import * as bookingService from '@/services/bookingService'

const seedAuthSession = (userId = 42) => {
  localStorage.setItem(
    'travel-hub-auth',
    JSON.stringify({
      user: {
        user_id: userId,
        username: 'test',
        email: 't@test.com',
        role: 'GUEST',
        is_active: true,
      },
      permissions: [],
      sessionExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      token: null,
    }),
  )
}

describe('MyReservations', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    seedAuthSession()
    vi.spyOn(bookingService, 'getUserConfirmedUpcomingBookings').mockResolvedValue({
      user_id: '42',
      status: 'ok',
      sprint: 2,
      hu_id: 'HU003',
      reservations: [
        {
          id: 'res-1',
          imageUrl: 'https://picsum.photos/seed/aonang-resort/640/400',
          accommodationName: 'Aonang Villa Resort',
          location: 'Cartagena de Indias',
          arrival: '2026-02-21',
          departure: '2026-03-16',
          guestCount: 2,
          showCancel: true,
        },
        {
          id: 'res-2',
          imageUrl: 'https://picsum.photos/seed/caribbean-suite/640/400',
          accommodationName: 'Suite Bocagrande Vista Mar',
          location: 'Cartagena de Indias',
          arrival: '2026-05-03',
          departure: '2026-05-10',
          guestCount: 4,
          showCancel: true,
        },
      ],
    })
    vi.spyOn(bookingService, 'userCancelBooking').mockResolvedValue({
      status: 'CANCELLED',
      sprint: 2,
      hu_id: 'HU003',
      booking_id: 'res-1',
      hold_id: 'h-1',
    })
  })

  it('renders page title, switch link and reservation cards', async () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            <MyReservations />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Mis reservas' })).toBeInTheDocument()
    const switchLink = screen.getByRole('link', { name: 'Viajes anteriores' })
    expect(switchLink).toHaveAttribute('href', '/past-trips')
    expect(await screen.findByRole('heading', { name: 'Aonang Villa Resort' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Suite Bocagrande Vista Mar' })).toBeInTheDocument()
  })

  it('opens cancellation modal and dismiss button closes it without calling API', async () => {
    const cancelSpy = vi.spyOn(bookingService, 'userCancelBooking')
    const { container } = render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            <MyReservations />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    const cancelButtons = await screen.findAllByRole('button', { name: 'Cancelar reserva' })
    fireEvent.click(cancelButtons[0])

    expect(container.querySelector('.modal__panel--open')).toBeInTheDocument()
    expect(cancelSpy).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(container.querySelector('.modal__panel--open')).not.toBeInTheDocument()
    expect(cancelSpy).not.toHaveBeenCalled()
  })

  it('closes cancellation modal from close icon without calling API', async () => {
    const cancelSpy = vi.spyOn(bookingService, 'cancelBooking')
    const { container } = render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            <MyReservations />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    fireEvent.click((await screen.findAllByRole('button', { name: 'Cancelar reserva' }))[0])
    expect(container.querySelector('.modal__panel--open')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(container.querySelector('.modal__panel--open')).not.toBeInTheDocument()
    expect(cancelSpy).not.toHaveBeenCalled()
  })

  it('closes cancellation modal from overlay without calling API', async () => {
    const cancelSpy = vi.spyOn(bookingService, 'userCancelBooking')
    const { container } = render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            <MyReservations />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    fireEvent.click((await screen.findAllByRole('button', { name: 'Cancelar reserva' }))[0])
    expect(container.querySelector('.modal__panel--open')).toBeInTheDocument()

    fireEvent.click(container.querySelector('.modal__overlay')!)
    expect(container.querySelector('.modal__panel--open')).not.toBeInTheDocument()
    expect(cancelSpy).not.toHaveBeenCalled()
  })

  it('calls userCancelBooking with booking id and user id, then removes card on success', async () => {
    const cancelSpy = vi.spyOn(bookingService, 'userCancelBooking')
    const { container } = render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            <MyReservations />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    const cancelButtons = await screen.findAllByRole('button', { name: 'Cancelar reserva' })
    fireEvent.click(cancelButtons[0])
    expect(container.querySelector('.modal__panel--open')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Estoy seguro' }))

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith('res-1', 42)
    })
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Aonang Villa Resort' })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Suite Bocagrande Vista Mar' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('snackbar--success')
    expect(screen.getByRole('alert')).toHaveTextContent('La reserva ha sido cancelada')
  })

  it('keeps card in list and shows error snackbar when userCancelBooking fails', async () => {
    vi.spyOn(bookingService, 'userCancelBooking').mockRejectedValue(
      Object.assign(new Error('Server error'), { status: 500 }),
    )
    render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            <MyReservations />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    fireEvent.click((await screen.findAllByRole('button', { name: 'Cancelar reserva' }))[0])
    fireEvent.click(screen.getByRole('button', { name: 'Estoy seguro' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Aonang Villa Resort' })).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveClass('snackbar--error')
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cancelar la reserva. Intenta de nuevo.')
  })
})
