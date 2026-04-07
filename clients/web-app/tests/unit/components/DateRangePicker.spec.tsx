import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDays } from 'date-fns'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import i18n from '@/i18n'
import type { DateRange } from 'react-day-picker'
import { today } from '@/utils/searchFormat'

vi.mock('react-day-picker', () => ({
  DayPicker: ({
    onSelect,
    locale,
    disabled,
  }: {
    onSelect?: (r: DateRange | undefined) => void
    locale?: { code?: string }
    disabled?: { before?: Date }
  }) => (
    <div
      data-testid="day-picker-mock"
      data-locale-code={locale?.code ?? ''}
      data-disabled-before={disabled?.before?.toISOString?.() ?? ''}
    >
      <button type="button" data-testid="sel-undefined" onClick={() => onSelect?.(undefined)}>
        clear
      </button>
      <button
        type="button"
        data-testid="sel-same-end"
        onClick={() =>
          onSelect?.({
            from: new Date(2025, 0, 10),
            to: new Date(2025, 0, 10),
          })
        }
      >
        same
      </button>
      <button
        type="button"
        data-testid="sel-to-before"
        onClick={() =>
          onSelect?.({
            from: new Date(2025, 0, 10),
            to: new Date(2025, 0, 5),
          })
        }
      >
        invalid
      </button>
      <button
        type="button"
        data-testid="sel-partial"
        onClick={() => onSelect?.({ from: new Date(2025, 0, 10), to: undefined })}
      >
        partial
      </button>
      <button
        type="button"
        data-testid="sel-full"
        onClick={() =>
          onSelect?.({
            from: new Date(2025, 0, 10),
            to: new Date(2025, 0, 15),
          })
        }
      >
        full
      </button>
    </div>
  ),
}))

import DateRangePicker from '@/components/DateRangePicker'

describe('DateRangePicker', () => {
  beforeEach(() => {
    i18n.changeLanguage('es-CO')
  })

  it('calls onChange(undefined) when selection is cleared', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DateRangePicker value={undefined} onChange={onChange} />)
    await user.click(screen.getByTestId('sel-undefined'))
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('normalizes range when end is on or before start', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DateRangePicker value={undefined} onChange={onChange} />)
    await user.click(screen.getByTestId('sel-same-end'))
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2025, 0, 10),
      to: undefined,
    })
    onChange.mockClear()
    await user.click(screen.getByTestId('sel-to-before'))
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2025, 0, 10),
      to: undefined,
    })
  })

  it('commits full range and calls onComplete', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(<DateRangePicker value={undefined} onChange={onChange} onComplete={onComplete} />)
    await user.click(screen.getByTestId('sel-full'))
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2025, 0, 10),
      to: new Date(2025, 0, 15),
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not call onComplete for partial range', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(
      <DateRangePicker
        value={undefined}
        onChange={() => {}}
        onComplete={onComplete}
      />
    )
    await user.click(screen.getByTestId('sel-partial'))
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('uses en-US locale when language is en-US', () => {
    i18n.changeLanguage('en-US')
    render(<DateRangePicker value={undefined} onChange={() => {}} />)
    expect(screen.getByTestId('day-picker-mock')).toHaveAttribute('data-locale-code', 'en-US')
  })

  it('falls back to Spanish locale for unknown i18n language', () => {
    i18n.changeLanguage('fr')
    render(<DateRangePicker value={undefined} onChange={() => {}} />)
    expect(screen.getByTestId('day-picker-mock')).toHaveAttribute('data-locale-code', 'es')
  })

  it('disables dates before tomorrow when only start date is selected', () => {
    const from = new Date(2025, 0, 10)
    render(
      <DateRangePicker value={{ from, to: undefined }} onChange={() => {}} />
    )
    const before = screen.getByTestId('day-picker-mock').getAttribute('data-disabled-before')
    expect(before).toBe(addDays(from, 1).toISOString())
  })

  it('disables dates before today when no range is selected', () => {
    render(<DateRangePicker value={undefined} onChange={() => {}} />)
    const before = screen.getByTestId('day-picker-mock').getAttribute('data-disabled-before')
    expect(before).toBe(today().toISOString())
  })

  it('uses today as lower bound when range is complete', () => {
    render(
      <DateRangePicker
        value={{ from: new Date(2025, 0, 5), to: new Date(2025, 0, 8) }}
        onChange={() => {}}
      />
    )
    const before = screen.getByTestId('day-picker-mock').getAttribute('data-disabled-before')
    expect(before).toBe(today().toISOString())
  })
})
