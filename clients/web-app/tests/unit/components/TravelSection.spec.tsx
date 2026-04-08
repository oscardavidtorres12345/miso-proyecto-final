import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TravelSection from '@/components/TravelSection'
import { renderWithProviders } from '../renderWithProviders'

describe('TravelSection', () => {
  it('renders translated heading and description', () => {
    renderWithProviders(<TravelSection />)
    expect(screen.getByText('Punto de viaje')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Te ayudamos a encontrar las vacaciones de tus sueños' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Te acompañamos en cada paso de tu aventura/i)
    ).toBeInTheDocument()
  })

  it('renders decorative images with alt text', () => {
    renderWithProviders(<TravelSection />)
    expect(screen.getByAltText('Aventura en montaña')).toBeInTheDocument()
    expect(screen.getByAltText('Destino de mar')).toBeInTheDocument()
  })
})
