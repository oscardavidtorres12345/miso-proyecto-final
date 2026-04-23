import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import PortalRates from '@/pages/PortalRates'
import { renderWithProviders } from '../renderWithProviders'
import * as inventoryService from '@/services/inventoryService'
import * as AuthContext from '@/context/AuthContext'
import type { RoomRateDto } from '@/services/inventoryService'
import { UserRole } from '@/types/user'

const makeRate = (overrides: Partial<RoomRateDto> & Pick<RoomRateDto, 'room_id' | 'room_type'>): RoomRateDto => ({
  property_id: 1,
  property_name: 'Hotel Test',
  base_rate: 100000,
  offer_rate: 80000,
  offer_active: true,
  effective_rate: 80000,
  currency: 'COP',
  occupied_units: 5,
  total_units: 20,
  available_rooms: 15,
  offer_status: 'Activa',
  updated_at: '2026-04-22T00:00:00',
  ...overrides,
})

const MOCK_RATES: RoomRateDto[] = [
  makeRate({ room_id: 1, room_type: 'Suite Junior', base_rate: 100000, offer_rate: 80000, occupied_units: 5, total_units: 20, available_rooms: 15 }),
  makeRate({ room_id: 2, room_type: 'Habitación estándar', base_rate: 150000, offer_rate: 120000, occupied_units: 12, total_units: 20, available_rooms: 8 }),
  makeRate({ room_id: 3, room_type: 'Suite deluxe', base_rate: 200000, offer_rate: 170000, occupied_units: 7, total_units: 15, available_rooms: 8 }),
  makeRate({ room_id: 4, room_type: 'Habitación familiar', base_rate: 250000, offer_rate: 220000, occupied_units: 3, total_units: 8, available_rooms: 5 }),
  makeRate({ room_id: 5, room_type: 'Penthouse', base_rate: 350000, offer_rate: 300000, occupied_units: 4, total_units: 4, available_rooms: 0, offer_active: false }),
]

