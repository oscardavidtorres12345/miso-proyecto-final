import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import AccommodationDetail from '@/pages/AccommodationDetail'
import { renderWithProviders } from '../renderWithProviders'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useParams: () => ({ id: '1' }) }
})

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
  vi.restoreAllMocks()
})

describe('AccommodationDetail', () => {
  describe('rendering', () => {
    it('renders the hotel name heading', () => {
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByRole('heading', { name: 'Aonang Villa Resort', level: 1 })).toBeInTheDocument()
    })

    it('renders 5 gallery images', () => {
      renderWithProviders(<AccommodationDetail />)
      const images = screen.getAllByRole('img')
      const galleryImages = images.filter((img) =>
        (img as HTMLImageElement).src.includes('picsum.photos/seed/hotel1')
      )
      expect(galleryImages.length).toBe(5)
    })

    it('renders the hotel description', () => {
      renderWithProviders(<AccommodationDetail />)
      const desc = document.querySelector('.accommodation-detail__description')
      expect(desc).toBeInTheDocument()
      expect(desc?.textContent).toMatch(/Lorem Ipsum is simply dummy text of the printing/)
    })

    it('renders 5 star elements', () => {
      renderWithProviders(<AccommodationDetail />)
      // 4 filled stars + 1 empty, all rendered as SVG inside star container
      const starContainer = document.querySelector('.accommodation-detail__stars')
      expect(starContainer?.querySelectorAll('svg').length).toBe(5)
    })

    it('renders the amenities section heading', () => {
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByRole('heading', { name: 'Amenidades', level: 2 })).toBeInTheDocument()
    })

    it('renders the schedule section heading', () => {
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByRole('heading', { name: 'Horarios', level: 2 })).toBeInTheDocument()
    })

    it('renders the rooms section heading', () => {
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByRole('heading', { name: 'Habitaciones', level: 2 })).toBeInTheDocument()
    })

    it('renders check-in schedule', () => {
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByText('Check in: de 15:00 a 23:59')).toBeInTheDocument()
    })

    it('renders check-out schedule', () => {
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByText('Check out: 13:00')).toBeInTheDocument()
    })
  })

  describe('pricing widget', () => {
    it('renders the featured room name in the widget', () => {
      renderWithProviders(<AccommodationDetail />)
      const widgetRoom = document.querySelector('.accommodation-detail__widget-room')
      expect(widgetRoom).toHaveTextContent('Suite Junior')
    })

    it('renders the breakfast badge in the widget', () => {
      renderWithProviders(<AccommodationDetail />)
      const pill = document.querySelector('.accommodation-detail__widget-pill')
      expect(pill).toBeInTheDocument()
      expect(pill).toHaveTextContent('Desayuno')
    })

    it('renders nights and adults in the widget', () => {
      renderWithProviders(<AccommodationDetail />)
      const nights = document.querySelector('.accommodation-detail__widget-nights')
      expect(nights).toHaveTextContent('24 noches, 2 adultos')
    })

    it('renders the featured price in the widget', () => {
      renderWithProviders(<AccommodationDetail />)
      const amount = document.querySelector('.accommodation-detail__widget-price-amount')
      expect(amount).toHaveTextContent('5.000.000')
    })

    it('renders the "Ver habitaciones" button', () => {
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByRole('button', { name: 'Ver habitaciones' })).toBeInTheDocument()
    })
  })

  describe('rooms', () => {
    it('renders 3 room cards', () => {
      renderWithProviders(<AccommodationDetail />)
      const cards = document.querySelectorAll('.accommodation-detail__room-card')
      expect(cards.length).toBe(3)
    })

    it('renders room names', () => {
      renderWithProviders(<AccommodationDetail />)
      const names = screen.getAllByRole('heading', { name: 'Suite Junior', level: 3 })
      expect(names.length).toBe(3)
    })

    it('renders per-night price for each room', () => {
      renderWithProviders(<AccommodationDetail />)
      // 5000000 / 24 = 208333
      const perNightPrices = screen.getAllByText(/208\.333/)
      expect(perNightPrices.length).toBe(3)
    })

    it('renders "Seleccionar" buttons', () => {
      renderWithProviders(<AccommodationDetail />)
      const selectBtns = screen.getAllByRole('button', { name: 'Seleccionar' })
      expect(selectBtns.length).toBe(3)
    })

    it('renders "Agregar al carrito" buttons', () => {
      renderWithProviders(<AccommodationDetail />)
      const cartBtns = screen.getAllByRole('button', { name: /Agregar al carrito/ })
      expect(cartBtns.length).toBe(3)
    })
  })

  describe('i18n', () => {
    it('renders section headings in English when language is en-US', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByRole('heading', { name: 'Amenities', level: 2 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Schedule', level: 2 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Rooms', level: 2 })).toBeInTheDocument()
    })

    it('renders action buttons in English when language is en-US', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByRole('button', { name: 'View rooms' })).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Select' }).length).toBe(3)
      expect(screen.getAllByRole('button', { name: /Add to cart/ }).length).toBe(3)
    })

    it('renders schedule in English when language is en-US', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderWithProviders(<AccommodationDetail />)
      expect(screen.getByText('Check in: from 15:00 to 23:59')).toBeInTheDocument()
      expect(screen.getByText('Check out: 13:00')).toBeInTheDocument()
    })
  })
})
