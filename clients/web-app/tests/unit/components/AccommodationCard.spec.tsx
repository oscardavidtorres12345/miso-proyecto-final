import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import AccommodationCard from '@/components/AccommodationCard'
import type { Accommodation } from '@/types/accommodation'
import { I18nProvider } from '@/context/I18nContext'
import { SearchProvider } from '@/context/SearchContext'
import { AuthProvider } from '@/context/AuthContext'
import { renderWithProviders } from '../renderWithProviders'

const accommodation: Accommodation = {
  id: 1,
  name: 'Hotel Prueba',
  image: 'https://example.com/hotel.jpg',
  distanceFromCenter: 2,
  stars: 4,
  rating: { score: 8.6, reviewCount: 120 },
  amenities: [{ id: 'wifi' }, { id: 'pool' }],
  hasBreakfast: true,
  price: {
    amount: 450_000,
    currency: 'COP',
    nights: 3,
    adults: 2,
    includesTaxes: true,
  },
}

describe('AccommodationCard', () => {
  it('renders name, distance, rating and price', () => {
    renderWithProviders(<AccommodationCard accommodation={accommodation} />)
    expect(screen.getByRole('heading', { name: 'Hotel Prueba' })).toBeInTheDocument()
    expect(screen.getByText(/a 2 km del centro/)).toBeInTheDocument()
    expect(screen.getByText('8.6')).toBeInTheDocument()
    expect(screen.getByText('450.000')).toBeInTheDocument()
    expect(screen.getByText('COP')).toBeInTheDocument()
  })

  it('shows breakfast pill when hasBreakfast is true', () => {
    renderWithProviders(<AccommodationCard accommodation={accommodation} />)
    expect(screen.getByText('Desayuno')).toBeInTheDocument()
  })

  it('hides breakfast pill when hasBreakfast is false', () => {
    renderWithProviders(
      <AccommodationCard accommodation={{ ...accommodation, hasBreakfast: false }} />
    )
    expect(screen.queryByText('Desayuno')).not.toBeInTheDocument()
  })

  it('renders view details action', () => {
    renderWithProviders(<AccommodationCard accommodation={accommodation} />)
    expect(screen.getByRole('button', { name: 'Ver detalles' })).toBeInTheDocument()
  })

  it('shows taxes note when price.includesTaxes is true', () => {
    renderWithProviders(<AccommodationCard accommodation={accommodation} />)
    expect(screen.getByText('Incluye impuestos y cargos')).toBeInTheDocument()
  })

  it('appends current search params to the accommodation link', () => {
    const searchQuery = 'destination=Bogot%C3%A1&checkIn=2026-05-01&checkOut=2026-05-04&adults=2&children=0&rooms=1'
    render(
      <MemoryRouter initialEntries={[`/search?${searchQuery}`]}>
        <I18nProvider>
          <SearchProvider>
            <AuthProvider>
              <AccommodationCard accommodation={accommodation} />
            </AuthProvider>
          </SearchProvider>
        </I18nProvider>
      </MemoryRouter>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `/accommodation/1?${searchQuery}`)
  })

  it('uses singular for one night and one adult in Spanish', () => {
    renderWithProviders(
      <AccommodationCard
        accommodation={{
          ...accommodation,
          price: { ...accommodation.price, nights: 1, adults: 1 },
        }}
      />,
    )
    expect(screen.getByText('1 noche, 1 adulto')).toBeInTheDocument()
  })
})