beforeEach(() => {
  i18n.changeLanguage('es-CO')

  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    session: null,
    token: 'mock-jwt-token',
    isAuthenticated: true,
    autoLoggedOut: false,
    setAuthData: vi.fn(),
    clearAuthData: vi.fn(),
    clearAutoLoggedOut: vi.fn(),
  })

  vi.spyOn(inventoryService, 'getRates').mockResolvedValue(MOCK_RATES)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PortalRates', () => {
  describe('rendering', () => {
    it('renders the page title', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByRole('heading', { name: 'Gestión de tarifas' })).toBeInTheDocument()
    })

    it('shows a loading spinner while fetching', () => {
      vi.spyOn(inventoryService, 'getRates').mockReturnValue(new Promise(() => {}))
      renderWithProviders(<PortalRates />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders the currency label and selector with COP as default', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByText('Moneda')).toBeInTheDocument()
      const select = screen.getByRole('combobox', { name: 'Moneda' })
      expect(select).toHaveValue('COP')
    })

    it('renders all table column headers after data loads', async () => {
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      const headers = screen.getAllByRole('columnheader')
      const headerTexts = headers.map(h => h.textContent?.trim())
      expect(headerTexts).toContain('Propiedad')
      expect(headerTexts).toContain('Tipo de habitación')
      expect(headerTexts).toContain('Tarifa base')
      expect(headerTexts).toContain('Tarifa oferta')
      expect(headerTexts).toContain('Disponibilidad')
      expect(headerTexts).toContain('Estado de oferta')
    })

    it('renders all rate rows from the API', async () => {
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByText('Suite Junior')).toBeInTheDocument())
      expect(screen.getByText('Habitación estándar')).toBeInTheDocument()
      expect(screen.getByText('Suite deluxe')).toBeInTheDocument()
      expect(screen.getByText('Habitación familiar')).toBeInTheDocument()
      expect(screen.getByText('Penthouse')).toBeInTheDocument()
    })

    it('renders active and inactive status badges', async () => {
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      const activeBadges = screen.getAllByText('Activa')
      expect(activeBadges).toHaveLength(4)
      expect(screen.getByText('Inactiva')).toBeInTheDocument()
    })

    it('renders availability with available and occupied rows', async () => {
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      expect(screen.getByText('15/20 disp.')).toBeInTheDocument()
      expect(screen.getByText('5/20 ocup.')).toBeInTheDocument()
      expect(screen.getByText('0/4 disp.')).toBeInTheDocument()
      expect(screen.getByText('4/4 ocup.')).toBeInTheDocument()
    })

    it('renders edit buttons for each row', async () => {
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      expect(editButtons).toHaveLength(5)
    })

    it('renders the add new rate button', () => {
      renderWithProviders(<PortalRates />)
      expect(screen.getByRole('button', { name: /Añadir nueva tarifa/ })).toBeInTheDocument()
    })

    it('shows snackbar when API call fails', async () => {
      vi.spyOn(inventoryService, 'getRates').mockRejectedValueOnce(new Error('Network error'))
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    })

    it('shows empty state when API returns no rates', async () => {
      vi.spyOn(inventoryService, 'getRates').mockResolvedValueOnce([])
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByText('Sin tarifas disponibles')).toBeInTheDocument())
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('shows empty state when API call fails', async () => {
      vi.spyOn(inventoryService, 'getRates').mockRejectedValueOnce(new Error('Network error'))
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByText('Sin tarifas disponibles')).toBeInTheDocument())
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('currency selector', () => {
    it('offers COP, ARS and USD options', () => {
      renderWithProviders(<PortalRates />)
      const select = screen.getByRole('combobox', { name: 'Moneda' })
      const options = within(select).getAllByRole('option')
      expect(options.map(o => o.textContent)).toEqual(['COP', 'ARS', 'USD'])
    })

    it('updates selected currency on change', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      const select = screen.getByRole('combobox', { name: 'Moneda' })
      await user.selectOptions(select, 'USD')
      expect(select).toHaveValue('USD')
    })

    it('re-fetches rates when currency changes', async () => {
      const user = userEvent.setup()
      const spy = vi.spyOn(inventoryService, 'getRates').mockResolvedValue(MOCK_RATES)
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())

      const callsBefore = spy.mock.calls.length
      await user.selectOptions(screen.getByRole('combobox', { name: 'Moneda' }), 'USD')
      await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThan(callsBefore))
      expect(spy).toHaveBeenCalledWith('mock-jwt-token', 'USD')
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
      expect(within(dialog).getByLabelText('Propiedad')).toBeInTheDocument()
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

  describe('form validation', () => {
    it('save button is disabled when modal opens in add mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    })

    it('save button is enabled when all fields are filled', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))

      const dialog = screen.getByRole('dialog')
      await user.selectOptions(within(dialog).getByLabelText('Propiedad'), '1')
      await user.type(screen.getByLabelText('Tipo de habitación'), 'Suite Test')
      await user.type(screen.getByLabelText('Tarifa base'), '120000')
      await user.type(screen.getByLabelText('Tarifa oferta'), '100000')
      await user.type(screen.getByLabelText('Habitaciones disponibles'), '5')
      await user.type(screen.getByLabelText('Total de habitaciones'), '10')

      expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    })

    it('shows error message when offer rate equals base rate', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      await user.type(screen.getByLabelText('Tarifa base'), '100000')
      await user.type(screen.getByLabelText('Tarifa oferta'), '100000')
      expect(screen.getByText('La tarifa oferta debe ser menor a la tarifa base.')).toBeInTheDocument()
    })

    it('shows error message when offer rate is greater than base rate', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      await user.type(screen.getByLabelText('Tarifa base'), '100000')
      await user.type(screen.getByLabelText('Tarifa oferta'), '120000')
      expect(screen.getByText('La tarifa oferta debe ser menor a la tarifa base.')).toBeInTheDocument()
    })

    it('disables save button when offer rate is invalid', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      const dialog = screen.getByRole('dialog')
      await user.selectOptions(within(dialog).getByLabelText('Propiedad'), '1')
      await user.type(screen.getByLabelText('Tipo de habitación'), 'Suite Test')
      await user.type(screen.getByLabelText('Tarifa base'), '100000')
      await user.type(screen.getByLabelText('Tarifa oferta'), '100000')
      await user.type(screen.getByLabelText('Habitaciones disponibles'), '5')
      await user.type(screen.getByLabelText('Total de habitaciones'), '10')
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    })

    it('hides error and enables save when offer rate is corrected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      const dialog = screen.getByRole('dialog')
      await user.selectOptions(within(dialog).getByLabelText('Propiedad'), '1')
      await user.type(screen.getByLabelText('Tipo de habitación'), 'Suite Test')
      await user.type(screen.getByLabelText('Tarifa base'), '100000')
      await user.type(screen.getByLabelText('Tarifa oferta'), '100000')
      await user.type(screen.getByLabelText('Habitaciones disponibles'), '5')
      await user.type(screen.getByLabelText('Total de habitaciones'), '10')

      const offerInput = screen.getByLabelText('Tarifa oferta')
      await user.clear(offerInput)
      await user.type(offerInput, '80000')

      expect(screen.queryByText('La tarifa oferta debe ser menor a la tarifa base.')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    })

    it('save button is enabled immediately in edit mode (pre-filled data)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    })
  })

  describe('edit rate modal', () => {
    it('opens modal when edit button of a row is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      expect(screen.getByRole('dialog')).toHaveClass('modal__panel--open')
    })

    it('shows "Editar tarifa" as the modal title when editing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      expect(screen.getByRole('heading', { name: 'Editar tarifa' })).toBeInTheDocument()
    })

    it('pre-fills room type field with the row data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      expect(screen.getByLabelText('Tipo de habitación')).toHaveValue('Suite Junior')
    })

    it('pre-fills toggle with inactive state for the Penthouse row', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[4])
      expect(screen.getByLabelText('Estado de oferta')).not.toBeChecked()
    })

    it('shows add title when reopening in add mode after editing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())

      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      await user.click(screen.getByRole('button', { name: 'Cerrar' }))

      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      expect(screen.getByRole('heading', { name: 'Añadir una nueva tarifa' })).toBeInTheDocument()
    })

    it('clears fields when reopening in add mode after editing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())

      const editButtons = screen.getAllByRole('button', { name: 'Editar tarifa' })
      await user.click(editButtons[0])
      await user.click(screen.getByRole('button', { name: 'Cerrar' }))

      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      expect(screen.getByLabelText('Tipo de habitación')).toHaveValue('')
      expect(within(screen.getByRole('dialog')).getByLabelText('Propiedad')).toHaveValue('0')
    })
  })

  describe('save behavior', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        session: {
          user: { user_id: 2, username: 'staff', email: 'staff@test.com', role: UserRole.STAFF, is_active: true },
          permissions: [],
          sessionExpiresAt: new Date(Date.now() + 3600000).toISOString(),
          token: 'mock-jwt-token',
        },
        token: 'mock-jwt-token',
        isAuthenticated: true,
        autoLoggedOut: false,
        setAuthData: vi.fn(),
        clearAuthData: vi.fn(),
        clearAutoLoggedOut: vi.fn(),
      })
    })

    const fillAddForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole('button', { name: /Añadir nueva tarifa/ }))
      const dialog = screen.getByRole('dialog')
      await user.selectOptions(within(dialog).getByLabelText('Propiedad'), '1')
      await user.type(within(dialog).getByLabelText('Tipo de habitación'), 'Suite Test')
      await user.type(within(dialog).getByLabelText('Tarifa base'), '120000')
      await user.type(within(dialog).getByLabelText('Tarifa oferta'), '100000')
      await user.type(within(dialog).getByLabelText('Habitaciones disponibles'), '5')
      await user.type(within(dialog).getByLabelText('Total de habitaciones'), '10')
    }

    it('clicking save in add mode calls createRate with correct payload', async () => {
      const createSpy = vi.spyOn(inventoryService, 'createRate').mockResolvedValueOnce(
        makeRate({ room_id: 99, room_type: 'Suite Test' })
      )
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())

      await fillAddForm(user)
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(createSpy).toHaveBeenCalledWith('mock-jwt-token', 2, {
        property_id: 1,
        room_type: 'Suite Test',
        base_rate: 120000,
        offer_rate: 100000,
        occupied_units: 5,
        total_units: 10,
        offer_active: true,
        currency: 'COP',
        horizon_days: 30,
      })
    })

    it('closes modal and shows success snackbar after successful create', async () => {
      vi.spyOn(inventoryService, 'createRate').mockResolvedValueOnce(
        makeRate({ room_id: 99, room_type: 'Suite Test' })
      )
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())

      await fillAddForm(user)
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(screen.getByRole('dialog')).not.toHaveClass('modal__panel--open'))
      expect(screen.getByRole('alert')).toHaveTextContent('Tarifa creada exitosamente.')
    })

    it('keeps modal open and shows error snackbar when create fails', async () => {
      vi.spyOn(inventoryService, 'createRate').mockRejectedValueOnce(
        Object.assign(new Error('offer_rate must be lower than base_rate'), { status: 422 })
      )
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())

      await fillAddForm(user)
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
      expect(screen.getByRole('alert')).toHaveTextContent('offer_rate must be lower than base_rate')
      expect(screen.getByRole('dialog')).toHaveClass('modal__panel--open')
    })

    it('clicking save in edit mode calls updateRate with the rate room_id', async () => {
      const updateSpy = vi.spyOn(inventoryService, 'updateRate').mockResolvedValueOnce(
        makeRate({ room_id: 1, room_type: 'Suite Junior' })
      )
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())

      await user.click(screen.getAllByRole('button', { name: 'Editar tarifa' })[0])
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(updateSpy).toHaveBeenCalled())
      const [, , roomId] = updateSpy.mock.calls[0]
      expect(roomId).toBe(1)
    })

    it('closes modal and shows success snackbar after successful update', async () => {
      vi.spyOn(inventoryService, 'updateRate').mockResolvedValueOnce(
        makeRate({ room_id: 1, room_type: 'Suite Junior' })
      )
      const user = userEvent.setup()
      renderWithProviders(<PortalRates />)
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())

      await user.click(screen.getAllByRole('button', { name: 'Editar tarifa' })[0])
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(screen.getByRole('dialog')).not.toHaveClass('modal__panel--open'))
      expect(screen.getByRole('alert')).toHaveTextContent('Tarifa actualizada exitosamente.')
    })
  })
})
