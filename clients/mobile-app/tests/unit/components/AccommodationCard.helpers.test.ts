import { formatPrice, getRatingLabel, safeFixed } from '../../../src/components/search/AccommodationCard';

describe('AccommodationCard helpers', () => {
  it('covers all rating label branches', () => {
    expect(getRatingLabel(null)).toBe('');
    expect(getRatingLabel(undefined)).toBe('');
    expect(getRatingLabel(9.2)).toBe('Excepcional');
    expect(getRatingLabel(8.6)).toBe('Excelente');
    expect(getRatingLabel(7.4)).toBe('Muy bien');
    expect(getRatingLabel(5.2)).toBe('Bien');
    expect(getRatingLabel(4.9)).toBe('Aceptable');
  });

  it('formats price for valid/invalid values', () => {
    expect(formatPrice(null)).toBe('–');
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe('–');
    expect(formatPrice(1234.6)).toBe('1.235');
  });

  it('formats safe fixed value for valid/invalid values', () => {
    expect(safeFixed(null)).toBe('–');
    expect(safeFixed(Number.NaN)).toBe('–');
    expect(safeFixed(8.76)).toBe('8.8');
    expect(safeFixed(8.765, 2)).toBe('8.77');
  });
});
