import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Cart from '@/pages/Cart'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider, cartStorageKey } from '@/context/CartContext'
import { I18nProvider } from '@/context/I18nContext'
import { SessionCountdownProvider } from '@/context/SessionCountdownContext'
import * as bookingService from '@/services/bookingService'

const USER_ID = 42

const seedAuth = () => {
  localStorage.setItem(
    'travel-hub-auth',
    JSON.stringify({
      user: {
        user_id: USER_ID,
        username: 'cart_test',
        email: 'c@test.com',
        role: 'GUEST',
        is_active: true,
      },
      permissions: [],
      sessionExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    }),
  )
}

const cartLine = (bookingId: string, roomName: string, amount: number) => ({
  bookingId,
  roomId: 1,
  hotelName: 'Hotel Prueba',
  roomName,
  image: 'https://example.com/x.jpg',
  amount,
  currency: 'COP',
  checkIn: '2026-05-01',
  checkOut: '2026-05-04',
  expiresAt: null as string | null,
})

const bookingSummary = (bookingId: string) => ({
  booking_id: bookingId,
  hold_id: `h_${bookingId}`,
  room_id: 1,
  user_id: String(USER_ID),
  check_in: '2026-05-01',
  check_out: '2026-05-04',
  units: 1,
  status: 'ON_HOLD',
  expires_at: null,
})

vi.spyOn(bookingService, 'getUserBookings').mockResolvedValue({
  user_id: String(USER_ID),
  bookings: [bookingSummary('t1'), bookingSummary('t2')],
  status: 'ok',
  sprint: 2,
  hu_id: 'HU003',
})

vi.spyOn(bookingService, 'cancelBooking').mockResolvedValue({
  status: 'CANCELLED',
  sprint: 1,
  hu_id: 'HU005',
  booking_id: 't1',
})

vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(null)
vi.spyOn(bookingService, 'createBookingBatch').mockResolvedValue({
  booking_id: 'batch-1',
  user_id: String(USER_ID),
  booking_ids: ['t1', 't2'],
  bookings: [],
  status: 'ON_HOLD',
  sprint: 1,
  hu_id: 'HU014',
})

const MQ_MOBILE = '(max-width: 650px)'
const MQ_TABLET = '(min-width: 651px) and (max-width: 1023px)'
const MQ_CHROME = '(max-width: 1023px)'

function mockMatchMedia(profile: 'desktop' | 'mobile' | 'tablet') {
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    let matches = false
    if (query === MQ_MOBILE) matches = profile === 'mobile'
    else if (query === MQ_TABLET) matches = profile === 'tablet'
    else if (query === MQ_CHROME) matches = profile === 'mobile' || profile === 'tablet'
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
          <SessionCountdownProvider>
            <CartProvider>
              <Cart />
            </CartProvider>
          </SessionCountdownProvider>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>,
  )

const renderCartWithCheckoutRoute = () =>
  render(
    <MemoryRouter initialEntries={['/cart']}>
      <I18nProvider>
        <AuthProvider>
          <SessionCountdownProvider>
            <CartProvider>
              <Routes>
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<CheckoutProbe />} />
              </Routes>
            </CartProvider>
          </SessionCountdownProvider>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>,
  )

const CheckoutProbe = () => {
  const location = useLocation()
  return <div>{`Checkout Page ${location.search}`}</div>
}

describe('Cart', () => {
  beforeEach(() => {
    localStorage.clear()
    mockMatchMedia('desktop')
    seedAuth()
    localStorage.setItem(
      cartStorageKey(USER_ID),
      JSON.stringify([cartLine('t1', 'Item Uno', 100_000), cartLine('t2', 'Item Dos', 200_000)]),
    )
  })

  it('shows centered empty message when cart has no lines', async () => {
    localStorage.setItem(cartStorageKey(USER_ID), JSON.stringify([]))
    renderCart()
    expect(screen.getByRole('heading', { name: 'Carrito' })).toBeInTheDocument()
    expect(
      await screen.findByText('Ups, parece que no hay nada en tu carrito por ahora'),
    ).toBeInTheDocument()
    const emptyP = screen.getByText('Ups, parece que no hay nada en tu carrito por ahora')
    expect(emptyP).toHaveClass('cart-page__empty-message')
    expect(document.querySelector('.cart-page__layout--empty')).toBeTruthy()
  })

  it('renders title and line items on desktop layout', async () => {
    renderCart()
    expect(screen.getByRole('heading', { name: 'Carrito' })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Hotel Prueba · Item Uno', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hotel Prueba · Item Dos', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Resumen del pedido' })).toBeInTheDocument()
  })

  it('removes an item when remove is triggered', async () => {
    const user = userEvent.setup()
    renderCart()
    await screen.findByRole('heading', { name: 'Hotel Prueba · Item Uno', level: 2 })
    const removeButtons = screen.getAllByRole('button', { name: 'Quitar del carrito' })
    await user.click(removeButtons[0])
    await waitFor(() => {
      expect(bookingService.cancelBooking).toHaveBeenCalledWith('t1')
    })
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Hotel Prueba · Item Uno', level: 2 })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Hotel Prueba · Item Dos', level: 2 })).toBeInTheDocument()
  })

  it('shows mobile pay bar and opens summary sheet', async () => {
    mockMatchMedia('mobile')
    const user = userEvent.setup()
    renderCart()
    await screen.findByRole('heading', { name: 'Hotel Prueba · Item Uno', level: 2 })
    expect(screen.queryByRole('complementary', { name: 'Resumen del pedido' })).not.toBeInTheDocument()

    const openSummary = screen.getByRole('button', { name: 'Ver resumen del pedido' })
    await user.click(openSummary)

    const sheet = document.querySelector('.bottom-sheet__panel--open')
    expect(sheet).toBeTruthy()
    expect(within(sheet as HTMLElement).getByRole('button', { name: 'Pagar' })).toBeInTheDocument()
  })

  it('navigates to checkout using batch booking id', async () => {
    const user = userEvent.setup()
    renderCartWithCheckoutRoute()
    await screen.findByRole('heading', { name: 'Hotel Prueba · Item Uno', level: 2 })

    await user.click(screen.getByRole('button', { name: 'Pagar' }))

    expect(bookingService.createBookingBatch).toHaveBeenCalledWith({
      user_id: String(USER_ID),
      booking_ids: ['t1', 't2'],
    })

    await waitFor(() => {
      expect(screen.getByText('Checkout Page ?bookingId=batch-1')).toBeInTheDocument()
    })
  })
})
