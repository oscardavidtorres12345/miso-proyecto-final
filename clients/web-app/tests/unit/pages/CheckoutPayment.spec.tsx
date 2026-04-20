import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CheckoutPayment from '@/pages/CheckoutPayment'
import { renderWithProviders } from '../renderWithProviders'

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn(() => Promise.resolve(null)) }))
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CardElement: () => <div data-testid="card-element" />,
  useStripe: () => null,
  useElements: () => null,
}))
vi.mock('@/services/paymentService', () => ({
  createPaymentIntent: vi.fn(),
  getPaymentStatus: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useSearchParams: vi.fn() }
})

import { useSearchParams } from 'react-router-dom'

function mockSearchParams(params: Record<string, string>) {
  vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(params), vi.fn()] as ReturnType<typeof useSearchParams>)
}

describe('CheckoutPayment', () => {
  it('shows error when no bookingId is provided', () => {
    mockSearchParams({})
    renderWithProviders(<CheckoutPayment />)
    expect(screen.getByText('No se proporcionó un ID de reserva')).toBeInTheDocument()
  })

  it('renders page title when bookingId is present', () => {
    mockSearchParams({ bookingId: 'BK-001', amount: '150', currency: 'USD' })
    renderWithProviders(<CheckoutPayment />)
    expect(screen.getByRole('heading', { name: 'Pago seguro' })).toBeInTheDocument()
  })

  it('renders booking summary section', () => {
    mockSearchParams({ bookingId: 'BK-001', amount: '150', currency: 'USD' })
    renderWithProviders(<CheckoutPayment />)
    expect(screen.getByText('Resumen de la reserva')).toBeInTheDocument()
  })

  it('displays the bookingId from search params', () => {
    mockSearchParams({ bookingId: 'BK-001', amount: '150', currency: 'USD' })
    renderWithProviders(<CheckoutPayment />)
    expect(screen.getByText('BK-001')).toBeInTheDocument()
  })

  it('displays formatted total amount in booking summary', () => {
    mockSearchParams({ bookingId: 'BK-001', amount: '150', currency: 'USD' })
    renderWithProviders(<CheckoutPayment />)
    const amounts = screen.getAllByText('$150.00')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
  })
})
