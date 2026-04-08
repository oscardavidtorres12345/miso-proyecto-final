import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SearchResults from '@/pages/SearchResults'
import { AuthProvider } from '@/context/AuthContext'
import { I18nProvider } from '@/context/I18nContext'
import { SearchProvider } from '@/context/SearchContext'
import * as searchService from '@/services/searchService'
import type { Accommodation } from '@/types/accommodation'

vi.mock('@/services/searchService', () => ({
  getSearchFilters: vi.fn(),
  getSearchProperties: vi.fn(),
}))

vi.mock('@/constants/app', () => ({
  FILTER_INPUT_DEBOUNCE_MS: 0,
  FILTER_GROUP_VISIBLE_OPTIONS_STEP: 6,
  FILTER_GROUP_SEARCH_MIN_OPTIONS: 6,
}))

const mockAccommodation: Accommodation = {
  id: 99,
  name: 'Hotel Cobertura',
  image: 'https://example.com/h.jpg',
  distanceFromCenter: 1,
  stars: 4,
  rating: { score: 9, reviewCount: 10 },
  amenities: [{ id: 'wifi' }],
  hasBreakfast: false,
  price: {
    amount: 300_000,
    currency: 'COP',
    nights: 2,
    adults: 2,
    includesTaxes: true,
  },
}

const filtersResponse = {
  services: [{ id: 'wifi' }],
  accommodationTypes: [{ id: 'hotel' }],
  meals: [{ id: 'breakfast' }],
  stars: [{ id: '4' }],
}

const emptyProperties = {
  results: [] as Accommodation[],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
}

const withResults = (pages = 1) => ({
  results: [mockAccommodation],
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: pages,
})

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/search']}>
      <I18nProvider>
        <AuthProvider>
          <SearchProvider>
            <Routes>
              <Route path="/search" element={<SearchResults />} />
            </Routes>
          </SearchProvider>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  )

describe('SearchResults', () => {
  const getSearchFilters = vi.mocked(searchService.getSearchFilters)
  const getSearchProperties = vi.mocked(searchService.getSearchProperties)

  beforeEach(() => {
    window.scrollTo = vi.fn() as typeof window.scrollTo
    getSearchFilters.mockResolvedValue(filtersResponse)
    getSearchProperties.mockResolvedValue(withResults(1))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads filters and shows results when properties return data', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hotel Cobertura' })).toBeInTheDocument()
    })
    expect(getSearchFilters).toHaveBeenCalled()
    expect(getSearchProperties).toHaveBeenCalled()
  })

  it('shows empty message when there are no results', async () => {
    getSearchProperties.mockResolvedValue(emptyProperties)
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText(/no hay resultados/i)
      ).toBeInTheDocument()
    })
  })

  it('handles filters API failure with empty options', async () => {
    getSearchFilters.mockRejectedValueOnce(new Error('network'))
    getSearchProperties.mockResolvedValue(withResults(1))
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hotel Cobertura' })).toBeInTheDocument()
    })
  })

  it('handles properties API failure', async () => {
    getSearchProperties.mockRejectedValue(new Error('network'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/no hay resultados/i)).toBeInTheDocument()
    })
  })

  it('changes page and scrolls to top', async () => {
    const user = userEvent.setup()
    getSearchProperties.mockResolvedValue(withResults(3))
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hotel Cobertura' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Ir a página 2' }))
    await waitFor(() => {
      expect(getSearchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      )
    })
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('opens filter sheet, applies draft filters and clears them', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hotel Cobertura' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    const sheet = document.querySelector('.sub-view.sub-view--open')
    expect(sheet).toBeTruthy()
    const withinSheet = within(sheet as HTMLElement)

    const minInputs = withinSheet.getAllByRole('textbox')
    await user.clear(minInputs[0])
    await user.type(minInputs[0], '100')

    await user.click(withinSheet.getByRole('button', { name: 'Aplicar' }))
    await waitFor(() => {
      expect(getSearchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ priceMin: 100 })
      )
    })

    const clearButtons = screen.getAllByRole('button', { name: 'Limpiar filtros' })
    await user.click(clearButtons[0])
    await waitFor(() => {
      expect(getSearchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ priceMin: undefined, priceMax: undefined })
      )
    })
  })

  it('cancels filter sheet without applying', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hotel Cobertura' })).toBeInTheDocument()
    })
    const callsAfterLoad = getSearchProperties.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    const sheet = document.querySelector('.sub-view.sub-view--open') as HTMLElement
    const minInputs = within(sheet).getAllByRole('textbox')
    await user.type(minInputs[0], '999')

    await user.click(within(sheet).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(document.querySelector('.sub-view.sub-view--open')).toBeNull()
    })

    expect(getSearchProperties.mock.calls.length).toBe(callsAfterLoad)
  })
})
