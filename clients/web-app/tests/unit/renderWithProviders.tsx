import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { I18nProvider } from '@/context/I18nContext'

export const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  )
