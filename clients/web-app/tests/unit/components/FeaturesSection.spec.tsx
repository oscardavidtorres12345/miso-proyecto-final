import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FeaturesSection from '@/components/FeaturesSection'
import { renderWithProviders } from '../renderWithProviders'

describe('FeaturesSection', () => {
  it('renders all feature titles', () => {
    renderWithProviders(<FeaturesSection />)
    expect(screen.getByRole('heading', { name: 'Reservas seguras' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mejores precios' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cancelación flexible' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paga en pesos colombianos' })).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    renderWithProviders(<FeaturesSection />)
    expect(
      screen.getByText(/Reserva con total confianza/i)
    ).toBeInTheDocument()
  })
})
