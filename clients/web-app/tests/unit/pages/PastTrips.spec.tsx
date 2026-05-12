import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/context/I18nContext'
import { AuthProvider } from '@/context/AuthContext'
import PastTrips from '@/pages/PastTrips'
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

describe('PastTrips', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    seedAuthSession()
    vi.spyOn(bookingService, 'getUserConfirmedPastBookings').mockResolvedValue({
      user_id: '42',
      status: 'ok',
      sprint: 2,
      hu_id: 'HU003',
      reservations: [
        {
          id: 'past-1',
          imageUrl: 'https://picsum.photos/seed/past-san-andres/640/400',
          accommodationName: 'Aonang Villa Resort',
          location: 'Cartagena, Colombia',
          arrival: '2025-07-12',
          departure: '2025-07-19',
          guestCount: 2,
          showCancel: false,
          status: 'CONFIRMED',
        },
        {
          id: 'past-2',
          imageUrl: 'https://picsum.photos/seed/past-bocagrande/640/400',
          accommodationName: 'Hotel Bocagrande Plaza',
          location: 'Cartagena, Colombia',
          arrival: '2025-04-03',
          departure: '2025-04-08',
          guestCount: 1,
          showCancel: false,
          status: 'CONFIRMED',
        },
        {
          id: 'past-3',
          imageUrl: 'https://picsum.photos/seed/past-santa-marta/640/400',
          accommodationName: 'Marina Santa Marta Suites',
          location: 'Santa Marta, Colombia',
          arrival: '2024-12-21',
          departure: '2024-12-28',
          guestCount: 3,
          showCancel: false,
          status: 'CONFIRMED',
        },
        {
          id: 'past-4',
          imageUrl: 'https://picsum.photos/seed/cancelled-barranquilla/640/400',
          accommodationName: 'Hotel Barranquilla Centro',
          location: 'Barranquilla, Colombia',
          arrival: '2026-06-15',
          departure: '2026-06-20',
          guestCount: 2,
          showCancel: false,
          status: 'CANCELLED',
        },
      ],
    })
  })

  it('renders page title, switch link and past trip cards', async () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            <PastTrips />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Mis viajes anteriores' })).toBeInTheDocument()
    const switchLink = screen.getByRole('link', { name: 'Reservas' })
    expect(switchLink).toHaveAttribute('href', '/reservations')
    expect(await screen.findByRole('heading', { name: 'Aonang Villa Resort' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Hotel Bocagrande Plaza' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Marina Santa Marta Suites' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Hotel Barranquilla Centro' })).toBeInTheDocument()
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })
})
