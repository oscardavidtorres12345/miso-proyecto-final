import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import Header from '@/components/Header'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => { i18n.changeLanguage('es') })

const renderHeader = (props: React.ComponentProps<typeof Header> = {}) =>
  renderWithProviders(<Header {...props} />)

describe('Header', () => {
  describe('rendering', () => {
    it('renders the logo image always', () => {
      renderHeader()
      expect(screen.getByAltText('Travel Hub')).toBeInTheDocument()
    })

    it('does not render any action by default', () => {
      renderHeader()
      expect(screen.queryByRole('button', { name: 'Cart' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Seleccionar país' })).not.toBeInTheDocument()
    })
  })

  describe('showCart', () => {
    it('renders the cart button when showCart is true', () => {
      renderHeader({ showCart: true })
      expect(screen.getByRole('button', { name: 'Cart' })).toBeInTheDocument()
    })

    it('does not render the cart button when showCart is false', () => {
      renderHeader({ showCart: false })
      expect(screen.queryByRole('button', { name: 'Cart' })).not.toBeInTheDocument()
    })
  })

  describe('showLogin', () => {
    it('renders the login button when showLogin is true', () => {
      renderHeader({ showLogin: true })
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })

    it('renders with outline style', () => {
      renderHeader({ showLogin: true })
      expect(screen.getByRole('button', { name: 'Login' })).toHaveClass('btn--outline')
    })

    it('does not render the login button when showLogin is false', () => {
      renderHeader({ showLogin: false })
      expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument()
    })
  })

  describe('showMenu', () => {
    it('renders the menu button when showMenu is true', () => {
      renderHeader({ showMenu: true })
      expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument()
    })

    it('does not render the menu button when showMenu is false', () => {
      renderHeader({ showMenu: false })
      expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
    })

    it('does not show dropdown initially', () => {
      renderHeader({ showMenu: true })
      expect(screen.queryByText('Mis reservas')).not.toBeInTheDocument()
    })

    it('shows dropdown when menu button is clicked', () => {
      renderHeader({ showMenu: true })
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      expect(screen.getByText('Mis reservas')).toBeInTheDocument()
    })

    it('hides dropdown when menu button is clicked again', () => {
      renderHeader({ showMenu: true })
      const menuBtn = screen.getByRole('button', { name: 'Menu' })
      fireEvent.click(menuBtn)
      fireEvent.click(menuBtn)
      expect(screen.queryByText('Mis reservas')).not.toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', () => {
      renderHeader({ showMenu: true })
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      expect(screen.getByText('Mis reservas')).toBeInTheDocument()
      fireEvent.mouseDown(document.body)
      expect(screen.queryByText('Mis reservas')).not.toBeInTheDocument()
    })
  })

  describe('showFlag', () => {
    it('renders the flag button when showFlag is true', () => {
      renderHeader({ showFlag: true })
      expect(screen.getByRole('button', { name: 'Seleccionar país' })).toBeInTheDocument()
    })

    it('does not render the flag button when showFlag is false', () => {
      renderHeader({ showFlag: false })
      expect(screen.queryByRole('button', { name: 'Seleccionar país' })).not.toBeInTheDocument()
    })

    it('renders with Colombia selected by default', () => {
      renderHeader({ showFlag: true })
      expect(screen.getByAltText('Colombia')).toBeInTheDocument()
    })

    it('does not show flag options initially', () => {
      renderHeader({ showFlag: true })
      expect(screen.queryByText('Argentina')).not.toBeInTheDocument()
    })

    it('shows all country options when flag button is clicked', () => {
      renderHeader({ showFlag: true })
      fireEvent.click(screen.getByRole('button', { name: 'Seleccionar país' }))
      expect(screen.getByText('Colombia')).toBeInTheDocument()
      expect(screen.getByText('Argentina')).toBeInTheDocument()
      expect(screen.getByText('Estados Unidos')).toBeInTheDocument()
    })

    it('updates selected flag and closes dropdown on country selection', () => {
      renderHeader({ showFlag: true })
      fireEvent.click(screen.getByRole('button', { name: 'Seleccionar país' }))
      fireEvent.click(screen.getByText('Argentina'))
      expect(screen.queryByText('Colombia')).not.toBeInTheDocument()
      expect(screen.getByAltText('Argentina')).toBeInTheDocument()
    })

    it('closes flag dropdown when clicking outside', () => {
      renderHeader({ showFlag: true })
      fireEvent.click(screen.getByRole('button', { name: 'Seleccionar país' }))
      expect(screen.getByText('Argentina')).toBeInTheDocument()
      fireEvent.mouseDown(document.body)
      expect(screen.queryByText('Argentina')).not.toBeInTheDocument()
    })

    it('switches to English when United States is selected', () => {
      renderHeader({ showFlag: true, showMenu: true })
      fireEvent.click(screen.getByRole('button', { name: 'Seleccionar país' }))
      fireEvent.click(screen.getByText('Estados Unidos'))
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      expect(screen.getByText('My bookings')).toBeInTheDocument()
    })

    it('stays in Spanish when Colombia is selected', () => {
      renderHeader({ showFlag: true, showMenu: true })
      fireEvent.click(screen.getByRole('button', { name: 'Seleccionar país' }))
      fireEvent.click(screen.getByText('Colombia'))
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      expect(screen.getByText('Mis reservas')).toBeInTheDocument()
    })
  })
})
