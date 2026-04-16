import { useState } from 'react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import type { DateRange } from 'react-day-picker'
import SearchBottomSheet from '@/components/SearchBottomSheet'
import { GUESTS_DEFAULTS } from '@/types/search'
import type { CommittedSearchPayload, Guests } from '@/types/search'
import { renderWithProviders } from '../renderWithProviders'

vi.mock('@/components/DateRangePicker', () => ({
  default: ({ onChange }: { onChange: (r: DateRange | undefined) => void }) => (
    <div>
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
      <button
        type="button"
        data-testid="mock-pick-partial"
        onClick={() => onChange({ from: new Date(2025, 2, 1), to: undefined })}
      >
        pick-partial
      </button>
    </div>
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

function DraftHarness({
  onClose = vi.fn(),
  onDraftCommit = vi.fn(),
  initialDestination = '',
  initialDateRange = undefined as DateRange | undefined,
  initialGuests = GUESTS_DEFAULTS,
}: {
  onClose?: () => void
  onDraftCommit?: (payload: CommittedSearchPayload) => void
  initialDestination?: string
  initialDateRange?: DateRange | undefined
  initialGuests?: Guests
}) {
  const [destination, setDestination] = useState(initialDestination)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange)
  const [guests, setGuests] = useState<Guests>(initialGuests)
  return (
    <SearchBottomSheet
      isOpen
      variant="draft"
      onClose={onClose}
      onDraftCommit={onDraftCommit}
      destination={destination}
      setDestination={setDestination}
      dateRange={dateRange}
      setDateRange={setDateRange}
      guests={guests}
      setGuests={setGuests}
    />
  )
}

function DraftReopenHarness({
  onDraftCommit = vi.fn(),
}: {
  onDraftCommit?: (payload: CommittedSearchPayload) => void
}) {
  const [open, setOpen] = useState(false)
  const [destination] = useState('CiudadSemilla')
  const [dateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 4, 1),
    to: new Date(2025, 4, 5),
  })
  const [guests] = useState<Guests>({ ...GUESTS_DEFAULTS, adults: 4 })

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open-draft
      </button>
      <SearchBottomSheet
        isOpen={open}
        variant="draft"
        onClose={() => setOpen(false)}
        onDraftCommit={onDraftCommit}
        destination={destination}
        setDestination={() => {}}
        dateRange={dateRange}
        setDateRange={() => {}}
        guests={guests}
        setGuests={() => {}}
      />
    </>
  )
}

const openDatesField = async (user: ReturnType<typeof userEvent.setup>) => {
  const label = screen.getAllByText('Fechas')[0]
  const row = label.closest('.search-sheet__field--tap')
  expect(row).toBeTruthy()
  await user.click(row!)
}

const openGuestsField = async (user: ReturnType<typeof userEvent.setup>) => {
  const sheet = document.querySelector('.search-sheet')
  expect(sheet).toBeTruthy()
  const label = within(sheet as HTMLElement).getByText('Quién')
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

  it('keeps search disabled when only start date is selected (no end date)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.type(screen.getByPlaceholderText('¿Adónde vas?'), 'Armenia')
    await openDatesField(user)
    await user.click(screen.getByTestId('mock-pick-partial'))
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Aplicar' }))

    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled()
  })

  it('live mode shows guest placeholder until guests subview is applied', () => {
    renderWithProviders(<Harness />)
    expect(screen.queryByText('2 huéspedes')).not.toBeInTheDocument()
    expect(screen.getAllByText('¿Cuántos?').length).toBeGreaterThanOrEqual(1)
  })

  it('returns from guests subview on cancel', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await openGuestsField(user)
    expect(document.querySelector('.sub-view.sub-view--open')).toBeTruthy()
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Cancelar' }))
    expect(document.querySelector('.sub-view.sub-view--open')).toBeNull()
  })

  it('draft mode seeds snapshot from props and shows guest count without applying guests', () => {
    renderWithProviders(
      <DraftHarness
        initialDestination="Cartagena"
        initialDateRange={{ from: new Date(2025, 6, 10), to: new Date(2025, 6, 15) }}
        initialGuests={{ adults: 3, children: 0, rooms: 1, pets: false }}
      />,
    )

    expect(screen.getByDisplayValue('Cartagena')).toBeInTheDocument()
    expect(screen.getByText('3 huéspedes')).toBeInTheDocument()
  })

  it('draft mode calls onDraftCommit and onClose with draft payload when search is valid', async () => {
    const user = userEvent.setup()
    const onDraftCommit = vi.fn()
    const onClose = vi.fn()
    renderWithProviders(<DraftHarness onDraftCommit={onDraftCommit} onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('¿Adónde vas?'), 'Pereira')
    await openDatesField(user)
    await user.click(screen.getByTestId('mock-pick-range'))
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Aplicar' }))

    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(onDraftCommit).toHaveBeenCalledTimes(1)
    expect(onDraftCommit.mock.calls[0][0]).toMatchObject({
      destination: 'Pereira',
      dateRange: { from: new Date(2025, 2, 1), to: new Date(2025, 2, 8) },
      guests: GUESTS_DEFAULTS,
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('draft mode without onDraftCommit falls back to onSearch when search is valid', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    renderWithProviders(
      <SearchBottomSheet
        isOpen
        variant="draft"
        onClose={vi.fn()}
        onSearch={onSearch}
        destination=""
        setDestination={vi.fn()}
        dateRange={undefined}
        setDateRange={vi.fn()}
        guests={GUESTS_DEFAULTS}
        setGuests={vi.fn()}
      />,
    )

    await user.type(screen.getByPlaceholderText('¿Adónde vas?'), 'Neiva')
    await openDatesField(user)
    await user.click(screen.getByTestId('mock-pick-range'))
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Aplicar' }))

    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('re-seeds draft when sheet opens after being closed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DraftReopenHarness />)

    await user.click(screen.getByRole('button', { name: 'open-draft' }))
    expect(await screen.findByDisplayValue('CiudadSemilla')).toBeInTheDocument()
    expect(screen.getByText('4 huéspedes')).toBeInTheDocument()
  })

  it('draft mode persists guest edits from subview into committed payload', async () => {
    const user = userEvent.setup()
    const onDraftCommit = vi.fn()
    renderWithProviders(<DraftHarness onDraftCommit={onDraftCommit} />)

    await user.type(screen.getByPlaceholderText('¿Adónde vas?'), 'Ibagué')
    await openDatesField(user)
    await user.click(screen.getByTestId('mock-pick-range'))
    await user.click(within(getOpenSubView()).getByRole('button', { name: 'Aplicar' }))

    await openGuestsField(user)
    const sub = within(getOpenSubView())
    const adultsRow = sub.getByText('Adultos').closest('.flex.items-center.justify-between')
    expect(adultsRow).toBeTruthy()
    const adultRowButtons = within(adultsRow as HTMLElement).getAllByRole('button')
    await user.click(adultRowButtons[1])
    await user.click(sub.getByRole('button', { name: 'Aplicar' }))

    expect(screen.getByText('3 huéspedes')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onDraftCommit.mock.calls[0][0].guests.adults).toBe(3)
  })
})
