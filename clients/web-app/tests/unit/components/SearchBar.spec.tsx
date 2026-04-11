import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DateRange } from 'react-day-picker'
import { describe, it, expect, vi } from 'vitest'
import SearchBar from '@/components/SearchBar'
import { GUESTS_DEFAULTS } from '@/types/search'
import { renderWithProviders } from '../renderWithProviders'

describe('SearchBar', () => {
  const baseProps = () => ({
    destination: '',
    setDestination: vi.fn(),
    dateRange: undefined as DateRange | undefined,
    setDateRange: vi.fn(),
    guests: GUESTS_DEFAULTS,
    setGuests: vi.fn(),
  })

  it('disables search button when destination or range is missing', () => {
    renderWithProviders(<SearchBar {...baseProps()} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('enables search button when destination and range are set', () => {
    renderWithProviders(
      <SearchBar
        {...baseProps()}
        destination="Bogotá"
        dateRange={{ from: new Date('2025-01-01'), to: new Date('2025-01-05') }}
      />
    )
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('calls onSearch when search is clicked', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    renderWithProviders(
      <SearchBar
        {...baseProps()}
        destination="Bogotá"
        dateRange={{ from: new Date('2025-01-01'), to: new Date('2025-01-05') }}
        onSearch={onSearch}
      />
    )
    await user.click(screen.getByRole('button'))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })
})
