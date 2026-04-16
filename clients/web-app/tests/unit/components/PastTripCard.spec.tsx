import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '@/context/I18nContext'
import PastTripCard from '@/components/PastTripCard'

const renderCard = (guestCount = 2) =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <PastTripCard
          imageUrl="https://example.com/past.jpg"
          accommodationName="Aonang Villa Resort"
          location="Cartagena, Colombia"
          arrival={new Date(2026, 1, 21)}
          departure={new Date(2026, 2, 16)}
          guestCount={guestCount}
        />
      </I18nProvider>
    </MemoryRouter>,
  )

describe('PastTripCard', () => {
  it('renders title and travel metadata', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Aonang Villa Resort' })).toBeInTheDocument()
    expect(screen.getByText('Cartagena, Colombia')).toBeInTheDocument()
    expect(screen.getByText('21 Feb - 16 Mar')).toBeInTheDocument()
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument()
  })

  it('renders singular guest label when count is one', () => {
    renderCard(1)
    expect(screen.getByText('1 huésped')).toBeInTheDocument()
  })
})
