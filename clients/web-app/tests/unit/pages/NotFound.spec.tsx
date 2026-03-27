import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import NotFound from '@/pages/NotFound'
import { renderWithProviders } from '../renderWithProviders'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeEach(() => {
  i18n.changeLanguage('es-CO')
  mockNavigate.mockClear()
})

describe('NotFound', () => {
  describe('rendering', () => {
    it('renders the 404 code', () => {
      renderWithProviders(<NotFound />)
      expect(screen.getByText('404')).toBeInTheDocument()
    })

    it('renders the page title', () => {
      renderWithProviders(<NotFound />)
      expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    })

    it('renders the description', () => {
      renderWithProviders(<NotFound />)
      expect(screen.getByText('La página que buscas no existe o fue movida.')).toBeInTheDocument()
    })

    it('renders the go home button', () => {
      renderWithProviders(<NotFound />)
      expect(screen.getByRole('button', { name: 'Volver al inicio' })).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('navigates to home when button is clicked', () => {
      renderWithProviders(<NotFound />)
      fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }))
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  describe('i18n', () => {
    it('renders in English when language is en-US', () => {
      i18n.changeLanguage('en-US')
      renderWithProviders(<NotFound />)
      expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go back home' })).toBeInTheDocument()
    })
  })
})
