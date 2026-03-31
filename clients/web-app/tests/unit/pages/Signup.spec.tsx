import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import Signup from '@/pages/Signup'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
  vi.restoreAllMocks()
})

describe('Signup', () => {
  describe('rendering', () => {
    it('renders the page title', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByRole('heading', { name: 'Crea una cuenta' })).toBeInTheDocument()
    })

    it('renders the login link', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByText('¿Ya tienes cuenta?')).toBeInTheDocument()
      expect(screen.getByText('Inicia sesión')).toBeInTheDocument()
    })

    it('renders the first name field', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Nombres')).toBeInTheDocument()
    })

    it('renders the last name field', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Apellidos')).toBeInTheDocument()
    })

    it('renders the document id field', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Número de documento de identidad')).toBeInTheDocument()
    })

    it('renders the document type selector with CC and Pasaporte options', () => {
      renderWithProviders(<Signup />)
      const select = screen.getByRole('combobox', { name: 'Tipo de documento' })
      expect(select).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'CC' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Pasaporte' })).toBeInTheDocument()
    })

    it('defaults document type to CC', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByRole('combobox', { name: 'Tipo de documento' })).toHaveValue('cc')
    })

    it('renders the email field', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    })

    it('renders the password field', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    })

    it('renders the confirm password field', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
    })

    it('renders the submit button', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument()
    })
  })

  describe('form interaction', () => {
    it('updates first name value on input', () => {
      renderWithProviders(<Signup />)
      const input = screen.getByLabelText('Nombres')
      fireEvent.change(input, { target: { value: 'Ana' } })
      expect(input).toHaveValue('Ana')
    })

    it('updates last name value on input', () => {
      renderWithProviders(<Signup />)
      const input = screen.getByLabelText('Apellidos')
      fireEvent.change(input, { target: { value: 'García' } })
      expect(input).toHaveValue('García')
    })

    it('updates document id value on input', () => {
      renderWithProviders(<Signup />)
      const input = screen.getByLabelText('Número de documento de identidad')
      fireEvent.change(input, { target: { value: '12345678' } })
      expect(input).toHaveValue('12345678')
    })

    it('updates document type on change', () => {
      renderWithProviders(<Signup />)
      const select = screen.getByRole('combobox', { name: 'Tipo de documento' })
      fireEvent.change(select, { target: { value: 'passport' } })
      expect(select).toHaveValue('passport')
    })

    it('updates email value on input', () => {
      renderWithProviders(<Signup />)
      const input = screen.getByLabelText('Correo')
      fireEvent.change(input, { target: { value: 'ana@mail.com' } })
      expect(input).toHaveValue('ana@mail.com')
    })

    it('updates password value on input', () => {
      renderWithProviders(<Signup />)
      const input = screen.getByLabelText('Contraseña')
      fireEvent.change(input, { target: { value: 'secret123' } })
      expect(input).toHaveValue('secret123')
    })

    it('updates confirm password value on input', () => {
      renderWithProviders(<Signup />)
      const input = screen.getByLabelText('Confirmar contraseña')
      fireEvent.change(input, { target: { value: 'secret123' } })
      expect(input).toHaveValue('secret123')
    })

    it('email field has type email', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Correo')).toHaveAttribute('type', 'email')
    })

    it('password field has type password', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    })

    it('confirm password field has type password', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByLabelText('Confirmar contraseña')).toHaveAttribute('type', 'password')
    })
  })

  describe('validation', () => {
    it('submit button is disabled initially', () => {
      renderWithProviders(<Signup />)
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled()
    })

    it('shows no errors on initial render', () => {
      renderWithProviders(<Signup />)
      expect(screen.queryByText('Este campo es obligatorio')).not.toBeInTheDocument()
    })

    it('shows required error after blur on empty first name', () => {
      renderWithProviders(<Signup />)
      fireEvent.blur(screen.getByLabelText('Nombres'))
      expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument()
    })

    it('shows required error after blur on empty document id', () => {
      renderWithProviders(<Signup />)
      fireEvent.blur(screen.getByLabelText('Número de documento de identidad'))
      expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument()
    })

    it('shows invalid email error after blur on bad email', () => {
      renderWithProviders(<Signup />)
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'notvalid' } })
      fireEvent.blur(screen.getByLabelText('Correo'))
      expect(screen.getByText('Ingresa un correo electrónico válido')).toBeInTheDocument()
    })

    it('shows password min length error after blur on short password', () => {
      renderWithProviders(<Signup />)
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'short' } })
      fireEvent.blur(screen.getByLabelText('Contraseña'))
      expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
    })

    it('shows mismatch error after blur on mismatching confirm password', () => {
      renderWithProviders(<Signup />)
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'different' } })
      fireEvent.blur(screen.getByLabelText('Confirmar contraseña'))
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
    })

    it('shows terms error after checking then unchecking', () => {
      renderWithProviders(<Signup />)
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      fireEvent.click(checkbox)
      expect(screen.getByText('Debes aceptar los términos y condiciones')).toBeInTheDocument()
    })

    it('enables submit button when all fields are valid and terms are accepted', () => {
      renderWithProviders(<Signup />)
      fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana' } })
      fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'García' } })
      fireEvent.change(screen.getByLabelText('Número de documento de identidad'), { target: { value: '12345678' } })
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('checkbox'))
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).not.toBeDisabled()
    })

    it('keeps submit disabled when terms are not accepted', () => {
      renderWithProviders(<Signup />)
      fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana' } })
      fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'García' } })
      fireEvent.change(screen.getByLabelText('Número de documento de identidad'), { target: { value: '12345678' } })
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled()
    })

    it('keeps submit disabled when document id is missing', () => {
      renderWithProviders(<Signup />)
      fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana' } })
      fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'García' } })
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('checkbox'))
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled()
    })
  })

  describe('API integration', () => {
    const privacyNoticeResponse = {
      ok: true,
      json: async () => ({
        iso_code: 'CO', jurisdiction_name: 'Colombia', applicable_regulation: 'Ley 1581',
        privacy_title: 'Aviso de privacidad', privacy_content: 'Contenido',
        privacy_pdf_url: [], privacy_version: '1.0',
        privacy_effective_at: '2024-01-01', privacy_contact_email: 'privacy@example.com',
      }),
    }

    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana' } })
      fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'García' } })
      fireEvent.change(screen.getByLabelText('Número de documento de identidad'), { target: { value: '12345678' } })
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('checkbox'))
    }

    it('fetches privacy notice on mount using the selected country code', async () => {
      const mockFetch = vi.fn().mockResolvedValue(privacyNoticeResponse)
      vi.stubGlobal('fetch', mockFetch)

      renderWithProviders(<Signup />)

      await waitFor(() => {
        const privacyCall = mockFetch.mock.calls.find((call: unknown[]) => (call[0] as string)?.includes('/privacy/notices/'))
        expect(privacyCall).toBeDefined()
        expect(privacyCall![0]).toContain('/privacy/notices/CO')
      })
    })

    it('calls fetch with the correct payload on submit', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(privacyNoticeResponse)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'created', sprint: 1, hu_id: 'HU-REG-001',
            user_id: 1, guest_id: 1, username: 'ana_abc123',
            email: 'ana@example.com', role: 'GUEST', jurisdiction_id: 1,
            message: 'User registered successfully.',
          }),
        })
      vi.stubGlobal('fetch', mockFetch)

      renderWithProviders(<Signup />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      await waitFor(() => {
        const registerCall = mockFetch.mock.calls.find((call: unknown[]) => (call[1] as RequestInit)?.body)
        expect(registerCall).toBeDefined()
        const [, options] = registerCall as [string, RequestInit]
        const body = JSON.parse(options.body as string)
        expect(body.first_name).toBe('Ana')
        expect(body.last_name).toBe('García')
        expect(body.document_id).toBe('12345678')
        expect(body.document_type_id).toBe(1)
        expect(body.jurisdiction_id).toBe(1)
        expect(body.email).toBe('ana@example.com')
        expect(body.password).toBe('password123')
        expect(body.password_confirmation).toBe('password123')
      })
    })

    it('shows conflict error message on 409 response', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(privacyNoticeResponse)
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ detail: 'Email is already registered.' }),
        })
      vi.stubGlobal('fetch', mockFetch)

      renderWithProviders(<Signup />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      await waitFor(() => {
        expect(screen.getByText('Este correo ya está registrado.')).toBeInTheDocument()
      })
    })

    it('shows generic error message on network failure', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(privacyNoticeResponse)
        .mockRejectedValueOnce(new Error('Network error'))
      vi.stubGlobal('fetch', mockFetch)

      renderWithProviders(<Signup />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      await waitFor(() => {
        expect(screen.getByText('Ocurrió un error al registrarte. Intenta de nuevo.')).toBeInTheDocument()
      })
    })
  })

  describe('privacy notice modal', () => {
    const privacyNoticeResponse = {
      ok: true,
      json: async () => ({
        iso_code: 'CO', jurisdiction_name: 'Colombia', applicable_regulation: 'Ley 1581',
        privacy_title: 'Aviso de Privacidad', privacy_content: 'Contenido de privacidad.',
        privacy_pdf_url: ['https://example.com/privacy.pdf'], privacy_version: '1.0',
        privacy_effective_at: '2024-01-01', privacy_contact_email: 'privacy@example.com',
      }),
    }

    it('opens the modal when clicking the terms link', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(privacyNoticeResponse))
      renderWithProviders(<Signup />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(i18n.t('signup.termsLink')))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Aviso de Privacidad')).toBeInTheDocument()
        expect(screen.getByText('Contenido de privacidad.')).toBeInTheDocument()
      })
    })

    it('closes the modal when clicking the close button', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(privacyNoticeResponse))
      renderWithProviders(<Signup />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(i18n.t('signup.termsLink')))
        expect(screen.getByText('Aviso de Privacidad')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
      expect(document.querySelector('.modal__panel--open')).not.toBeInTheDocument()
    })
  })

  describe('i18n', () => {
    it('renders in English when language is en-US', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderWithProviders(<Signup />)
      expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument()
      expect(screen.getByLabelText('First name')).toBeInTheDocument()
      expect(screen.getByLabelText('Last name')).toBeInTheDocument()
      expect(screen.getByLabelText('Identity document number')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
    })
  })
})
