import { formatDateRangeLabel, formatGuestsLabel, todayIso } from '../../../src/utils/searchFormat';

describe('searchFormat utils', () => {
  it('returns fallback range when check-in is invalid', () => {
    expect(formatDateRangeLabel('bad-date', '2025-12-10')).toBe('bad-date - 2025-12-10');
  });

  it('returns fallback when date parses to invalid Date object', () => {
    expect(formatDateRangeLabel('100000000000000000000-01-01', '2025-12-10'))
      .toBe('100000000000000000000-01-01 - 2025-12-10');
  });

  it('returns fallback range when check-out is invalid', () => {
    expect(formatDateRangeLabel('2025-12-01', 'bad-date')).toBe('2025-12-01 - bad-date');
  });

  it('formats valid date ranges in es-CO', () => {
    const label = formatDateRangeLabel('2025-12-01', '2025-12-10');
    expect(label).toContain('dic');
    expect(label).toContain('–');
  });

  it('formats guest labels for singular and plural', () => {
    expect(formatGuestsLabel(1, 0)).toBe('1 huésped');
    expect(formatGuestsLabel(2, 1)).toBe('3 huéspedes');
  });

  it('returns today date in iso-like format', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
