import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import Login from '@/pages/Login'
import { UserRole } from '@/types/user'
import { renderWithProviders } from '../renderWithProviders'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
  vi.restoreAllMocks()
  mockNavigate.mockReset()
})

describe('Login', () => {
  describe('rendering', () => {
    it('renders the page title', () => {
      renderWithProviders(<Login />)
      expect(screen.getByRole('heading', { name: 'Inicia sesión en tu cuenta' })).toBeInTheDocument()
    })

    it('renders the register link', () => {
      renderWithProviders(<Login />)
      expect(screen.getByText('¿No tienes cuenta?')).toBeInTheDocument()
      expect(screen.getByText('Regístrate')).toBeInTheDocument()
    })

    it('renders the email field', () => {
      renderWithProviders(<Login />)
      expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    })

    it('renders the password field', () => {
      renderWithProviders(<Login />)
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    })

    it('renders the submit button', () => {
      renderWithProviders(<Login />)
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })

    it('renders the email placeholder', () => {
      renderWithProviders(<Login />)
      expect(screen.getByPlaceholderText('email@mail.com')).toBeInTheDocument()
    })
  })

  describe('form interaction', () => {
    it('updates email value on input', () => {
      renderWithProviders(<Login />)
      const emailInput = screen.getByLabelText('Correo')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('updates password value on input', () => {
      renderWithProviders(<Login />)
      const passwordInput = screen.getByLabelText('Contraseña')
      fireEvent.change(passwordInput, { target: { value: 'secret123' } })
      expect(passwordInput).toHaveValue('secret123')
    })

    it('email field has type email', () => {
      renderWithProviders(<Login />)
      expect(screen.getByLabelText('Correo')).toHaveAttribute('type', 'email')
    })

    it('password field has type password', () => {
      renderWithProviders(<Login />)
      expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    })
  })

  describe('validation', () => {
    it('submit button is disabled initially', () => {
      renderWithProviders(<Login />)
      expect(screen.getByRole('button', { name: 'Login' })).toBeDisabled()
    })

    it('shows no errors on initial render', () => {
      renderWithProviders(<Login />)
      expect(screen.queryByText('Este campo es obligatorio')).not.toBeInTheDocument()
    })

    it('shows required error after blur on empty email', () => {
      renderWithProviders(<Login />)
      fireEvent.blur(screen.getByLabelText('Correo'))
      expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument()
    })

    it('shows invalid email error after blur on bad format', () => {
      renderWithProviders(<Login />)
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'notanemail' } })
      fireEvent.blur(screen.getByLabelText('Correo'))
      expect(screen.getByText('Ingresa un correo electrónico válido')).toBeInTheDocument()
    })

    it('shows required error after blur on empty password', () => {
      renderWithProviders(<Login />)
      fireEvent.blur(screen.getByLabelText('Contraseña'))
      expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument()
    })

    it('applies error border class to email box on invalid email', () => {
      const { container } = renderWithProviders(<Login />)
      fireEvent.blur(screen.getByLabelText('Correo'))
      const emailBox = container.querySelector('.login-card__field:first-of-type .input-box')
      expect(emailBox).toHaveClass('input-box--error')
    })

    it('enables submit button when form is valid', () => {
      renderWithProviders(<Login />)
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'user@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret' } })
      expect(screen.getByRole('button', { name: 'Login' })).not.toBeDisabled()
    })

    it('disables submit button when email becomes invalid again', () => {
      renderWithProviders(<Login />)
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'user@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret' } })
      expect(screen.getByRole('button', { name: 'Login' })).not.toBeDisabled()
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: '' } })
      expect(screen.getByRole('button', { name: 'Login' })).toBeDisabled()
    })
  })

  describe('i18n', () => {
    it('renders in English when language is en-US', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderWithProviders(<Login />)
      expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })
  })

  describe('API integration', () => {
    const loginSuccessResponse = {
      ok: true,
      json: async () => ({
        status: 'authenticated',
        sprint: 1,
        hu_id: 'HU001',
        message: 'Login successful.',
        user: { user_id: 1, username: 'test_user', email: 'user@example.com', role: UserRole.GUEST, is_active: true },
        permissions: ['ACCESS WEB APP'],
        session_ttl_seconds: 900,
        session_expires_at: '2026-04-01T01:10:39.920987Z',
      }),
    }

    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'user@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123' } })
    }

    it('calls fetch with the correct payload on submit', async () => {
      const mockFetch = vi.fn().mockResolvedValue(loginSuccessResponse)
      vi.stubGlobal('fetch', mockFetch)

      renderWithProviders(<Login />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
        expect(url).toContain('/identity/auth/web/login')
        const body = JSON.parse(options.body as string)
        expect(body.email).toBe('user@example.com')
        expect(body.password).toBe('secret123')
      })
    })

    it('shows success snackbar on successful login', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(loginSuccessResponse))

      renderWithProviders(<Login />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('¡Inicio de sesión exitoso! Redirigiendo...')
      })
    })

    it('shows error snackbar on failed login', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials.' }),
      }))

      renderWithProviders(<Login />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos. Intenta de nuevo.')
      })
    })

    it('shows error snackbar on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      renderWithProviders(<Login />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos. Intenta de nuevo.')
      })
    })

    it('persists session to localStorage on successful login', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(loginSuccessResponse))

      renderWithProviders(<Login />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('travel-hub-auth')!)
        expect(stored.user.email).toBe('user@example.com')
        expect(stored.permissions).toContain('ACCESS WEB APP')
        expect(stored.sessionExpiresAt).toBe('2026-04-01T01:10:39.920987Z')
      })
    })

    it('disables submit button while loading', async () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

      renderWithProviders(<Login />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Login' })).toBeDisabled()
      })
    })

    it('navigates to / after successful login with GUEST role', async () => {
      const realSetTimeout = window.setTimeout
      vi.spyOn(window, 'setTimeout').mockImplementation(
        ((fn: (...a: unknown[]) => void, delay?: number, ...args: unknown[]) => {
          if (delay === 2000) { fn(...args); return 0 }
          return realSetTimeout(fn as TimerHandler, delay, ...args)
        }) as typeof setTimeout
      )
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(loginSuccessResponse))

      renderWithProviders(<Login />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
    })

    it('navigates to /portal/dashboard after successful login with STAFF role', async () => {
      const realSetTimeout = window.setTimeout
      vi.spyOn(window, 'setTimeout').mockImplementation(
        ((fn: (...a: unknown[]) => void, delay?: number, ...args: unknown[]) => {
          if (delay === 2000) { fn(...args); return 0 }
          return realSetTimeout(fn as TimerHandler, delay, ...args)
        }) as typeof setTimeout
      )
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'authenticated',
          sprint: 1,
          hu_id: 'HU001',
          message: 'Login successful.',
          user: { user_id: 2, username: 'staff_user', email: 'staff@example.com', role: UserRole.STAFF, is_active: true },
          permissions: ['ACCESS WEB APP', 'MANAGE ACCOMMODATIONS'],
          session_ttl_seconds: 900,
          session_expires_at: '2026-04-01T01:10:39.920987Z',
        }),
      }))

      renderWithProviders(<Login />)
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/portal/dashboard')
      })
    })
  })
})
