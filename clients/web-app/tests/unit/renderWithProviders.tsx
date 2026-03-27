import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/context/I18nContext'

export const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <I18nProvider>
        {ui}
      </I18nProvider>
    </MemoryRouter>
  )
