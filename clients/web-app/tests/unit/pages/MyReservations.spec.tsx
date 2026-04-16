import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '@/context/I18nContext'
import MyReservations from '@/pages/MyReservations'

describe('MyReservations', () => {
  it('renders page title, switch link and reservation cards', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <MyReservations />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Mis reservas' })).toBeInTheDocument()
    const switchLink = screen.getByRole('link', { name: 'Viajes anteriores' })
    expect(switchLink).toHaveAttribute('href', '/past-trips')
    expect(screen.getByRole('heading', { name: 'Aonang Villa Resort' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Suite Bocagrande Vista Mar' })).toBeInTheDocument()
  })
})
