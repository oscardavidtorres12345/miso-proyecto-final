import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import DateRangeInput from '@/components/DateRangeInput'
import { renderWithProviders } from '../renderWithProviders'

vi.mock('@/components/DateRangePicker', () => ({
  default: ({
    onChange,
    onComplete,
  }: {
    onChange: (r: { from: Date; to: Date } | undefined) => void
    onComplete?: () => void
  }) => (
    <button
      type="button"
      data-testid="mock-apply-range"
      onClick={() => {
        onChange({
          from: new Date(2025, 5, 1),
          to: new Date(2025, 5, 7),
        })
        onComplete?.()
      }}
    >
      apply-range
    </button>
  ),
}))

describe('DateRangeInput', () => {
  it('shows placeholder when value is empty', () => {
    const onChange = vi.fn()
    renderWithProviders(<DateRangeInput value={undefined} onChange={onChange} />)
    expect(screen.getByText('Agrega fechas')).toBeInTheDocument()
  })

  it('opens calendar popup when field is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DateRangeInput value={undefined} onChange={() => {}} />)
    await user.click(screen.getByText('Agrega fechas'))
    expect(screen.getByTestId('mock-apply-range')).toBeInTheDocument()
  })

  it('closes popup and forwards range when picker completes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<DateRangeInput value={undefined} onChange={onChange} />)
    await user.click(screen.getByText('Agrega fechas'))
    await user.click(screen.getByTestId('mock-apply-range'))
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2025, 5, 1),
      to: new Date(2025, 5, 7),
    })
    expect(screen.queryByTestId('mock-apply-range')).not.toBeInTheDocument()
  })

  it('closes popup on mousedown outside', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DateRangeInput value={undefined} onChange={() => {}} />)
    await user.click(screen.getByText('Agrega fechas'))
    expect(screen.getByTestId('mock-apply-range')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('mock-apply-range')).not.toBeInTheDocument()
  })

  it('shows formatted range when value is set', () => {
    const { container } = renderWithProviders(
      <DateRangeInput
        value={{
          from: new Date(2025, 5, 10),
          to: new Date(2025, 5, 12),
        }}
        onChange={() => {}}
      />
    )
    expect(screen.queryByText('Agrega fechas')).not.toBeInTheDocument()
    const display = container.querySelector('.date-input__display')
    expect(display?.textContent).toMatch(/10.*12/)
  })
})
