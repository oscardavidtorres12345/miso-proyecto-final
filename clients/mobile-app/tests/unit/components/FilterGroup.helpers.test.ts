import { clearDebounceTimer } from '../../../src/components/search/FilterGroup';

describe('FilterGroup helpers', () => {
  it('clears timer only when present', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    clearDebounceTimer(null);
    expect(clearSpy).not.toHaveBeenCalled();

    const timer = setTimeout(() => {}, 1);
    clearDebounceTimer(timer);
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
