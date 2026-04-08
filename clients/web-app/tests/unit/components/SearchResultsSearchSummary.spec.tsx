import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import SearchResultsSearchSummary from '@/components/SearchResultsSearchSummary'
import { renderWithSearchProviders } from '../renderWithProviders'

describe('SearchResultsSearchSummary', () => {
  it('renders edit search control with accessible name', () => {
    renderWithSearchProviders(<SearchResultsSearchSummary />)
    expect(screen.getByRole('button', { name: 'Editar búsqueda' })).toBeInTheDocument()
  })

  it('opens bottom sheet when summary button is clicked', async () => {
    const user = userEvent.setup()
    renderWithSearchProviders(<SearchResultsSearchSummary />)
    await user.click(screen.getByRole('button', { name: 'Editar búsqueda' }))
    expect(document.querySelector('.bottom-sheet__panel--open')).toBeInTheDocument()
  })

  it('closes bottom sheet when overlay is clicked', async () => {
    const user = userEvent.setup()
    const { container } = renderWithSearchProviders(<SearchResultsSearchSummary />)
    await user.click(screen.getByRole('button', { name: 'Editar búsqueda' }))
    const overlay = container.querySelector('.bottom-sheet__overlay--open')
    expect(overlay).toBeTruthy()
    await user.click(overlay!)
    expect(document.querySelector('.bottom-sheet__panel--open')).not.toBeInTheDocument()
  })
})
