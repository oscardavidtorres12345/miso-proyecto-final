import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { I18nProvider } from '@/context/I18nContext'
import { SearchProvider } from '@/context/SearchContext'
import { SessionCountdownProvider } from '@/context/SessionCountdownContext'

export const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <SearchProvider>
          <AuthProvider>
            <SessionCountdownProvider>
              <CartProvider>{ui}</CartProvider>
            </SessionCountdownProvider>
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
          <SessionCountdownProvider>
            <CartProvider>
              <SearchProvider>{ui}</SearchProvider>
            </CartProvider>
          </SessionCountdownProvider>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  )
