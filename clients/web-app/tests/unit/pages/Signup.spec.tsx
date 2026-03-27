import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import Signup from '@/pages/Signup'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
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
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled()
    })
  })

  describe('i18n', () => {
    it('renders in English when language is en-US', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderWithProviders(<Signup />)
      expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument()
      expect(screen.getByLabelText('First name')).toBeInTheDocument()
      expect(screen.getByLabelText('Last name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
    })
  })
})
