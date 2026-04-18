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
      expect(screen.getByText('Estamos trabajando en esto')).toBeInTheDocument()
    })
  })

})
