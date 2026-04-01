import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import ProtectedRoute from '@/components/ProtectedRoute'
import { renderWithProviders } from '../renderWithProviders'

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
})

const validSession = {
  user: { user_id: 1, username: 'test_user', email: 'test@mail.com', role: 'GUEST', is_active: true },
  permissions: ['ACCESS WEB APP'],
  sessionExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}

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
})
