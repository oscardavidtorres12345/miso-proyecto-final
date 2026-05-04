import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import AccommodationDetail from '@/pages/AccommodationDetail'
import { I18nProvider } from '@/context/I18nContext'
import { SearchProvider } from '@/context/SearchContext'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { SessionCountdownProvider } from '@/context/SessionCountdownContext'
import { cartStorageKey } from '@/context/CartContext'
import { renderWithProviders } from '../renderWithProviders'
import type { HotelDetail } from '@/services/accommodationService'
import * as accommodationService from '@/services/accommodationService'
import { createBookingBatch, createBookingHold } from '@/services/bookingService'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/bookingService', () => ({
  createBookingHold: vi.fn(),
  createBookingBatch: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => navigateMock,
  }
})

const renderWithSearchUrl = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/accommodation/1?${search}`]}>
      <I18nProvider>
        <SearchProvider>
          <AuthProvider>
            <SessionCountdownProvider>
              <CartProvider>
                <AccommodationDetail />
              </CartProvider>
            </SessionCountdownProvider>
          </AuthProvider>
        </SearchProvider>
      </I18nProvider>
    </MemoryRouter>
  )

const MOCK_HOTEL: HotelDetail = {
  id: 1,
  name: 'hotel Cartagena #1',
  description: 'A beautiful hotel in Cartagena.',
  stars: 4,
  rating: { score: 4.3, reviewCount: 3 },
  photos: [
    { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt: 'hotel Cartagena #1' },
    { url: 'https://picsum.photos/seed/1b/1200/600', alt: null },
    { url: 'https://picsum.photos/seed/1c/1200/600', alt: null },
  ],
  amenities: [{ id: 'wifi' }, { id: 'pool' }],
  schedule: {
    checkIn: { from: '15:00', to: '23:59' },
    checkOut: { time: '13:00' },
  },
  rooms: [
    {
      id: 1,
      name: 'Room 1',
      description: 'Cama Double Capacidad máxima: 2 persona(s).',
      images: ['https://picsum.photos/seed/room1/600/400'],
      price: { totalAmount: 0, pricePerNight: 0, currency: 'COP', nights: 1, adults: 2, includesTaxes: true },
    },
    {
      id: 2,
      name: 'Room 2',
      description: 'Cama King Capacidad máxima: 3 persona(s).',
      images: ['https://picsum.photos/seed/room2/600/400'],
      price: { totalAmount: 0, pricePerNight: 0, currency: 'COP', nights: 1, adults: 2, includesTaxes: true },
    },
    {
      id: 3,
      name: 'Room 3',
      description: 'Cama Single Capacidad máxima: 4 persona(s).',
      images: ['https://picsum.photos/seed/room3/600/400'],
      price: { totalAmount: 0, pricePerNight: 0, currency: 'COP', nights: 1, adults: 2, includesTaxes: true },
    },
  ],
  suggestedRoom: { name: 'Room 1', mealPlan: 'breakfast', totalPrice: 0, currency: 'COP' },
}

const seedAuthSession = (userId = 42) => {
  localStorage.setItem(
    'travel-hub-auth',
    JSON.stringify({
      user: {
        user_id: userId,
        username: 'test',
        email: 't@test.com',
        role: 'GUEST',
        is_active: true,
      },
      permissions: [],
      sessionExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    }),
  )
}

const mockFetch = (data: unknown, ok = true) => {
  if (ok) {
    vi.spyOn(accommodationService, 'getHotelById').mockResolvedValue(data as HotelDetail)
  } else {
    vi.spyOn(accommodationService, 'getHotelById').mockRejectedValue(new Error('Failed to fetch hotel details'))
  }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  i18n.changeLanguage('es-CO')
  navigateMock.mockClear()
  vi.restoreAllMocks()
  vi.mocked(createBookingHold).mockReset()
  vi.mocked(createBookingBatch).mockReset()
  vi.mocked(createBookingHold).mockResolvedValue({
    status: 'ON_HOLD',
    sprint: 1,
    hu_id: 'HU005',
    booking_id: 'b1',
    hold_id: 'h1',
  })
  vi.mocked(createBookingBatch).mockResolvedValue({
    booking_id: 'batch-1',
    user_id: '99',
    booking_ids: ['b1'],
    bookings: [],
    status: 'ON_HOLD',
    sprint: 1,
    hu_id: 'HU005',
  })
})

describe('AccommodationDetail', () => {
  describe('loading state', () => {
    it('shows loading indicator before data arrives', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
      renderWithProviders(<AccommodationDetail />)
      expect(document.querySelector('.accommodation-detail__loading')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error state element when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(document.querySelector('.accommodation-detail__error-state')).toBeInTheDocument()
      })
    })

    it('shows error message in Spanish when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByText(':( Ups, hubo un error al cargar los detalles del alojamiento.')).toBeInTheDocument()
      })
    })

    it('shows error message in English when fetch fails and language is en-US', async () => {
      localStorage.setItem('travel-hub-country', 'us')
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByText(':( Oops, there was an error loading the accommodation details.')).toBeInTheDocument()
      })
    })

    it('shows error state when fetch returns non-ok response', async () => {
      mockFetch({ message: 'Not found' }, false)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(document.querySelector('.accommodation-detail__error-state')).toBeInTheDocument()
      })
    })
  })

  describe('rendering', () => {
    it('renders the hotel name heading', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'hotel Cartagena #1', level: 1 })).toBeInTheDocument()
      })
    })

    it('renders gallery images from API', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        const images = screen.getAllByRole('img')
        const galleryImages = images.filter((img) =>
          (img as HTMLImageElement).src.includes('unsplash') ||
          (img as HTMLImageElement).src.includes('picsum.photos/seed/1')
        )
        expect(galleryImages.length).toBe(3)
      })
    })

    it('renders the hotel description from API', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        const desc = document.querySelector('.accommodation-detail__description')
        expect(desc?.textContent).toBe('A beautiful hotel in Cartagena.')
      })
    })

    it('renders 5 star elements', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        const starContainer = document.querySelector('.accommodation-detail__stars')
        expect(starContainer?.querySelectorAll('svg').length).toBe(5)
      })
    })

    it('renders the amenities section heading', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Amenidades', level: 2 })).toBeInTheDocument()
      })
    })

    it('renders the schedule section heading', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Horarios', level: 2 })).toBeInTheDocument()
      })
    })

    it('renders the rooms section heading', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Habitaciones', level: 2 })).toBeInTheDocument()
      })
    })

    it('renders check-in schedule from API', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByText('Check in: de 15:00 a 23:59')).toBeInTheDocument()
      })
    })

    it('renders check-out schedule from API', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByText('Check out: 13:00')).toBeInTheDocument()
      })
    })
  })

  describe('pricing widget', () => {
    it('renders the suggested room name in the widget', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        const widgetRoom = document.querySelector('.accommodation-detail__widget-room')
        expect(widgetRoom).toHaveTextContent('Room 1')
      })
    })

    it('renders the breakfast badge when mealPlan is breakfast', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        const pill = document.querySelector('.accommodation-detail__widget-pill')
        expect(pill).toBeInTheDocument()
        expect(pill).toHaveTextContent('Desayuno')
      })
    })

    it('does not render breakfast badge when mealPlan is not breakfast', async () => {
      mockFetch({ ...MOCK_HOTEL, suggestedRoom: { ...MOCK_HOTEL.suggestedRoom, mealPlan: 'none' } })
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(document.querySelector('.accommodation-detail__widget-pill')).not.toBeInTheDocument()
      })
    })

    it('renders the "Ver habitaciones" button', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Ver habitaciones' })).toBeInTheDocument()
      })
    })
  })

  describe('rooms', () => {
    it('renders 3 room cards from API', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        const cards = document.querySelectorAll('.accommodation-detail__room-card')
        expect(cards.length).toBe(3)
      })
    })

    it('renders room names from API', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Room 1', level: 3 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Room 2', level: 3 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Room 3', level: 3 })).toBeInTheDocument()
      })
    })

    it('renders "Seleccionar" buttons', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        const selectBtns = screen.getAllByRole('button', { name: 'Seleccionar' })
        expect(selectBtns.length).toBe(3)
      })
    })

    it('renders "Agregar al carrito" buttons', async () => {
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        const cartBtns = screen.getAllByRole('button', { name: /Agregar al carrito/ })
        expect(cartBtns.length).toBe(3)
      })
    })

    it('calls createBookingHold with room id, user id and URL dates', async () => {
      seedAuthSession(99)
      mockFetch(MOCK_HOTEL)
      renderWithSearchUrl(
        'checkIn=2026-05-01&checkOut=2026-05-04&adults=2&children=0&rooms=2',
      )
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Room 2', level: 3 })).toBeInTheDocument()
      })
      const user = userEvent.setup()
      await user.click(screen.getAllByRole('button', { name: /Agregar al carrito/ })[1])
      await waitFor(() => {
        expect(createBookingHold).toHaveBeenCalledWith({
          property_id: 1,
          room_id: 2,
          room_type: 'Room 2',
          user_id: '99',
          check_in: '2026-05-01',
          check_out: '2026-05-04',
          units: 2,
          guest_count: 2,
        })
      })
    })

    it('calls createBookingHold, creates batch and navigates to checkout when selecting', async () => {
      seedAuthSession(99)
      mockFetch(MOCK_HOTEL)
      renderWithSearchUrl('checkIn=2026-05-01&checkOut=2026-05-04&adults=2&children=0&rooms=1')
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Room 3', level: 3 })).toBeInTheDocument()
      })
      const user = userEvent.setup()
      await user.click(screen.getAllByRole('button', { name: 'Seleccionar' })[2])
      await waitFor(() => {
        expect(createBookingHold).toHaveBeenCalledWith({
          property_id: 1,
          room_id: 3,
          room_type: 'Room 3',
          user_id: '99',
          check_in: '2026-05-01',
          check_out: '2026-05-04',
          units: 1,
          guest_count: 2,
        })
        expect(createBookingBatch).toHaveBeenCalledWith({
          user_id: '99',
          booking_ids: ['b1'],
        })
        expect(navigateMock).toHaveBeenCalledWith(
          '/checkout?bookingId=batch-1&entry=select',
          expect.objectContaining({
            state: expect.objectContaining({
              checkoutFallbackLineItems: expect.arrayContaining([
                expect.objectContaining({
                  id: 'b1',
                  name: 'hotel Cartagena #1 · Room 3',
                }),
              ]),
            }),
          }),
        )
      })
    })

    it('select for checkout keeps existing cart and navigates with batch id', async () => {
      seedAuthSession(99)
      const lineA = {
        bookingId: 'cart-a',
        roomId: 9,
        hotelName: 'Otro hotel',
        roomName: 'Hab A',
        image: 'https://example.com/a.jpg',
        amount: 100_000,
        currency: 'COP',
        checkIn: '2026-05-01',
        checkOut: '2026-05-04',
      }
      const lineB = { ...lineA, bookingId: 'cart-b', roomName: 'Hab B' }
      localStorage.setItem(cartStorageKey(99), JSON.stringify([lineA, lineB]))
      mockFetch(MOCK_HOTEL)
      renderWithSearchUrl('checkIn=2026-05-01&checkOut=2026-05-04&adults=2&children=0&rooms=1')
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Room 1', level: 3 })).toBeInTheDocument()
      })
      const user = userEvent.setup()
      await user.click(screen.getAllByRole('button', { name: 'Seleccionar' })[0])
      await waitFor(() => {
        expect(createBookingBatch).toHaveBeenCalledWith({
          user_id: '99',
          booking_ids: ['b1'],
        })
        expect(navigateMock).toHaveBeenCalledWith(
          '/checkout?bookingId=batch-1&entry=select',
          expect.any(Object),
        )
        const cartRaw = localStorage.getItem(cartStorageKey(99))
        expect(cartRaw).toBeTruthy()
        const cart = JSON.parse(cartRaw as string) as { bookingId: string }[]
        expect(cart.map((x) => x.bookingId)).toEqual(['cart-a', 'cart-b'])
      })
    })
  })

  describe('id lock', () => {
    it('uses the sessionStorage-locked id instead of the URL param on reload', async () => {
      sessionStorage.setItem('accommodation-id-lock', '42')
      const spy = vi.spyOn(accommodationService, 'getHotelById').mockResolvedValue(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith('42', expect.anything())
      })
    })

    it('stores the URL id in sessionStorage on first visit', async () => {
      vi.spyOn(accommodationService, 'getHotelById').mockResolvedValue(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(sessionStorage.getItem('accommodation-id-lock')).toBe('1')
      })
    })
  })

  describe('search params', () => {
    it('passes adults from URL to the service', async () => {
      const spy = vi.spyOn(accommodationService, 'getHotelById').mockResolvedValue(MOCK_HOTEL)
      renderWithSearchUrl('destination=Bogotá&checkIn=2026-05-01&checkOut=2026-05-04&adults=2&children=0&rooms=1')
      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith('1', expect.objectContaining({ adults: 2 }))
      })
    })

    it('passes checkIn and checkOut from URL to the service', async () => {
      const spy = vi.spyOn(accommodationService, 'getHotelById').mockResolvedValue(MOCK_HOTEL)
      renderWithSearchUrl('destination=Bogotá&checkIn=2026-05-01&checkOut=2026-05-04&adults=2&children=0&rooms=1')
      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith('1', expect.objectContaining({
          checkIn: '2026-05-01',
          checkOut: '2026-05-04',
        }))
      })
    })

    it('passes undefined checkIn/checkOut when not present in URL', async () => {
      const spy = vi.spyOn(accommodationService, 'getHotelById').mockResolvedValue(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith('1', expect.objectContaining({
          checkIn: undefined,
          checkOut: undefined,
        }))
      })
    })
  })

  describe('i18n', () => {
    it('renders section headings in English when language is en-US', async () => {
      localStorage.setItem('travel-hub-country', 'us')
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Amenities', level: 2 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Schedule', level: 2 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Rooms', level: 2 })).toBeInTheDocument()
      })
    })

    it('renders action buttons in English when language is en-US', async () => {
      localStorage.setItem('travel-hub-country', 'us')
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'View rooms' })).toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: 'Select' }).length).toBe(3)
        expect(screen.getAllByRole('button', { name: /Add to cart/ }).length).toBe(3)
      })
    })

    it('renders schedule in English when language is en-US', async () => {
      localStorage.setItem('travel-hub-country', 'us')
      mockFetch(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(screen.getByText('Check in: from 15:00 to 23:59')).toBeInTheDocument()
        expect(screen.getByText('Check out: 13:00')).toBeInTheDocument()
      })
    })
  })
})
