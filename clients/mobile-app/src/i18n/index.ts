import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esCO from './locales/es-CO';
import esAR from './locales/es-AR';
import enUS from './locales/en-US';

export type LocaleCode = 'es-CO' | 'es-AR' | 'en-US';

export const LANGUAGE_MAP: Record<string, LocaleCode> = {
  co: 'es-CO',
  ar: 'es-AR',
  us: 'en-US',
};

i18n.use(initReactI18next).init({
  resources: {
    'es-CO': { translation: esCO },
    'es-AR': { translation: esAR },
    'en-US': { translation: enUS },
  },
  lng: 'es-CO',
  fallbackLng: 'es-CO',
  interpolation: { escapeValue: false },
  initImmediate: false,
});

export default i18n;

export function setLocale(locale: LocaleCode): void {
  void i18n.changeLanguage(locale);
}

export function getLocale(): LocaleCode {
  return i18n.language as LocaleCode;
}

export function t(key: string, params?: Record<string, string | number>): string {
  return i18n.t(key, params as any) as string;
}

export function tCount(baseKey: string, count: number): string {
  return i18n.t(baseKey, { count }) as string;
}
