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
      const headers = screen.getAllByRole('columnheader')
      const headerTexts = headers.map(h => h.textContent?.trim())
      expect(headerTexts).toContain('Tipo de habitación')
      expect(headerTexts).toContain('Tarifa base')
      expect(headerTexts).toContain('Tarifa oferta')
      expect(headerTexts).toContain('Disponibilidad')
      expect(headerTexts).toContain('Estado de oferta')
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

  describe('add rate modal', () => {
    it('modal is closed by default', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByRole('dialog')).not.toHaveClass('modal__panel--open')
    })

    it('opens modal when add button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      expect(screen.getByRole('dialog')).toHaveClass('modal__panel--open')
      expect(screen.getByText('Añadir una nueva tarifa')).toBeInTheDocument()
    })

    it('renders all form fields inside the modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByLabelText('Tipo de habitación')).toBeInTheDocument()
      expect(within(dialog).getByLabelText('Tarifa base')).toBeInTheDocument()
      expect(within(dialog).getByLabelText('Tarifa oferta')).toBeInTheDocument()
      expect(within(dialog).getByLabelText('Habitaciones disponibles')).toBeInTheDocument()
      expect(within(dialog).getByLabelText('Total de habitaciones')).toBeInTheDocument()
      expect(within(dialog).getByLabelText('Estado de oferta')).toBeInTheDocument()
    })

    it('toggle is checked by default', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      const toggle = screen.getByLabelText('Estado de oferta')
      expect(toggle).toBeChecked()
    })

    it('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      await user.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(screen.getByRole('dialog')).not.toHaveClass('modal__panel--open')
    })

    it('closes modal when overlay close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      await user.click(screen.getByRole('button', { name: 'Cerrar' }))
      expect(screen.getByRole('dialog')).not.toHaveClass('modal__panel--open')
    })
  })

  describe('edit rate modal', () => {
    it('opens modal when edit button of a row is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      expect(screen.getByRole('dialog')).toHaveClass('modal__panel--open')
    })

    it('shows "Editar tarifa" as the modal title when editing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      expect(screen.getByRole('heading', { name: 'Editar tarifa' })).toBeInTheDocument()
    })

    it('pre-fills room type field with the row data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      expect(screen.getByLabelText('Tipo de habitación')).toHaveValue('Suite Junior')
    })

    it('pre-fills toggle with inactive state for the Penthouse row', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[4])
      expect(screen.getByLabelText('Estado de oferta')).not.toBeChecked()
    })

    it('shows add title when reopening in add mode after editing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)

      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      await user.click(screen.getByRole('button', { name: 'Cerrar' }))

      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      expect(screen.getByRole('heading', { name: 'Añadir una nueva tarifa' })).toBeInTheDocument()
    })

    it('clears fields when reopening in add mode after editing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)

      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      await user.click(screen.getByRole('button', { name: 'Cerrar' }))

      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      expect(screen.getByLabelText('Tipo de habitación')).toHaveValue('')
    })
  })
})
