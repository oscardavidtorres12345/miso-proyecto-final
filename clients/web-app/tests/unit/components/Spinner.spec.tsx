import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Spinner from '@/components/Spinner'
import { renderWithProviders } from '../renderWithProviders'

describe('Spinner', () => {
  describe('rendering', () => {
    it('renders a status element', () => {
      renderWithProviders(<Spinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('has accessible label "Cargando"', () => {
      renderWithProviders(<Spinner />)
      expect(screen.getByLabelText('Cargando')).toBeInTheDocument()
    })

    it('applies the spinner CSS class', () => {
      renderWithProviders(<Spinner />)
      expect(screen.getByRole('status')).toHaveClass('spinner')
    })

    it('uses default size of 48px when no size prop is provided', () => {
      renderWithProviders(<Spinner />)
      const el = screen.getByRole('status')
      expect(el).toHaveStyle({ width: '48px', height: '48px' })
    })

    it('applies the provided size as inline style', () => {
      renderWithProviders(<Spinner size={56} />)
      const el = screen.getByRole('status')
      expect(el).toHaveStyle({ width: '56px', height: '56px' })
    })

    it('width and height are equal for any given size', () => {
      renderWithProviders(<Spinner size={100} />)
      const el = screen.getByRole('status') as HTMLElement
      expect(el.style.width).toBe(el.style.height)
    })
  })
})
