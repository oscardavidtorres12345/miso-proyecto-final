/* eslint-disable jest/no-disabled-tests */
// These tests are skipped because date and currency formatting via Intl API
// is out of MVP scope. Remove .skip and wire up a formatDate / formatCurrency
// utility in src/i18n when this feature enters the backlog.
describe('i18n date formats', () => {
  test.skip('formats date with Intl.DateTimeFormat for es-CO', () => {
    const date = new Date('2024-12-25');
    const formatted = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(date);
    expect(formatted).toBe('25 de diciembre de 2024');
  });

  test.skip('formats date with Intl.DateTimeFormat for es-AR', () => {
    const date = new Date('2024-12-25');
    const formatted = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(date);
    expect(formatted).toBe('25 de diciembre de 2024');
  });

  test.skip('formats date with Intl.DateTimeFormat for en-US', () => {
    const date = new Date('2024-12-25');
    const formatted = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
    expect(formatted).toBe('December 25, 2024');
  });
});

// These tests are skipped because currency formatting via Intl API
// is out of MVP scope. Remove .skip and wire up a formatCurrency utility
// in src/i18n when this feature enters the backlog.
describe('i18n currency formats', () => {
  test.skip('formats COP with Intl.NumberFormat for es-CO', () => {
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(150000);
    expect(formatted).toMatch(/150[\s.]?000/);
  });

  test.skip('formats ARS with Intl.NumberFormat for es-AR', () => {
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(150000);
    expect(formatted).toMatch(/150[\s.]?000/);
  });

  test.skip('formats USD with Intl.NumberFormat for en-US', () => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(99.99);
    expect(formatted).toBe('$99.99');
  });
});
