import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import CartItemCard from '@/components/CartItemCard'
import type { CartLineItem } from '@/types/cart'
import { renderWithProviders } from '../renderWithProviders'

const baseItem: CartLineItem = {
  id: 'line-1',
  name: 'Hotel Bosque',
  image: 'https://example.com/room.jpg',
  price: { amount: 199_900, currency: 'COP' },
  breakdown: {
    stayBase: 150_000,
    charges: 20_000,
    taxes: 29_900,
    insurance: 0,
    discount: 0,
  },
}

describe('CartItemCard', () => {
  it('renders name, formatted price and currency', () => {
    renderWithProviders(<CartItemCard item={baseItem} />)
    expect(screen.getByRole('heading', { name: 'Hotel Bosque' })).toBeInTheDocument()
    expect(screen.getByText('199.900')).toBeInTheDocument()
    expect(screen.getByText('COP')).toBeInTheDocument()
  })

  it('renders remove control with translated label', () => {
    renderWithProviders(<CartItemCard item={baseItem} />)
    expect(screen.getByRole('button', { name: 'Quitar del carrito' })).toBeInTheDocument()
  })

  it('calls onRemove with item id when remove is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    renderWithProviders(<CartItemCard item={baseItem} onRemove={onRemove} />)
    await user.click(screen.getByRole('button', { name: 'Quitar del carrito' }))
    expect(onRemove).toHaveBeenCalledWith('line-1')
  })

  it('does not throw when onRemove is omitted', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CartItemCard item={baseItem} />)
    await user.click(screen.getByRole('button', { name: 'Quitar del carrito' }))
  })
})
