import { useState } from 'react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import type { DateRange } from 'react-day-picker'
import SearchBottomSheet from '@/components/SearchBottomSheet'
import { GUESTS_DEFAULTS } from '@/types/search'
import type { Guests } from '@/types/search'
import { renderWithProviders } from '../renderWithProviders'

vi.mock('@/components/DateRangePicker', () => ({
  default: ({ onChange }: { onChange: (r: DateRange | undefined) => void }) => (
    <button
      type="button"
      data-testid="mock-pick-range"
      onClick={() =>
        onChange({
          from: new Date(2025, 2, 1),
          to: new Date(2025, 2, 8),
        })
      }
    >
      pick-range
    </button>
  ),
}))

function Harness({
  onClose = vi.fn(),
  onSearch,
}: {
  onClose?: () => void
  onSearch?: () => void
}) {
  const [destination, setDestination] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState<Guests>(GUESTS_DEFAULTS)
  return (
    <SearchBottomSheet
      isOpen
      onClose={onClose}
      onSearch={onSearch}
      destination={destination}
      setDestination={setDestination}
      dateRange={dateRange}
      setDateRange={setDateRange}
      guests={guests}
      setGuests={setGuests}
    />
  )
}

const openDatesField = async (user: ReturnType<typeof userEvent.setup>) => {
  const label = screen.getAllByText('Fechas')[0]
  const row = label.closest('.search-sheet__field--tap')
  expect(row).toBeTruthy()
  await user.click(row!)
}

const openGuestsField = async (user: ReturnType<typeof userEvent.setup>) => {
  const label = screen.getByText('¿Cuántos?')
  const row = label.closest('.search-sheet__field--tap')
  expect(row).toBeTruthy()
  await user.click(row!)
}

const getOpenSubView = () => {
  const el = document.querySelector('.sub-view.sub-view--open')
  expect(el).toBeTruthy()
  return el as HTMLElement
}

describe('SearchBottomSheet', () => {
  it('disables search until destination and full date range exist', () => {
    renderWithProviders(<Harness />)
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled()
  })

  it('enables search after filling destination and dates via subview', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.type(screen.getByPlaceholderText('¿Adónde vas?'), 'Santa Marta')
    await openDatesField(user)

    await user.click(screen.getByTestId('mock-pick-range'))
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Aplicar' }))

    expect(screen.getByRole('button', { name: 'Buscar' })).not.toBeDisabled()
  })

  it('calls onSearch when search is valid', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    renderWithProviders(<Harness onSearch={onSearch} />)

    await user.type(screen.getByPlaceholderText('¿Adónde vas?'), 'Cali')
    await openDatesField(user)
    await user.click(screen.getByTestId('mock-pick-range'))
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Aplicar' }))

    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('uses onClose as search action when onSearch is omitted', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<Harness onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('¿Adónde vas?'), 'Pasto')
    await openDatesField(user)
    await user.click(screen.getByTestId('mock-pick-range'))
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Aplicar' }))

    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows guest count after applying guests subview', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await openGuestsField(user)
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Aplicar' }))

    expect(screen.getByText('2 huéspedes')).toBeInTheDocument()
  })

  it('returns from dates subview on cancel', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await openDatesField(user)
    expect(document.querySelector('.sub-view.sub-view--open')).toBeTruthy()
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Cancelar' }))
    expect(document.querySelector('.sub-view.sub-view--open')).toBeNull()
  })
})
