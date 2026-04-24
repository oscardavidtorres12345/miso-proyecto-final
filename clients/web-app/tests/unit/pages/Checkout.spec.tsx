import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Checkout from '@/pages/Checkout'
import * as checkoutService from '@/services/checkoutService'
import { MOCK_CHECKOUT_PAGE } from '@/mocks/checkout'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { I18nProvider } from '@/context/I18nContext'
import { SearchProvider } from '@/context/SearchContext'
import { cartStorageKey } from '@/context/CartContext'
import { SessionCountdownProvider } from '@/context/SessionCountdownContext'
import * as bookingService from '@/services/bookingService'
import { persistHoldCountdownEnd, readHoldCountdownEnd } from '@/utils/holdCountdownStorage'

const MQ_MOBILE_PAY = '(max-width: 650px)'
const MQ_TABLET_HOST = '(min-width: 651px) and (max-width: 1023px)'
const MQ_MAX_1023 = '(max-width: 1023px)'

function cloneMock() {
  return {
    ...MOCK_CHECKOUT_PAGE,
    holder: { ...MOCK_CHECKOUT_PAGE.holder },
    cartLineItems: MOCK_CHECKOUT_PAGE.cartLineItems.map((item) => ({
      ...item,
      price: { ...item.price },
      breakdown: { ...item.breakdown },
    })),
  }
}

function mockCheckoutMatchMedia(profile: 'desktop' | 'mobile' | 'tablet') {
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    let matches = false
    if (query === MQ_MOBILE_PAY) matches = profile === 'mobile'
    else if (query === MQ_TABLET_HOST) matches = profile === 'tablet'
    else if (query === MQ_MAX_1023) matches = profile === 'mobile' || profile === 'tablet'
    return {
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
  })
}

