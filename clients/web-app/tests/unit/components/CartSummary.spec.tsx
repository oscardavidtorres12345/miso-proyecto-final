import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import CartSummary from '@/components/CartSummary'
import type { CartSummaryLine, CartSummaryTotal } from '@/types/cart'
import { renderWithProviders } from '../renderWithProviders'

const lines: CartSummaryLine[] = [
  { id: '1', kind: 'productName', labelParams: { name: 'Hotel X' }, amount: 100_000 },
  { id: '2', kind: 'taxes', amount: 19_000 },
  { id: '3', kind: 'discounts', amount: -5_000, variant: 'discount' },
]

const total: CartSummaryTotal = { amount: 114_000, currency: 'COP' }

describe('CartSummary', () => {
  it('renders translated line labels and formatted amounts', () => {
    renderWithProviders(<CartSummary lines={lines} total={total} />)
    expect(screen.getByText('Hotel X')).toBeInTheDocument()
    expect(screen.getByText('Impuestos')).toBeInTheDocument()
    expect(screen.getByText('Descuentos')).toBeInTheDocument()
    expect(screen.getByText('TOTAL')).toBeInTheDocument()
    expect(screen.getByText('114.000')).toBeInTheDocument()
  })

  it('renders pay button with translated label', () => {
    renderWithProviders(<CartSummary lines={lines} total={total} />)
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeInTheDocument()
  })

  it('calls onGoToPay when pay button is clicked', async () => {
    const user = userEvent.setup()
    const onGoToPay = vi.fn()
    renderWithProviders(<CartSummary lines={lines} total={total} onGoToPay={onGoToPay} />)
    await user.click(screen.getByRole('button', { name: 'Pagar' }))
    expect(onGoToPay).toHaveBeenCalledTimes(1)
  })
})
