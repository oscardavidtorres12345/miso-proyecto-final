import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PopularDestinationsSection from '@/components/PopularDestinationsSection'
import { renderWithProviders } from '../renderWithProviders'

describe('PopularDestinationsSection', () => {
  it('renders section labels and city cards', () => {
    renderWithProviders(<PopularDestinationsSection />)
    expect(screen.getByText('Destinos populares')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Descubre destinos populares' })
    ).toBeInTheDocument()
    expect(screen.getByText('Cartagena')).toBeInTheDocument()
    expect(screen.getByText('Medellín')).toBeInTheDocument()
  })
})
