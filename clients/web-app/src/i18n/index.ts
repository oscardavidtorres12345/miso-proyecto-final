import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import esCO from './locales/es-CO'
import esAR from './locales/es-AR'
import enUS from './locales/en-US'

export const LANGUAGE_MAP: Record<string, string> = {
  co: 'es-CO',
  ar: 'es-AR',
  us: 'en-US',
}

i18n.use(initReactI18next).init({
  resources: {
    'es-CO': { translation: esCO },
    'es-AR': { translation: esAR },
    'en-US': { translation: enUS },
  },
  lng: 'es-CO',
  fallbackLng: 'es-CO',
  interpolation: { escapeValue: false },
})

export default i18n
