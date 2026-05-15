import i18n, { getLocale, setLocale, t, tCount } from '../../../src/i18n';

describe('i18n index', () => {
  afterEach(async () => {
    await setLocale('es-CO');
  });

  it('changes locale and resolves translated keys', async () => {
    await setLocale('en-US');
    expect(getLocale()).toBe('en-US');
    expect(t('search.destination')).toBe('Destination');
  });

  it('falls back to es-CO when key is missing in current locale', async () => {
    await setLocale('en-US');
    expect(t('filters.service.bathtub')).toBe('Bathtub');
    expect(t('non.existent.key')).toBe('non.existent.key');
  });

  it('supports interpolation and plural helper', async () => {
    await setLocale('es-CO');
    expect(t('filters.searchIn', { title: 'servicios' })).toBe('Busca por servicios');
    expect(t('filters.searchIn', {} as any)).toBe('Busca por {{title}}');
    expect(tCount('search.nights', 1)).toBe('1 noche');
    expect(tCount('search.nights', 3)).toBe('3 noches');
  });

  it('resolves bookings copy in es-CO and en-US', async () => {
    await setLocale('es-CO');
    expect(t('bookings.myReservationsTitle')).toBe('Mis reservas');
    expect(tCount('bookings.guestCount', 1)).toBe('1 huésped');
    await setLocale('en-US');
    expect(t('bookings.pastTripsTitle')).toBe('Past trips');
    expect(tCount('bookings.guestCount', 2)).toBe('2 guests');
  });

  it('exposes i18n instance as default export', () => {
    expect(i18n).toBeDefined();
    expect(typeof i18n.t).toBe('function');
    expect(typeof i18n.changeLanguage).toBe('function');
  });

});
