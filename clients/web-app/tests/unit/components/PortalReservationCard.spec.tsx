import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/context/I18nContext'
import i18n from '@/i18n'
import PortalReservationCard from '@/components/PortalReservationCard'

const renderCard = (props: Partial<React.ComponentProps<typeof PortalReservationCard>> = {}) => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  render(
    <MemoryRouter>
      <I18nProvider>
        <PortalReservationCard
          id="portal-res-1"
          userName="Ana Garcia"
          arrival="21 Feb"
          departure="16 Mar"
          roomType="Suite Junior"
          guestCount={2}
          onConfirm={onConfirm}
          onCancel={onCancel}
          {...props}
        />
      </I18nProvider>
    </MemoryRouter>,
  )

  return { onConfirm, onCancel }
}

describe('PortalReservationCard', () => {
  beforeEach(() => {
    i18n.changeLanguage('es-CO')
  })

  it('renders reservation information and actions', () => {
    renderCard()

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fechas' })).toBeInTheDocument()
    expect(screen.getByText('Llegada')).toBeInTheDocument()
    expect(screen.getByText('Salida')).toBeInTheDocument()
    expect(screen.getByText('21 Feb')).toBeInTheDocument()
    expect(screen.getByText('16 Mar')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Habitación' })).toBeInTheDocument()
    expect(screen.getByText('Suite Junior')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Huespedes' })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('renders singular guest label when guestCount is one', () => {
    renderCard({ guestCount: 1 })
    expect(screen.getByRole('heading', { name: 'Huesped' })).toBeInTheDocument()
  })

  it('calls action handlers when buttons are clicked', () => {
    const { onConfirm, onCancel } = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('hides confirm button when showConfirmButton is false', () => {
    renderCard({ showConfirmButton: false })
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})
