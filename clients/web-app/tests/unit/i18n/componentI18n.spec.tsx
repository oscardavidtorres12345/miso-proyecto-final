import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Footer from '@/components/Footer'
import FeaturesSection from '@/components/FeaturesSection'
import HeroSection from '@/components/HeroSection'
import Sidebar from '@/components/Sidebar'
import TravelSection from '@/components/TravelSection'
import GuestsDropdown from '@/components/GuestsDropdown'
import DestinationInput from '@/components/DestinationInput'
import PopularDestinationsSection from '@/components/PopularDestinationsSection'
import type { Guests } from '@/types/search'
import { renderWithProviders } from '../renderWithProviders'

// I18nProvider reads localStorage on mount to set the language.
// Mapping locale → country code mirrors LANGUAGE_MAP in src/i18n/index.ts.
const LOCALE_COUNTRY: Record<string, string> = {
  'es-CO': 'co',
  'es-AR': 'ar',
  'en-US': 'us',
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-05-11T12:00:00Z'))
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

const renderInLocale = (locale: string, ui: React.ReactElement) => {
  localStorage.setItem('travel-hub-country', LOCALE_COUNTRY[locale])
  return renderWithProviders(ui)
}

// ─── Footer ──────────────────────────────────────────────────────────────────

describe('Footer i18n', () => {
  it('renders es-CO text by default', () => {
    renderWithProviders(<Footer />)
    expect(screen.getByText('Hecho con amor 💚')).toBeInTheDocument()
  })

  it('renders en-US text after language change', () => {
    renderInLocale('en-US', <Footer />)
    expect(screen.getByText('Made with love 💚')).toBeInTheDocument()
  })

  it('renders es-AR text (same as es-CO for footer)', () => {
    renderInLocale('es-AR', <Footer />)
    expect(screen.getByText('Hecho con amor 💚')).toBeInTheDocument()
  })

  it('snapshot: es-CO', () => {
    const { container } = renderWithProviders(<Footer />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: en-US', () => {
    const { container } = renderInLocale('en-US', <Footer />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: es-AR', () => {
    const { container } = renderInLocale('es-AR', <Footer />)
    expect(container).toMatchSnapshot()
  })
})

// ─── FeaturesSection ─────────────────────────────────────────────────────────

describe('FeaturesSection i18n', () => {
  it('renders all feature titles in es-CO', () => {
    renderWithProviders(<FeaturesSection />)
    expect(screen.getByRole('heading', { name: 'Reservas seguras' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mejores precios' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cancelación flexible' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paga en pesos colombianos' })).toBeInTheDocument()
  })

  it('renders all feature titles in en-US', () => {
    renderInLocale('en-US', <FeaturesSection />)
    expect(screen.getByRole('heading', { name: 'Secure bookings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Best prices' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Flexible cancellation' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pay in US dollars' })).toBeInTheDocument()
  })

  it('renders Argentina-specific currency title in es-AR', () => {
    renderInLocale('es-AR', <FeaturesSection />)
    expect(screen.getByRole('heading', { name: 'Pagá en pesos argentinos' })).toBeInTheDocument()
  })

  it('renders Argentina-specific feature descriptions in es-AR', () => {
    renderInLocale('es-AR', <FeaturesSection />)
    expect(screen.getByText(/Reservá con total confianza/i)).toBeInTheDocument()
    expect(screen.getByText(/Ve los precios en ARS/i)).toBeInTheDocument()
  })

  it('renders Colombia-specific feature descriptions in es-CO', () => {
    renderWithProviders(<FeaturesSection />)
    expect(screen.getByText(/Reserva con total confianza/i)).toBeInTheDocument()
    expect(screen.getByText(/Ve los precios en COP/i)).toBeInTheDocument()
  })

  it('feature titles differ between en-US and es-CO', () => {
    const { unmount } = renderWithProviders(<FeaturesSection />)
    const esTitles = screen
      .getAllByRole('heading')
      .map((el) => el.textContent)
    unmount()

    renderInLocale('en-US', <FeaturesSection />)
    const enTitles = screen
      .getAllByRole('heading')
      .map((el) => el.textContent)

    expect(esTitles).not.toEqual(enTitles)
  })

  it('snapshot: es-CO', () => {
    const { container } = renderWithProviders(<FeaturesSection />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: en-US', () => {
    const { container } = renderInLocale('en-US', <FeaturesSection />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: es-AR', () => {
    const { container } = renderInLocale('es-AR', <FeaturesSection />)
    expect(container).toMatchSnapshot()
  })
})

// ─── HeroSection ─────────────────────────────────────────────────────────────

describe('HeroSection i18n', () => {
  it('renders subtitle and title in es-CO', () => {
    renderWithProviders(<HeroSection />)
    expect(screen.getByText('Descubre tus próximas vacaciones')).toBeInTheDocument()
    expect(screen.getByText('La vida es corta y el mundo es gigante.')).toBeInTheDocument()
  })

  it('renders subtitle and title in en-US', () => {
    renderInLocale('en-US', <HeroSection />)
    expect(screen.getByText('Discover your next vacation')).toBeInTheDocument()
    expect(screen.getByText('Life is short and the world is giant.')).toBeInTheDocument()
  })

  it('renders Argentina-specific subtitle in es-AR', () => {
    renderInLocale('es-AR', <HeroSection />)
    expect(screen.getByText('Descubrí tus próximas vacaciones')).toBeInTheDocument()
    expect(screen.getByText('La vida es corta y el mundo es gigante.')).toBeInTheDocument()
  })

  it('hero text differs between en-US and es-CO', () => {
    const { unmount } = renderWithProviders(<HeroSection />)
    const esSubtitle = screen.getByText('Descubre tus próximas vacaciones').textContent
    unmount()

    renderInLocale('en-US', <HeroSection />)
    const enSubtitle = screen.getByText('Discover your next vacation').textContent

    expect(esSubtitle).not.toBe(enSubtitle)
  })

  it('snapshot: es-CO', () => {
    const { container } = renderWithProviders(<HeroSection />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: en-US', () => {
    const { container } = renderInLocale('en-US', <HeroSection />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: es-AR', () => {
    const { container } = renderInLocale('es-AR', <HeroSection />)
    expect(container).toMatchSnapshot()
  })
})

// ─── Sidebar ─────────────────────────────────────────────────────────────────

describe('Sidebar i18n', () => {
  it('renders nav items in es-CO', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Reporte mensual')).toBeInTheDocument()
    expect(screen.getByText('Gestión de tarifas')).toBeInTheDocument()
    expect(screen.getByText('Reservas')).toBeInTheDocument()
  })

  it('renders nav items in en-US', () => {
    renderInLocale('en-US', <Sidebar />)
    expect(screen.getByText('Monthly report')).toBeInTheDocument()
    expect(screen.getByText('Rate management')).toBeInTheDocument()
    expect(screen.getByText('Reservations')).toBeInTheDocument()
  })

  it('nav labels differ between en-US and es-CO', () => {
    const { unmount } = renderWithProviders(<Sidebar />)
    const esLabel = screen.getByText('Reporte mensual').textContent
    unmount()

    renderInLocale('en-US', <Sidebar />)
    const enLabel = screen.getByText('Monthly report').textContent
    expect(esLabel).not.toBe(enLabel)
  })

  it('snapshot: es-CO', () => {
    const { container } = renderWithProviders(<Sidebar />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: en-US', () => {
    const { container } = renderInLocale('en-US', <Sidebar />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: es-AR', () => {
    const { container } = renderInLocale('es-AR', <Sidebar />)
    expect(container).toMatchSnapshot()
  })
})

// ─── TravelSection ───────────────────────────────────────────────────────────

describe('TravelSection i18n', () => {
  it('renders heading and label in es-CO', () => {
    renderWithProviders(<TravelSection />)
    expect(screen.getByText('Punto de viaje')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Te ayudamos a encontrar las vacaciones de tus sueños' })).toBeInTheDocument()
  })

  it('renders heading and label in en-US', () => {
    renderInLocale('en-US', <TravelSection />)
    expect(screen.getByText('Travel point')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'We help you find your dream vacation' })).toBeInTheDocument()
  })

  it('renders Argentina-specific description with voseo in es-AR', () => {
    renderInLocale('es-AR', <TravelSection />)
    expect(screen.getByText(/Descubrí nuevos horizontes/i)).toBeInTheDocument()
  })

  it('renders image alt texts in es-CO', () => {
    renderWithProviders(<TravelSection />)
    expect(screen.getByAltText('Aventura en montaña')).toBeInTheDocument()
    expect(screen.getByAltText('Destino de mar')).toBeInTheDocument()
  })

  it('renders image alt texts in en-US', () => {
    renderInLocale('en-US', <TravelSection />)
    expect(screen.getByAltText('Mountain adventure')).toBeInTheDocument()
    expect(screen.getByAltText('Beach destination')).toBeInTheDocument()
  })

  it('snapshot: es-CO', () => {
    const { container } = renderWithProviders(<TravelSection />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: en-US', () => {
    const { container } = renderInLocale('en-US', <TravelSection />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: es-AR', () => {
    const { container } = renderInLocale('es-AR', <TravelSection />)
    expect(container).toMatchSnapshot()
  })
})

// ─── PopularDestinationsSection ──────────────────────────────────────────────

describe('PopularDestinationsSection i18n', () => {
  it('renders section label and heading in es-CO', () => {
    renderWithProviders(<PopularDestinationsSection />)
    expect(screen.getByText('Destinos populares')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Descubre destinos populares' })).toBeInTheDocument()
  })

  it('renders section label and heading in en-US', () => {
    renderInLocale('en-US', <PopularDestinationsSection />)
    expect(screen.getByText('Popular destinations')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Discover popular destinations' })).toBeInTheDocument()
  })

  it('snapshot: es-CO', () => {
    const { container } = renderWithProviders(<PopularDestinationsSection />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: en-US', () => {
    const { container } = renderInLocale('en-US', <PopularDestinationsSection />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: es-AR', () => {
    const { container } = renderInLocale('es-AR', <PopularDestinationsSection />)
    expect(container).toMatchSnapshot()
  })
})

// ─── GuestsDropdown ──────────────────────────────────────────────────────────

const DEFAULT_GUESTS: Guests = { adults: 2, children: 0, rooms: 1, pets: false }
const SINGLE_GUEST: Guests = { adults: 1, children: 0, rooms: 1, pets: false }

describe('GuestsDropdown i18n', () => {
  it('renders "Who" label in en-US', () => {
    renderInLocale('en-US', <GuestsDropdown value={DEFAULT_GUESTS} onChange={() => {}} showValue />)
    expect(screen.getByText('Who')).toBeInTheDocument()
  })

  it('renders "¿Quién?" label in es-CO', () => {
    renderWithProviders(<GuestsDropdown value={DEFAULT_GUESTS} onChange={() => {}} showValue />)
    expect(screen.getByText('Quién')).toBeInTheDocument()
  })

  it('renders singular guest in en-US (count=1)', () => {
    renderInLocale('en-US', <GuestsDropdown value={SINGLE_GUEST} onChange={() => {}} showValue />)
    expect(screen.getByText('1 guest')).toBeInTheDocument()
  })

  it('renders plural guests in en-US (count=2)', () => {
    renderInLocale('en-US', <GuestsDropdown value={DEFAULT_GUESTS} onChange={() => {}} showValue />)
    expect(screen.getByText('2 guests')).toBeInTheDocument()
  })

  it('renders singular huésped in es-CO (count=1)', () => {
    renderWithProviders(<GuestsDropdown value={SINGLE_GUEST} onChange={() => {}} showValue />)
    expect(screen.getByText('1 huésped')).toBeInTheDocument()
  })

  it('renders plural huéspedes in es-CO (count=2)', () => {
    renderWithProviders(<GuestsDropdown value={DEFAULT_GUESTS} onChange={() => {}} showValue />)
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument()
  })

  it('renders singular huésped in es-AR (count=1)', () => {
    renderInLocale('es-AR', <GuestsDropdown value={SINGLE_GUEST} onChange={() => {}} showValue />)
    expect(screen.getByText('1 huésped')).toBeInTheDocument()
  })

  it('renders plural huéspedes in es-AR (count=2)', () => {
    renderInLocale('es-AR', <GuestsDropdown value={DEFAULT_GUESTS} onChange={() => {}} showValue />)
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument()
  })
})

// ─── DestinationInput ────────────────────────────────────────────────────────

describe('DestinationInput i18n', () => {
  it('renders label and placeholder in es-CO', () => {
    renderWithProviders(<DestinationInput value="" onChange={() => {}} />)
    expect(screen.getByText('Destino')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('¿Adónde vas?')).toBeInTheDocument()
  })

  it('renders label and placeholder in en-US', () => {
    renderInLocale('en-US', <DestinationInput value="" onChange={() => {}} />)
    expect(screen.getByText('Destination')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Where are you going?')).toBeInTheDocument()
  })

  it('renders label and placeholder in es-AR', () => {
    renderInLocale('es-AR', <DestinationInput value="" onChange={() => {}} />)
    expect(screen.getByText('Destino')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('¿Adónde vas?')).toBeInTheDocument()
  })

  it('snapshot: es-CO', () => {
    const { container } = renderWithProviders(<DestinationInput value="" onChange={() => {}} />)
    expect(container).toMatchSnapshot()
  })

  it('snapshot: en-US', () => {
    const { container } = renderInLocale('en-US', <DestinationInput value="" onChange={() => {}} />)
    expect(container).toMatchSnapshot()
  })
})
