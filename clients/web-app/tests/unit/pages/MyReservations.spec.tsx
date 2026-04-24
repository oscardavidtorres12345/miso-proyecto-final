import { render, screen } from '@testing-library/react'
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
    vi.spyOn(bookingService, 'cancelBooking').mockResolvedValue({
      status: 'CANCELLED',
      sprint: 1,
      hu_id: 'HU005',
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
})
