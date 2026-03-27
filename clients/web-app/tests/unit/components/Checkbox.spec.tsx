import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Checkbox from '@/components/Checkbox'
import { renderWithProviders } from '../renderWithProviders'

describe('Checkbox', () => {
  describe('rendering', () => {
    it('renders the checkbox input', () => {
      renderWithProviders(<Checkbox id="test" checked={false} onChange={() => {}} label="Label" />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('renders the label text', () => {
      renderWithProviders(<Checkbox id="test" checked={false} onChange={() => {}} label="Acepto los términos" />)
      expect(screen.getByText('Acepto los términos')).toBeInTheDocument()
    })

    it('renders a ReactNode label', () => {
      renderWithProviders(
        <Checkbox
          id="test"
          checked={false}
          onChange={() => {}}
          label={<>Acepto los <a href="#">términos</a></>}
        />
      )
      expect(screen.getByText('términos')).toBeInTheDocument()
    })

    it('associates label with input via htmlFor', () => {
      renderWithProviders(<Checkbox id="my-check" checked={false} onChange={() => {}} label="Label" />)
      expect(screen.getByLabelText('Label')).toBeInTheDocument()
    })

    it('renders unchecked by default when checked=false', () => {
      renderWithProviders(<Checkbox id="test" checked={false} onChange={() => {}} label="Label" />)
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    it('renders checked when checked=true', () => {
      renderWithProviders(<Checkbox id="test" checked={true} onChange={() => {}} label="Label" />)
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('applies custom className to the wrapper', () => {
      const { container } = renderWithProviders(
        <Checkbox id="test" checked={false} onChange={() => {}} label="Label" className="my-class" />
      )
      expect(container.firstChild).toHaveClass('my-class')
    })
  })

  describe('interaction', () => {
    it('calls onChange with true when unchecked checkbox is clicked', () => {
      const onChange = vi.fn()
      renderWithProviders(<Checkbox id="test" checked={false} onChange={onChange} label="Label" />)
      fireEvent.click(screen.getByRole('checkbox'))
      expect(onChange).toHaveBeenCalledWith(true)
    })

    it('calls onChange with false when checked checkbox is clicked', () => {
      const onChange = vi.fn()
      renderWithProviders(<Checkbox id="test" checked={true} onChange={onChange} label="Label" />)
      fireEvent.click(screen.getByRole('checkbox'))
      expect(onChange).toHaveBeenCalledWith(false)
    })

    it('calls onChange once per click', () => {
      const onChange = vi.fn()
      renderWithProviders(<Checkbox id="test" checked={false} onChange={onChange} label="Label" />)
      fireEvent.click(screen.getByRole('checkbox'))
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('calls onChange when the label is clicked', () => {
      const onChange = vi.fn()
      renderWithProviders(<Checkbox id="test" checked={false} onChange={onChange} label="Label" />)
      fireEvent.click(screen.getByText('Label'))
      expect(onChange).toHaveBeenCalledWith(true)
    })
  })
})
