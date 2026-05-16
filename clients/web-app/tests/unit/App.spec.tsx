import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import App from '@/App'
import { UserRole } from '@/types/user'

const setPath = (path: string) => {
  window.history.pushState({}, '', path)
}

const sessionFor = (role: UserRole) => ({
  user: { user_id: 1, username: 'test_user', email: 'test@mail.com', role, is_active: true },
  permissions: ['ACCESS WEB APP'],
  sessionExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  token: 'test-token',
})

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    setPath('/')
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    setPath('/')
  })

  it('renders the home route at /', async () => {
    render(<App />)
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /La vida es corta y el mundo es gigante/i })
      ).toBeInTheDocument()
    })
  })

  it('shows the header login action on the home route', () => {
    render(<App />)
    expect(document.querySelector('.header__login-btn')).toBeInTheDocument()
  })

  it('does not show the header login button on /login', () => {
    setPath('/login')
    render(<App />)
    expect(document.querySelector('.header__login-btn')).not.toBeInTheDocument()
  })

  it('navigates to the login page when the header login button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Inicia sesión en tu cuenta' })
      ).toBeInTheDocument()
    })
  })

  it('protects /cart and shows unauthorized when not authenticated', async () => {
    setPath('/cart')
    render(<App />)
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Acceso restringido' })
      ).toBeInTheDocument()
    })
  })

  it('protects /reservations and shows unauthorized when not authenticated', async () => {
    setPath('/reservations')
    render(<App />)
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Acceso restringido' })
      ).toBeInTheDocument()
    })
  })

  it('protects /past-trips and shows unauthorized when not authenticated', async () => {
    setPath('/past-trips')
    render(<App />)
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Acceso restringido' })
      ).toBeInTheDocument()
    })
  })

  it('renders the not found page for unknown paths', async () => {
    setPath('/ruta-inexistente')
    render(<App />)
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Página no encontrada' })
      ).toBeInTheDocument()
    })
  })

  it('renders /portal/feedback when authenticated as STAFF', async () => {
    localStorage.setItem('travel-hub-auth', JSON.stringify(sessionFor(UserRole.STAFF)))
    setPath('/portal/feedback')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Feedback' })).toBeInTheDocument()
    })
  })

  it('shows forbidden when a GUEST accesses /portal/feedback', async () => {
    localStorage.setItem('travel-hub-auth', JSON.stringify(sessionFor(UserRole.GUEST)))
    setPath('/portal/feedback')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('403')).toBeInTheDocument()
    })
  })

  it('applies cart layout class when pathname is /cart', async () => {
    setPath('/cart')
    const { container } = render(<App />)
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Acceso restringido' })
      ).toBeInTheDocument()
    })
    expect(container.querySelector('.app-layout__content--cart')).toBeInTheDocument()
  })

  it('applies cart layout class when pathname is /checkout', async () => {
    setPath('/checkout')
    const { container } = render(<App />)
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Acceso restringido' })
      ).toBeInTheDocument()
    })
    expect(container.querySelector('.app-layout__content--cart')).toBeInTheDocument()
  })
})
