import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Footer from '@/components/Footer'
import { renderWithProviders } from '../renderWithProviders'

describe('Footer', () => {
  it('renders the footer text in Spanish by default', () => {
    renderWithProviders(<Footer />)
    expect(screen.getByText('Hecho con amor 💚')).toBeInTheDocument()
  })

  it('renders a footer element', () => {
    renderWithProviders(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
