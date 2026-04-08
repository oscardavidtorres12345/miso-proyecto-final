import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HeroSection from '@/components/HeroSection'
import { renderWithSearchProviders } from '../renderWithProviders'

describe('HeroSection', () => {
  it('renders hero title and subtitle', () => {
    renderWithSearchProviders(<HeroSection />)
    expect(screen.getByText('Descubre tus próximas vacaciones')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'La vida es corta y el mundo es grande.' })
    ).toBeInTheDocument()
  })

  it('renders search bar with disabled search until criteria are met', () => {
    const { container } = renderWithSearchProviders(<HeroSection />)
    const searchBarBtn = container.querySelector('.search-bar__button')
    expect(searchBarBtn).toBeInstanceOf(HTMLButtonElement)
    expect(searchBarBtn).toBeDisabled()
  })
})
