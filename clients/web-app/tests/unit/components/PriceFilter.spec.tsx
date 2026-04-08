import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import PriceFilter from '@/components/PriceFilter'
import { renderWithProviders } from '../renderWithProviders'

const minMaxTextboxes = () => screen.getAllByRole('textbox')

describe('PriceFilter', () => {
  it('renders translated title and min/max fields', () => {
    renderWithProviders(<PriceFilter collapsible={false} />)
    expect(screen.getByText('Precio')).toBeInTheDocument()
    expect(screen.getByText('Mín.')).toBeInTheDocument()
    expect(screen.getByText('Máx.')).toBeInTheDocument()
  })

  it('calls onChange with digit-only value when min input changes (controlled)', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <PriceFilter value={{ min: '', max: '' }} onChange={onChange} collapsible={false} />,
    )
    const minInput = minMaxTextboxes()[0]
    fireEvent.change(minInput, { target: { value: '100' } })
    expect(onChange).toHaveBeenCalledWith({ min: '100', max: '' })
  })

  it('formats display with thousand separator', () => {
    renderWithProviders(
      <PriceFilter value={{ min: '4000', max: '' }} onChange={vi.fn()} collapsible={false} />,
    )
    expect(minMaxTextboxes()[0]).toHaveValue('4.000')
  })

  it('toggles body visibility when collapsible header is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PriceFilter defaultOpen />)
    const header = screen.getByRole('button', { name: /Precio/i })
    expect(header).toHaveAttribute('aria-expanded', 'true')
    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('starts collapsed when defaultOpen is false', () => {
    renderWithProviders(<PriceFilter defaultOpen={false} />)
    expect(screen.getByRole('button', { name: /Precio/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('updates internal state when uncontrolled (no onChange)', () => {
    renderWithProviders(<PriceFilter collapsible={false} />)
    const [, maxInput] = minMaxTextboxes()
    fireEvent.change(maxInput, { target: { value: '500' } })
    expect(maxInput).toHaveValue('500')
  })
})
