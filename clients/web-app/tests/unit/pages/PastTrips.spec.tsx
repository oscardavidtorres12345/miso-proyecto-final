import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '@/context/I18nContext'
import PastTrips from '@/pages/PastTrips'

describe('PastTrips', () => {
  it('renders page title, switch link and past trip cards', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <PastTrips />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Mis viajes anteriores' })).toBeInTheDocument()
    const switchLink = screen.getByRole('link', { name: 'Reservas' })
    expect(switchLink).toHaveAttribute('href', '/reservations')
    expect(screen.getByRole('heading', { name: 'Aonang Villa Resort' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hotel Bocagrande Plaza' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Marina Santa Marta Suites' })).toBeInTheDocument()
  })
})
