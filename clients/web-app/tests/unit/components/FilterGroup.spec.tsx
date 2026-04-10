import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import FilterGroup from '@/components/FilterGroup'

vi.mock('@/constants/app', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants/app')>()
  return {
    ...actual,
    FILTER_INPUT_DEBOUNCE_MS: 0,
  }
})
import { renderWithProviders } from '../renderWithProviders'

const options = [
  { id: 'a', label: 'Opción A' },
  { id: 'b', label: 'Opción B' },
  { id: 'c', label: 'Opción C' },
]

describe('FilterGroup', () => {
  it('renders title and options', () => {
    renderWithProviders(<FilterGroup title="Servicios" options={options} collapsible={false} />)
    expect(screen.getByText('Servicios')).toBeInTheDocument()
    expect(screen.getByLabelText('Opción A')).toBeInTheDocument()
  })

  it('notifies onChange when toggling a checkbox (controlled)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <FilterGroup title="Filtro" options={options} selected={[]} onChange={onChange} collapsible={false} pageSize={10} />
    )
    await user.click(screen.getByLabelText('Opción A'))
    expect(onChange).toHaveBeenCalledWith(['a'])
  })

  it('expands and collapses when header is clicked (collapsible)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterGroup title="Tipo" options={options} defaultOpen />)
    const header = screen.getByRole('button', { name: /Tipo/i })
    expect(header).toHaveAttribute('aria-expanded', 'true')
    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows Ver más when there are more options than pageSize', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ id: `o${i}`, label: `Item ${i}` }))
    renderWithProviders(
      <FilterGroup title="Lista" options={many} collapsible={false} pageSize={6} />
    )
    expect(screen.getByRole('button', { name: /Ver más/i })).toBeInTheDocument()
  })

  it('expands and collapses visible options with Ver más / Ver menos', async () => {
    const user = userEvent.setup()
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `o${i}`, label: `Opt ${i}` }))
    renderWithProviders(
      <FilterGroup title="Cat" options={many} collapsible={false} pageSize={4} />
    )
    expect(screen.queryByLabelText('Opt 6')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ver más/i }))
    expect(screen.getByLabelText('Opt 6')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ver menos/i }))
    expect(screen.queryByLabelText('Opt 6')).not.toBeInTheDocument()
  })

  it('filters options when withSearch is enabled', async () => {
    const user = userEvent.setup()
    const opts = [
      { id: '1', label: 'Wifi gratis' },
      { id: '2', label: 'Piscina' },
      { id: '3', label: 'Spa' },
      { id: '4', label: 'Gimnasio' },
      { id: '5', label: 'Parking' },
      { id: '6', label: 'Restaurante' },
      { id: '7', label: 'Traslado' },
    ]
    renderWithProviders(
      <FilterGroup title="Servicios" options={opts} withSearch collapsible={false} pageSize={6} />
    )
    await user.type(screen.getByPlaceholderText(/servicios/i), 'wifi')
    expect(screen.getByLabelText('Wifi gratis')).toBeInTheDocument()
    expect(screen.queryByLabelText('Piscina')).not.toBeInTheDocument()
  })

  it('does not render search input when options do not exceed pageSize', () => {
    renderWithProviders(
      <FilterGroup title="Servicios" options={options} withSearch collapsible={false} pageSize={6} />
    )
    expect(screen.queryByPlaceholderText(/servicios/i)).not.toBeInTheDocument()
  })

  it('toggles selection with internal state when uncontrolled', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterGroup title="X" options={options} collapsible={false} pageSize={10} />)
    const box = screen.getByLabelText('Opción B') as HTMLInputElement
    expect(box.checked).toBe(false)
    await user.click(box)
    expect(box.checked).toBe(true)
    await user.click(box)
    expect(box.checked).toBe(false)
  })
})
