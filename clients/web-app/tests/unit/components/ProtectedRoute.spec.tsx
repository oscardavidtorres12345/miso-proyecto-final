import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import ProtectedRoute from '@/components/ProtectedRoute'
import { UserRole } from '@/types/user'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
})

const sessionFor = (role: UserRole) => ({
  user: { user_id: 1, username: 'test_user', email: 'test@mail.com', role, is_active: true },
  permissions: ['ACCESS WEB APP'],
  sessionExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
})

const validSession = sessionFor(UserRole.GUEST)

describe('ProtectedRoute', () => {
  it('renders the Unauthorized page when not authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('401')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('renders the children when authenticated', () => {
    localStorage.setItem('travel-hub-auth', JSON.stringify(validSession))
    renderWithProviders(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
    expect(screen.queryByText('401')).not.toBeInTheDocument()
  })

  it('renders Unauthorized when session is expired', () => {
    const expiredSession = {
      ...validSession,
      sessionExpiresAt: new Date(Date.now() - 1000).toISOString(),
    }
    localStorage.setItem('travel-hub-auth', JSON.stringify(expiredSession))
    renderWithProviders(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('401')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  describe('role-based access', () => {
    it('renders children when GUEST accesses a GUEST-only route', () => {
      localStorage.setItem('travel-hub-auth', JSON.stringify(sessionFor(UserRole.GUEST)))
      renderWithProviders(
        <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
          <div>Contenido para huésped</div>
        </ProtectedRoute>
      )
      expect(screen.getByText('Contenido para huésped')).toBeInTheDocument()
      expect(screen.queryByText('401')).not.toBeInTheDocument()
    })

    it('renders forbidden (403) when GUEST accesses a STAFF-only route', () => {
      localStorage.setItem('travel-hub-auth', JSON.stringify(sessionFor(UserRole.GUEST)))
      renderWithProviders(
        <ProtectedRoute allowedRoles={[UserRole.STAFF]}>
          <div>Contenido para staff</div>
        </ProtectedRoute>
      )
      expect(screen.getByText('403')).toBeInTheDocument()
      expect(screen.queryByText('Contenido para staff')).not.toBeInTheDocument()
    })

    it('renders children when STAFF accesses a STAFF-only route', () => {
      localStorage.setItem('travel-hub-auth', JSON.stringify(sessionFor(UserRole.STAFF)))
      renderWithProviders(
        <ProtectedRoute allowedRoles={[UserRole.STAFF]}>
          <div>Contenido para staff</div>
        </ProtectedRoute>
      )
      expect(screen.getByText('Contenido para staff')).toBeInTheDocument()
      expect(screen.queryByText('401')).not.toBeInTheDocument()
    })

    it('renders forbidden (403) when STAFF accesses a GUEST-only route', () => {
      localStorage.setItem('travel-hub-auth', JSON.stringify(sessionFor(UserRole.STAFF)))
      renderWithProviders(
        <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
          <div>Contenido para huésped</div>
        </ProtectedRoute>
      )
      expect(screen.getByText('403')).toBeInTheDocument()
      expect(screen.queryByText('Contenido para huésped')).not.toBeInTheDocument()
    })
  })
})
