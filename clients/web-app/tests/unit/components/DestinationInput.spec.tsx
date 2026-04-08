import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import DestinationInput from '@/components/DestinationInput'
import { renderWithProviders } from '../renderWithProviders'

describe('DestinationInput', () => {
  it('renders label and placeholder', () => {
    renderWithProviders(<DestinationInput value="" onChange={() => {}} />)
    expect(screen.getByText('Destino')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('¿Adónde vas?')).toBeInTheDocument()
  })

  it('reflects controlled value', () => {
    renderWithProviders(<DestinationInput value="Cartagena" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('Cartagena')
  })

  it('notifies onChange when typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<DestinationInput value="" onChange={onChange} />)
    await user.type(screen.getByRole('textbox'), 'Bog')
    expect(onChange).toHaveBeenCalled()
  })
})
