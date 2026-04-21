import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckoutForm } from '@/components/CheckoutForm'
import { renderWithProviders } from '../renderWithProviders'

vi.mock('@stripe/react-stripe-js', () => ({
  CardElement: () => <div data-testid="card-element" />,
  useStripe: vi.fn(),
  useElements: vi.fn(),
}))
vi.mock('@/services/paymentService', () => ({
  createPaymentIntent: vi.fn(),
  getPaymentStatus: vi.fn(),
}))

import { useStripe, useElements } from '@stripe/react-stripe-js'

const defaultProps = {
  bookingId: 'BK-001',
  userId: 'user-1',
  amount: 200,
  currency: 'USD',
}

describe('CheckoutForm', () => {
  beforeEach(() => {
    vi.mocked(useStripe).mockReturnValue(null)
    vi.mocked(useElements).mockReturnValue(null)
  })

  it('renders card details label', () => {
    renderWithProviders(<CheckoutForm {...defaultProps} />)
    expect(screen.getByText('Datos de la tarjeta')).toBeInTheDocument()
  })

  it('renders the card element', () => {
    renderWithProviders(<CheckoutForm {...defaultProps} />)
    expect(screen.getByTestId('card-element')).toBeInTheDocument()
  })

  it('renders secured by Stripe message', () => {
    renderWithProviders(<CheckoutForm {...defaultProps} />)
    expect(screen.getByText(/Protegido por Stripe/)).toBeInTheDocument()
  })

  it('renders total label', () => {
    renderWithProviders(<CheckoutForm {...defaultProps} />)
    expect(screen.getByText('Total:')).toBeInTheDocument()
  })

  it('renders formatted total amount', () => {
    renderWithProviders(<CheckoutForm {...defaultProps} />)
    expect(screen.getByText('$200.00')).toBeInTheDocument()
  })

  it('renders confirm payment button', () => {
    renderWithProviders(<CheckoutForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Confirmar pago' })).toBeInTheDocument()
  })

  it('disables button when stripe is not loaded', () => {
    renderWithProviders(<CheckoutForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled()
  })

  it('does not show snackbar initially', () => {
    renderWithProviders(<CheckoutForm {...defaultProps} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
