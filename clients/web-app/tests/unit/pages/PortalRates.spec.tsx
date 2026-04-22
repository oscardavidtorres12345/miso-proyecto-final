import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import PortalRates from '@/pages/PortalRates'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => {
  i18n.changeLanguage('es-CO')
})

describe('PortalRates', () => {
  describe('rendering', () => {
    it('renders the page title', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByRole('heading', { name: 'Gestión de tarifas' })).toBeInTheDocument()
    })

    it('renders the currency label and selector with COP as default', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByText('Moneda')).toBeInTheDocument()
      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('COP')
    })

    it('renders all table column headers', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByText('Tipo de habitación')).toBeInTheDocument()
      expect(screen.getByText('Tarifa base')).toBeInTheDocument()
      expect(screen.getByText('Tarifa oferta')).toBeInTheDocument()
      expect(screen.getByText('Disponibilidad')).toBeInTheDocument()
      expect(screen.getByText('Estado de oferta')).toBeInTheDocument()
    })

    it('renders all mock rate rows', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByText('Suite Junior')).toBeInTheDocument()
      expect(screen.getByText('Habitación estándar')).toBeInTheDocument()
      expect(screen.getByText('Suite deluxe')).toBeInTheDocument()
      expect(screen.getByText('Habitación familiar')).toBeInTheDocument()
      expect(screen.getByText('Penthouse')).toBeInTheDocument()
    })

    it('renders active and inactive status badges', () => {
      renderWithProviders(<PortalRates />)
      const activeBadges = screen.getAllByText('Activa')
      expect(activeBadges).toHaveLength(4)
      expect(screen.getByText('Inactiva')).toBeInTheDocument()
    })

    it('renders availability as available/total format', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByText('15/20')).toBeInTheDocument()
      expect(screen.getByText('0/4')).toBeInTheDocument()
    })

    it('renders edit buttons for each row', () => {
      renderWithProviders(<PortalRates />)
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      expect(editButtons).toHaveLength(5)
    })

    it('renders the add new rate button', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByRole('button', { name: /Añadir nueva tarifa/ })).toBeInTheDocument()
    })
  })

  describe('currency selector', () => {
    it('offers COP, ARS and USD options', () => {
      renderWithProviders(<PortalRates />)
      const select = screen.getByRole('combobox')
      const options = within(select).getAllByRole('option')
      expect(options.map(o => o.textContent)).toEqual(['COP', 'ARS', 'USD'])
    })

    it('updates selected currency on change', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'USD')
      expect(select).toHaveValue('USD')
    })
  })
})
