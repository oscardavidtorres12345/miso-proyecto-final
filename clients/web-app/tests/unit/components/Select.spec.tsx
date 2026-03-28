import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Select from '@/components/Select'

const options = [
  { value: 'cc', label: 'CC' },
  { value: 'passport', label: 'Pasaporte' },
]

describe('Select', () => {
  it('renders all options', () => {
    render(<Select options={options} value="cc" onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: 'CC' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Pasaporte' })).toBeInTheDocument()
  })

  it('reflects the current value', () => {
    render(<Select options={options} value="passport" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('passport')
  })

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn()
    render(<Select options={options} value="cc" onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'passport' } })
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('forwards extra props to the select element', () => {
    render(<Select options={options} value="cc" onChange={vi.fn()} className="my-class" aria-label="tipo" />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('my-class')
    expect(select).toHaveAttribute('aria-label', 'tipo')
  })
})
