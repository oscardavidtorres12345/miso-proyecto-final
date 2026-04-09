import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SearchFilterPanel from '@/components/SearchFilterPanel'
import { renderWithProviders } from '../renderWithProviders'
import { GUESTS_DEFAULTS } from '@/types/search'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

const mockSearch = vi.hoisted(() => ({
  destination: '',
  setDestination: vi.fn(),
  dateRange: undefined as { from?: Date; to?: Date } | undefined,
  setDateRange: vi.fn(),
  guests: { adults: 2, children: 0, rooms: 1, pets: false },
  setGuests: vi.fn(),
}))

vi.mock('@/context/SearchContext', async () => {
  const actual = await vi.importActual<typeof import('@/context/SearchContext')>('@/context/SearchContext')
  return {
    ...actual,
    useSearch: () => mockSearch,
  }
})

describe('SearchFilterPanel', () => {
  beforeEach(() => {
    navigate.mockClear()
    mockSearch.destination = ''
    mockSearch.dateRange = undefined
    mockSearch.guests = { ...GUESTS_DEFAULTS }
  })

  it('renders panel title', () => {
    renderWithProviders(<SearchFilterPanel />)
    expect(screen.getByRole('heading', { name: 'Alojamientos' })).toBeInTheDocument()
  })

  it('disables search button when destination or dates are incomplete', () => {
    renderWithProviders(<SearchFilterPanel />)
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled()
  })

  it('navigates to /search when search is enabled and button is clicked', async () => {
    const user = userEvent.setup()
    const from = new Date('2025-06-01')
    const to = new Date('2025-06-05')
    mockSearch.destination = 'Cartagena'
    mockSearch.dateRange = { from, to }

    renderWithProviders(<SearchFilterPanel />)
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(navigate).toHaveBeenCalledWith('/search')
  })
})
