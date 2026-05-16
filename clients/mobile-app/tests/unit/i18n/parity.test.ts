import esCO from '../../../src/i18n/locales/es-CO';
import esAR from '../../../src/i18n/locales/es-AR';
import enUS from '../../../src/i18n/locales/en-US';

function flattenKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? flattenKeys(value, fullKey)
      : [fullKey];
  });
}

describe('i18n key parity', () => {
  const baseKeys = flattenKeys(esCO).sort();

  it('es-AR has the same keys as es-CO', () => {
    expect(flattenKeys(esAR).sort()).toEqual(baseKeys);
  });

  it('en-US has the same keys as es-CO', () => {
    expect(flattenKeys(enUS).sort()).toEqual(baseKeys);
  });
});
