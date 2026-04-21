import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import PaymentConfirmation from '@/pages/PaymentConfirmation'
import { renderWithProviders } from '../renderWithProviders'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useSearchParams: vi.fn(), useNavigate: vi.fn() }
})

vi.mock('@/context/CartContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/CartContext')>()
  return { ...actual, useCart: vi.fn() }
})

import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'

const clearCart = vi.fn()

function mockSearchParams(params: Record<string, string>) {
  vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(params), vi.fn()] as ReturnType<typeof useSearchParams>)
}

describe('PaymentConfirmation', () => {
  beforeEach(() => {
    clearCart.mockReset()
    vi.mocked(useCart).mockReturnValue({ clearCart } as unknown as ReturnType<typeof useCart>)
  })

  it('renders success title', () => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn())
    mockSearchParams({ code: 'ABC-123' })
    renderWithProviders(<PaymentConfirmation />)
    expect(screen.getByRole('heading', { name: '¡Pago exitoso!' })).toBeInTheDocument()
  })

  it('displays the confirmation code from search params', () => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn())
    mockSearchParams({ code: 'ABC-123' })
    renderWithProviders(<PaymentConfirmation />)
    expect(screen.getByText('ABC-123')).toBeInTheDocument()
  })

  it('displays N/A when no confirmation code is provided', () => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn())
    mockSearchParams({})
    renderWithProviders(<PaymentConfirmation />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('renders email sent and booking details messages', () => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn())
    mockSearchParams({ code: 'ABC-123' })
    renderWithProviders(<PaymentConfirmation />)
    expect(screen.getByText('Se ha enviado un correo de confirmación a tu dirección de correo electrónico.')).toBeInTheDocument()
    expect(screen.getByText('Puedes ver los detalles de tu reserva en tu cuenta.')).toBeInTheDocument()
  })

  it('navigates to home when Return to Home button is clicked', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    mockSearchParams({ code: 'ABC-123' })
    renderWithProviders(<PaymentConfirmation />)
    await userEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    expect(navigate).toHaveBeenCalledWith('/')
  })

  it('navigates to reservations when View My Bookings button is clicked', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    mockSearchParams({ code: 'ABC-123' })
    renderWithProviders(<PaymentConfirmation />)
    await userEvent.click(screen.getByRole('button', { name: 'Ver mis reservas' }))
    expect(navigate).toHaveBeenCalledWith('/reservations')
  })

  it('clears the cart on mount', () => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn())
    mockSearchParams({ code: 'ABC-123' })
    renderWithProviders(<PaymentConfirmation />)
    expect(clearCart).toHaveBeenCalledOnce()
  })
})
