import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import Login from '@/pages/Login'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => { i18n.changeLanguage('es') })

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

  describe('i18n', () => {
    it('renders in English when language is en', () => {
      i18n.changeLanguage('en')
      renderWithProviders(<Login />)
      expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })
  })
})
