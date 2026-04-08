import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Checkout from '@/pages/Checkout'
import { renderWithProviders } from '../renderWithProviders'

describe('Checkout page', () => {
  it('renders the title and placeholder text', () => {
    renderWithProviders(<Checkout />)

    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument()
    expect(screen.getByText(/no hay nada para ver aquí/i)).toBeInTheDocument()
  })
})
