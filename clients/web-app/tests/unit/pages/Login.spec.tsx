import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import Login from '@/pages/Login'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
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
})
