import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/context/I18nContext'
import ReservationCard from '@/components/ReservationCard'

const renderCard = (props: Partial<React.ComponentProps<typeof ReservationCard>> = {}) => {
  const onCancel = vi.fn()
  render(
    <MemoryRouter>
      <I18nProvider>
        <ReservationCard
          id="res-1"
          imageUrl="https://example.com/res.jpg"
          accommodationName="Aonang Villa Resort"
          location="Cartagena, Colombia"
          arrival={new Date(2026, 1, 21)}
          departure={new Date(2026, 2, 16)}
          guestCount={2}
          onCancel={onCancel}
          {...props}
        />
      </I18nProvider>
    </MemoryRouter>,
  )
  return { onCancel }
}

describe('ReservationCard', () => {
  it('renders reservation details and cancel action by default', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Aonang Villa Resort' })).toBeInTheDocument()
    expect(screen.getAllByText('Cartagena, Colombia')).toHaveLength(2)
    expect(screen.getByText('Fechas')).toBeInTheDocument()
    expect(screen.getByText('Llegada')).toBeInTheDocument()
    expect(screen.getByText('Salida')).toBeInTheDocument()
    expect(screen.getByText('21 Feb')).toBeInTheDocument()
    expect(screen.getByText('16 Mar')).toBeInTheDocument()
    expect(screen.getByText('Huéspedes')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Cancelar reserva' }).length).toBe(2)
  })

  it('calls onCancel when cancel button is clicked', () => {
    const { onCancel } = renderCard()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar reserva' })[0])
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('hides cancel action when showCancel is false', () => {
    renderCard({ showCancel: false })
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument()
  })

  it('renders singular guest label in compact metadata', () => {
    renderCard({ guestCount: 1 })
    expect(screen.getByText('1 huésped')).toBeInTheDocument()
  })
})
