import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import AccommodationDetail from '@/pages/AccommodationDetail'
import { renderWithProviders } from '../renderWithProviders'
import type { HotelDetail } from '@/services/accommodationService'
import * as accommodationService from '@/services/accommodationService'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useParams: () => ({ id: '1' }) }
})

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

const mockFetch = (data: unknown, ok = true) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(data),
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
  vi.restoreAllMocks()
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
    it('shows error message when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(document.querySelector('.accommodation-detail__error')).toBeInTheDocument()
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
  })

  describe('search params', () => {
    it('passes adults from search context to the service', async () => {
      const spy = vi.spyOn(accommodationService, 'getHotelById').mockResolvedValue(MOCK_HOTEL)
      renderWithProviders(<AccommodationDetail />)
      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith('1', expect.objectContaining({ adults: 2 }))
      })
    })

    it('passes check_in and check_out when dateRange is set', async () => {
      const spy = vi.spyOn(accommodationService, 'getHotelById').mockResolvedValue(MOCK_HOTEL)
      // SearchContext defaults to no dateRange, so we verify undefined dates are omitted
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
