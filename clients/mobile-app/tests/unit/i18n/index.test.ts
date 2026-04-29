import { getLocale, setLocale, t, tCount } from '../../../src/i18n';

describe('i18n index', () => {
  afterEach(() => {
    setLocale('es-CO');
  });

  it('changes locale and resolves translated keys', () => {
    setLocale('en-US');
    expect(getLocale()).toBe('en-US');
    expect(t('search.destination')).toBe('Destination');
  });

  it('falls back to es-CO when key is missing in current locale', () => {
    setLocale('en-US');
    expect(t('filters.service.bathtub')).toBe('Bathtub');
    expect(t('non.existent.key')).toBe('non.existent.key');
  });

  it('supports interpolation and plural helper', () => {
    setLocale('es-CO');
    expect(t('filters.searchIn', { title: 'servicios' })).toBe('Busca por servicios');
    expect(t('filters.searchIn', {} as any)).toBe('Busca por ');
    expect(tCount('search.nights', 1)).toBe('1 noche');
    expect(tCount('search.nights', 3)).toBe('3 noches');
  });
});
