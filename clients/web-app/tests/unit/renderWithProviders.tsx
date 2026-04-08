import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { I18nProvider } from '@/context/I18nContext'
import { SearchProvider } from '@/context/SearchContext'

export const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <SearchProvider>
          <AuthProvider>
            {ui}
          </AuthProvider>
        </SearchProvider>
      </I18nProvider>
    </MemoryRouter>
  )

export const renderWithSearchProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <AuthProvider>
          <SearchProvider>{ui}</SearchProvider>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  )
