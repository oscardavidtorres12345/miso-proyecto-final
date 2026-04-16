import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import Sidebar from '@/components/Sidebar'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => {
  i18n.changeLanguage('es-CO')
})

describe('Sidebar', () => {
  describe('rendering', () => {
    it('renders the Travel Hub logo', () => {
      renderWithProviders(<Sidebar />)
      expect(screen.getByAltText('Travel Hub')).toBeInTheDocument()
    })

    it('renders all nav items', () => {
      renderWithProviders(<Sidebar />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Reporte mensual')).toBeInTheDocument()
      expect(screen.getByText('Gestión de tarifas')).toBeInTheDocument()
      expect(screen.getByText('Feedback')).toBeInTheDocument()
      expect(screen.getByText('Reservas')).toBeInTheDocument()
    })

    it('renders nav items as links', () => {
      renderWithProviders(<Sidebar />)
      expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('href', '/portal/dashboard')
      expect(screen.getByRole('link', { name: /Reporte mensual/ })).toHaveAttribute('href', '/portal/reports')
      expect(screen.getByRole('link', { name: /Gestión de tarifas/ })).toHaveAttribute('href', '/portal/rates')
      expect(screen.getByRole('link', { name: /Feedback/ })).toHaveAttribute('href', '/portal/feedback')
      expect(screen.getByRole('link', { name: /Reservas/ })).toHaveAttribute('href', '/portal/reservations')
    })
  })

  describe('i18n', () => {
    it('renders in English when language is en-US', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderWithProviders(<Sidebar />)
      expect(screen.getByText('Monthly report')).toBeInTheDocument()
      expect(screen.getByText('Rate management')).toBeInTheDocument()
      expect(screen.getByText('Reservations')).toBeInTheDocument()
    })
  })
})