describe('Checkout', () => {
  const renderCheckout = (path = '/checkout?bookingId=batch-1') =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <SearchProvider>
            <AuthProvider>
              <SessionCountdownProvider>
                <CartProvider>
                  <Routes>
                    <Route path="/checkout" element={<Checkout />} />
                  </Routes>
                </CartProvider>
              </SessionCountdownProvider>
            </AuthProvider>
          </SearchProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

  beforeEach(() => {
    vi.spyOn(bookingService, 'cancelBooking').mockResolvedValue({
      status: 'CANCELLED',
      sprint: 1,
      hu_id: 'HU005',
      booking_id: 't1',
    })
    localStorage.setItem(
      'travel-hub-auth',
      JSON.stringify({
        user: {
          user_id: 42,
          username: 'Jhon Doe',
          email: 'email@mail.com',
          role: 'GUEST',
          is_active: true,
        },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    )
    mockCheckoutMatchMedia('desktop')
    vi.spyOn(bookingService, 'getBookingBatch').mockResolvedValue({
      booking_id: 'batch-1',
      user_id: '42',
      booking_ids: ['t1'],
      bookings: [],
      status: 'ON_HOLD',
      sprint: 1,
      hu_id: 'HU014',
    })
    vi.spyOn(checkoutService, 'fetchCheckoutPage').mockResolvedValue(cloneMock())
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state until fetch resolves', async () => {
    let resolveLoad: (v: ReturnType<typeof cloneMock>) => void = () => {}
    const barrier = new Promise<ReturnType<typeof cloneMock>>((r) => {
      resolveLoad = r
    })
    vi.spyOn(checkoutService, 'fetchCheckoutPage').mockReturnValue(barrier)

    renderCheckout()

    expect(screen.getByText('Cargando datos de la reserva…')).toBeInTheDocument()

    resolveLoad(cloneMock())
    await waitFor(() => {
      expect(screen.queryByText('Cargando datos de la reserva…')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Detalles de la reserva' })).toBeInTheDocument()
  })

  it('shows error message when fetch fails', async () => {
    vi.spyOn(checkoutService, 'fetchCheckoutPage').mockRejectedValue(new Error('network'))
    renderCheckout()

    expect(
      await screen.findByText('No pudimos cargar el checkout. Intenta de nuevo más tarde.'),
    ).toBeInTheDocument()
  })

  it('shows empty checkout copy when there are no line items', async () => {
    vi.spyOn(checkoutService, 'fetchCheckoutPage').mockResolvedValue({
      ...cloneMock(),
      cartLineItems: [],
    })
    renderCheckout()

    expect(
      await screen.findByText('No hay productos para pagar en este checkout.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pagar' })).not.toBeInTheDocument()
  })

  it('loads checkout data and prefills holder and email from the mock', async () => {
    renderCheckout()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Detalles de la reserva' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Nombres' })).toHaveValue('Jhon')
      expect(screen.getByRole('textbox', { name: 'Apellidos' })).toHaveValue('Doe')
      expect(screen.getByRole('textbox', { name: 'Correo' })).toHaveValue('email@mail.com')
      expect(screen.getByRole('button', { name: 'Moneda' })).toHaveTextContent('COP')
    })
  })

  it('shows the payment summary line for guest count from the service', async () => {
    renderCheckout()

    await waitFor(() => {
      expect(screen.getByText('Alojamiento para 2 personas')).toBeInTheDocument()
    })
    expect(screen.getByText('TOTAL')).toBeInTheDocument()
  })

  it('allows editing prefilled fields', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Nombres' })).toHaveValue(MOCK_CHECKOUT_PAGE.holder.firstName)
    })

    const first = screen.getByRole('textbox', { name: 'Nombres' })
    await user.clear(first)
    await user.type(first, 'Ana')
    expect(first).toHaveValue('Ana')
  })

  it('shows email validation error after blur when email is invalid', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Correo' })).toBeInTheDocument()
    })

    const email = screen.getByRole('textbox', { name: 'Correo' })
    await user.clear(email)
    await user.type(email, 'no-es-correo')
    await user.tab()

    expect(
      await screen.findByText('Ingresa un correo electrónico válido'),
    ).toBeInTheDocument()
  })

  it('disables pay when a required field is cleared', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pagar' })).not.toBeDisabled()
    })

    const first = screen.getByRole('textbox', { name: 'Nombres' })
    await user.clear(first)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled()
    })
  })

  it('opens custom currency list on desktop and updates selection', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Detalles de la reserva' })).toBeInTheDocument()
    })

    const currencyTrigger = screen.getByRole('button', { name: 'Moneda' })
    await user.click(currencyTrigger)

    const listbox = await screen.findByRole('listbox', { name: 'Moneda' })
    const usd = within(listbox).getByRole('option', { name: 'USD' })
    await user.click(usd)

    await waitFor(() => {
      expect(screen.queryByRole('listbox', { name: 'Moneda' })).not.toBeInTheDocument()
    })
    expect(currencyTrigger).toHaveTextContent('USD')
  })

  it('closes desktop currency list on Escape', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Moneda' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Moneda' }))
    expect(await screen.findByRole('listbox', { name: 'Moneda' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('listbox', { name: 'Moneda' })).not.toBeInTheDocument()
    })
  })

  it('opens a bottom sheet to pick currency on tablet', async () => {
    mockCheckoutMatchMedia('tablet')
    const user = userEvent.setup()
    renderCheckout()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Detalles de la reserva' })).toBeInTheDocument()
    })

    const currencyTrigger = screen.getByRole('button', { name: 'Moneda' })
    expect(currencyTrigger).toHaveTextContent('COP')

    await user.click(currencyTrigger)

    const usdOption = await screen.findByRole('option', { name: 'USD' })
    await user.click(usdOption)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Moneda' })).toHaveTextContent('USD')
    })
  })

  it('cancels booking, clears checkout session, and stops hold countdown when leaving select-flow checkout (empty cart)', async () => {
    persistHoldCountdownEnd(42, Date.now() + 600_000)
    vi.spyOn(bookingService, 'getBookingBatch').mockResolvedValue({
      booking_id: 'batch-select',
      user_id: '42',
      booking_ids: ['sel-1'],
      bookings: [],
      status: 'ON_HOLD',
      sprint: 1,
      hu_id: 'HU014',
    })
    vi.spyOn(checkoutService, 'fetchCheckoutPage').mockResolvedValue(cloneMock())
    const { unmount } = renderCheckout('/checkout?bookingId=batch-select&entry=select')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Detalles de la reserva' })).toBeInTheDocument()
    })
    unmount()
    await waitFor(() => {
      expect(bookingService.cancelBooking).toHaveBeenCalledWith('sel-1')
    })
    expect(readHoldCountdownEnd()).toBeNull()
  })

  it('does not stop hold countdown when leaving select-flow checkout with items in cart', async () => {
    const endMs = Date.now() + 600_000
    persistHoldCountdownEnd(42, endMs)
    localStorage.setItem(
      cartStorageKey(42),
      JSON.stringify([
        {
          bookingId: 'cart-hold-1',
          roomId: 1,
          hotelName: 'Hotel X',
          roomName: 'Doble',
          image: 'https://example.com/i.jpg',
          amount: 200000,
          currency: 'COP',
          checkIn: '2026-02-01',
          checkOut: '2026-02-04',
        },
      ]),
    )
    vi.spyOn(bookingService, 'getBookingBatch').mockResolvedValue({
      booking_id: 'batch-select',
      user_id: '42',
      booking_ids: ['sel-1'],
      bookings: [],
      status: 'ON_HOLD',
      sprint: 1,
      hu_id: 'HU014',
    })
    vi.spyOn(checkoutService, 'fetchCheckoutPage').mockResolvedValue(cloneMock())
    const { unmount } = renderCheckout('/checkout?bookingId=batch-select&entry=select')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Detalles de la reserva' })).toBeInTheDocument()
    })
    unmount()
    await waitFor(() => {
      expect(bookingService.cancelBooking).toHaveBeenCalledWith('sel-1')
    })
    const held = readHoldCountdownEnd()
    expect(held).not.toBeNull()
    expect(held?.endMs).toBe(endMs)
  })
})
