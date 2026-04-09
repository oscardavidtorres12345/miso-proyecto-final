import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '@/pages/Home'
import { renderWithSearchProviders } from '../renderWithProviders'

describe('Home', () => {
  it('renders hero, features, destinations and travel sections', () => {
    renderWithSearchProviders(<Home />)

    expect(
      screen.getByRole('heading', { name: 'La vida es corta y el mundo es grande.' })
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Reservas seguras' })).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: 'Descubre destinos populares' })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: 'Te ayudamos a encontrar las vacaciones de tus sueños' })
    ).toBeInTheDocument()
  })
})
