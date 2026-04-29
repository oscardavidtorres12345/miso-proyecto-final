import esCO from './locales/es-CO';
import esAR from './locales/es-AR';
import enUS from './locales/en-US';

export type LocaleCode = 'es-CO' | 'es-AR' | 'en-US';

export const LANGUAGE_MAP: Record<string, LocaleCode> = {
  co: 'es-CO',
  ar: 'es-AR',
  us: 'en-US',
};

const resources: Record<LocaleCode, any> = {
  'es-CO': esCO,
  'es-AR': esAR,
  'en-US': enUS,
};

let currentLocale: LocaleCode = 'es-CO';

export function setLocale(locale: LocaleCode) {
  currentLocale = locale;
}

export function getLocale(): LocaleCode {
  return currentLocale;
}

function resolveKey(obj: any, key: string): string | undefined {
  const value = key.split('.').reduce<any>((acc, part) => acc?.[part], obj);
  return typeof value === 'string' ? value : undefined;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const template = resolveKey(resources[currentLocale], key) ?? resolveKey(resources['es-CO'], key);
  if (!template) return key;
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, token) => String(params[token] ?? ''));
}

export function tCount(baseKey: string, count: number): string {
  const key = `${baseKey}_${count === 1 ? 'one' : 'other'}`;
  return t(key, { count });
}
