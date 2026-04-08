import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Cart from '@/pages/Cart'
import { AuthProvider } from '@/context/AuthContext'
import { I18nProvider } from '@/context/I18nContext'

vi.mock('@/mocks/cart', () => ({
  MOCK_CART_ITEMS: [
    {
      id: 't1',
      name: 'Item Uno',
      image: 'https://example.com/1.jpg',
      price: { amount: 100_000, currency: 'COP' },
      breakdown: {
        stayBase: 80_000,
        charges: 10_000,
        taxes: 10_000,
        insurance: 0,
        discount: 0,
      },
    },
    {
      id: 't2',
      name: 'Item Dos',
      image: 'https://example.com/2.jpg',
      price: { amount: 200_000, currency: 'COP' },
      breakdown: {
        stayBase: 150_000,
        charges: 20_000,
        taxes: 30_000,
        insurance: 0,
        discount: 0,
      },
    },
  ],
}))

const MQ_MOBILE = '(max-width: 650px)'
const MQ_TABLET = '(min-width: 651px) and (max-width: 1023px)'
const MQ_CHROME = '(max-width: 1023px)'

function mockMatchMedia(profile: 'desktop' | 'mobile' | 'tablet') {
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    let matches = false
    if (query === MQ_MOBILE) matches = profile === 'mobile'
    else if (query === MQ_TABLET) matches = profile === 'tablet'
    else if (query === MQ_CHROME)
      matches = profile === 'mobile' || profile === 'tablet'
    return {
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  })
}

const renderCart = () =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <AuthProvider>
          <Cart />
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  )

describe('Cart', () => {
  beforeEach(() => {
    mockMatchMedia('desktop')
  })

  it('renders title and line items on desktop layout', () => {
    renderCart()
    expect(screen.getByRole('heading', { name: 'Carrito' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Item Uno' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Item Dos' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Resumen del pedido' })).toBeInTheDocument()
  })

  it('removes an item when remove is triggered', async () => {
    const user = userEvent.setup()
    renderCart()
    const removeButtons = screen.getAllByRole('button', { name: 'Quitar del carrito' })
    await user.click(removeButtons[0])
    expect(screen.queryByRole('heading', { name: 'Item Uno' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Item Dos' })).toBeInTheDocument()
  })

  it('shows mobile pay bar and opens summary sheet', async () => {
    mockMatchMedia('mobile')
    const user = userEvent.setup()
    renderCart()
    expect(screen.queryByRole('complementary', { name: 'Resumen del pedido' })).not.toBeInTheDocument()

    const openSummary = screen.getByRole('button', { name: 'Ver resumen del pedido' })
    await user.click(openSummary)

    const sheet = document.querySelector('.bottom-sheet__panel--open')
    expect(sheet).toBeTruthy()
    expect(within(sheet as HTMLElement).getByRole('button', { name: 'Pagar' })).toBeInTheDocument()
  })
})
