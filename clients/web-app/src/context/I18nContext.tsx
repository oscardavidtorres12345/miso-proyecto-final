import { createContext, useContext, useState } from 'react'
import i18n, { LANGUAGE_MAP } from '@/i18n'

export const COUNTRIES = [
  { code: 'co', label: 'Colombia' },
  { code: 'ar', label: 'Argentina' },
  { code: 'us', label: 'Estados Unidos' },
] as const

export type Country = typeof COUNTRIES[number]

interface I18nContextValue {
  selectedCountry: Country
  setSelectedCountry: (country: Country) => void
  language: string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedCountry, setSelectedCountryState] = useState<Country>(COUNTRIES[0])

  const setSelectedCountry = (country: Country) => {
    setSelectedCountryState(country)
    const lang = LANGUAGE_MAP[country.code] ?? 'es-CO'
    i18n.changeLanguage(lang)
  }

  const language = LANGUAGE_MAP[selectedCountry.code] ?? 'es-CO'

  return (
    <I18nContext.Provider value={{ selectedCountry, setSelectedCountry, language }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
