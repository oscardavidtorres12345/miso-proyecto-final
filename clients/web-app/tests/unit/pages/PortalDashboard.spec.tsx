import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import PortalDashboard from '@/pages/PortalDashboard'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => {
  i18n.changeLanguage('es-CO')
})

describe('PortalDashboard', () => {
  describe('rendering', () => {
    it('renders the page title', () => {
      renderWithProviders(<PortalDashboard />)
      expect(screen.getByRole('heading', { name: 'Portal de administración' })).toBeInTheDocument()
    })

    it('renders the subtitle', () => {
      renderWithProviders(<PortalDashboard />)
      expect(screen.getByText('Bienvenido al panel de gestión.')).toBeInTheDocument()
    })
  })

  describe('i18n', () => {
    it('renders in English when language is en-US', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderWithProviders(<PortalDashboard />)
      expect(screen.getByRole('heading', { name: 'Administration portal' })).toBeInTheDocument()
      expect(screen.getByText('Welcome to the management dashboard.')).toBeInTheDocument()
    })
  })
})
