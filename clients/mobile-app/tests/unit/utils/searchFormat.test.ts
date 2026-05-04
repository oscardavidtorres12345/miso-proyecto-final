import { formatDate, formatDateRangeLabel, formatGuestsLabel, todayIso } from '../../../src/utils/searchFormat';

describe('searchFormat utils', () => {
  describe('formatDate', () => {
    it('formats a date in es-CO locale (default)', () => {
      const date = new Date(2025, 11, 5);
      const result = formatDate(date);
      expect(result).toContain('5');
      expect(result).toContain('Di');
    });

    it('formats a date in en-US locale', () => {
      const date = new Date(2025, 11, 5);
      const result = formatDate(date, 'en-US');
      expect(result).toContain('5');
      expect(result).toContain('De');
    });

    it('uses es locale for non en-US locale codes', () => {
      const date = new Date(2025, 0, 15);
      const result = formatDate(date, 'es-AR');
      expect(result).toContain('15');
      expect(result).toContain('En');
    });

    it('returns day number correctly', () => {
      const date = new Date(2025, 5, 1);
      const result = formatDate(date);
      expect(result.startsWith('1 ')).toBe(true);
    });

    it('capitalizes the month abbreviation', () => {
      const date = new Date(2025, 2, 10);
      const result = formatDate(date);
      expect(result[result.indexOf(' ') + 1]).toEqual(result[result.indexOf(' ') + 1].toUpperCase());
    });
  });

  describe('formatDateRangeLabel', () => {
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

    it('returns fallback when both are invalid', () => {
      expect(formatDateRangeLabel('bad', 'date')).toBe('bad - date');
    });

    it('returns fallback when month part is zero in ISO string', () => {
      expect(formatDateRangeLabel('2025-00-10', '2025-12-01')).toBe('2025-00-10 - 2025-12-01');
    });

    it('formats valid date ranges in es-CO', () => {
      const label = formatDateRangeLabel('2025-12-01', '2025-12-10');
      expect(label).toContain('dic');
      expect(label).toContain('–');
    });

    it('separates dates with en-dash', () => {
      const label = formatDateRangeLabel('2025-01-01', '2025-01-31');
      expect(label).toContain('–');
    });
  });

  describe('formatGuestsLabel', () => {
    it('formats singular guest', () => {
      expect(formatGuestsLabel(1, 0)).toBe('1 huésped');
    });

    it('formats plural guests for adults + children', () => {
      expect(formatGuestsLabel(2, 1)).toBe('3 huéspedes');
    });

    it('formats plural for two adults', () => {
      expect(formatGuestsLabel(2, 0)).toBe('2 huéspedes');
    });

    it('formats zero guests as plural', () => {
      expect(formatGuestsLabel(0, 0)).toBe('0 huéspedes');
    });
  });

  describe('todayIso', () => {
    it('returns today date in iso-like format', () => {
      expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns the current date', () => {
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(todayIso()).toBe(expected);
    });
  });
});
