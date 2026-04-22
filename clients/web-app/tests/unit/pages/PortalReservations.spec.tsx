import { act, fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import PortalReservations from '@/pages/PortalReservations'
import { renderWithProviders } from '../renderWithProviders'

describe('PortalReservations', () => {
  beforeEach(() => {
    i18n.changeLanguage('es-CO')
  })

  it('renders reservations from mock', () => {
    renderWithProviders(<PortalReservations />)

    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Confirmar' })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: 'Cancelar' })).toHaveLength(3)
    expect(screen.getByText('Suite Junior')).toBeInTheDocument()
    expect(screen.getByText('Suite Deluxe')).toBeInTheDocument()
    expect(screen.getByText('Habitacion Familiar')).toBeInTheDocument()
  })

  it('shows success snackbar and hides confirm button for confirmed reservation', () => {
    vi.useFakeTimers()
    renderWithProviders(<PortalReservations />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Confirmar' })[0])

    expect(screen.getByRole('alert')).toHaveTextContent('La reserva ha sido confirmada')
    expect(screen.getAllByRole('button', { name: 'Confirmar' })).toHaveLength(2)

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.getByRole('alert', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
    vi.useRealTimers()
  })
})
