import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import Unauthorized from '@/pages/Unauthorized'
import { renderWithProviders } from '../renderWithProviders'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
  mockNavigate.mockClear()
})

describe('Unauthorized', () => {
  it('renders the 401 code', () => {
    renderWithProviders(<Unauthorized />)
    expect(screen.getByText('401')).toBeInTheDocument()
  })

  it('renders the title', () => {
    renderWithProviders(<Unauthorized />)
    expect(screen.getByRole('heading', { name: 'Acceso restringido' })).toBeInTheDocument()
  })

  it('renders the description', () => {
    renderWithProviders(<Unauthorized />)
    expect(screen.getByText('Necesitas iniciar sesión para ver esta página.')).toBeInTheDocument()
  })

  it('renders the login button', () => {
    renderWithProviders(<Unauthorized />)
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('navigates to /login when the button is clicked', () => {
    renderWithProviders(<Unauthorized />)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('renders in English when language is en-US', () => {
    localStorage.setItem('travel-hub-country', 'us')
    renderWithProviders(<Unauthorized />)
    expect(screen.getByRole('heading', { name: 'Restricted access' })).toBeInTheDocument()
    expect(screen.getByText('You need to log in to view this page.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })
})
