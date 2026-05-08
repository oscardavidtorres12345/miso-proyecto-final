import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LANGUAGE_MAP, type LocaleCode } from '../i18n';

const COUNTRIES = [
  { code: 'co', label: 'Colombia' },
  { code: 'ar', label: 'Argentina' },
  { code: 'us', label: 'Estados Unidos' },
] as const;

export type Country = (typeof COUNTRIES)[number];
export { COUNTRIES };

const STORAGE_KEY = 'travel-hub-country';

interface LocaleContextValue {
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  locale: LocaleCode;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountryState] = useState<Country>(COUNTRIES[0]);
  const [locale, setLocaleState] = useState<LocaleCode>('es-CO');

  useEffect(() => {
    let isMounted = true;

    async function loadLocale() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) return;

        const country = COUNTRIES.find(c => c.code === saved) ?? COUNTRIES[0];
        const loc: LocaleCode = LANGUAGE_MAP[country.code] ?? 'es-CO';
        void i18n.changeLanguage(loc);
        setLocaleState(loc);
        setSelectedCountryState(country);
      } catch {
        if (!isMounted) return;

        const country = COUNTRIES[0];
        const loc: LocaleCode = LANGUAGE_MAP[country.code] ?? 'es-CO';
        void i18n.changeLanguage(loc);
        setLocaleState(loc);
        setSelectedCountryState(country);
      }
    }

    void loadLocale();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSetSelectedCountry(country: Country) {
    const loc: LocaleCode = LANGUAGE_MAP[country.code] ?? 'es-CO';
    void i18n.changeLanguage(loc);
    setLocaleState(loc);
    setSelectedCountryState(country);
    void AsyncStorage.setItem(STORAGE_KEY, country.code).catch(() => {});
  }

  return (
    <LocaleContext.Provider value={{ selectedCountry, setSelectedCountry: handleSetSelectedCountry, locale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
