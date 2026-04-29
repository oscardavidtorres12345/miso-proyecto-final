import {
  buildFilterOptions,
  clearPriceDebounce,
  cloneFilters,
  getNights,
  getRawMeals,
  getRawServices,
  getRawStars,
  getRawTypes,
  hasActive,
  shouldApplyRequestResult,
} from '../../../src/screens/SearchScreen';

describe('SearchScreen helper functions', () => {
  it('clones nested filters without sharing references', () => {
    const original: any = {
      price: { min: '10', max: '20' },
      services: ['wifi'],
      accommodationTypes: ['hotel'],
      stars: ['4'],
      meals: ['breakfast'],
    };
    const cloned = cloneFilters(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.price).not.toBe(original.price);
  });

  it('detects active filters by price and arrays', () => {
    expect(
      hasActive({ price: { min: '', max: '' }, services: [], accommodationTypes: [], stars: [], meals: [] }),
    ).toBe(false);
    expect(
      hasActive({ price: { min: '1', max: '' }, services: [], accommodationTypes: [], stars: [], meals: [] }),
    ).toBe(true);
    expect(
      hasActive({ price: { min: '', max: '' }, services: ['wifi'], accommodationTypes: [], stars: [], meals: [] }),
    ).toBe(true);
  });

  it('builds filter options from amenities/services and handles fallback labels', () => {
    const optionsA = buildFilterOptions({
      amenities: [{ id: 'wifi', name: 'Wifi backend' }],
      accommodationTypes: [{ id: 'unknown_type', name: 'Tipo backend' }],
      meals: [{ id: 'breakfast', name: 'Desayuno backend' }],
      stars: [4],
    } as any);
    expect(optionsA.services[0].label).toBeTruthy();
    expect(optionsA.accommodationTypes[0].label).toBe('Tipo backend');
    expect(optionsA.meals[0].label).toBeTruthy();
    expect(optionsA.stars[0].label).toBe('★★★★');

    const optionsB = buildFilterOptions({
      services: [{ id: 'spa', name: 'Spa backend' }],
      accommodationTypes: [],
      meals: [],
      stars: [{ id: 'not-number' }],
    } as any);
    expect(optionsB.services[0].id).toBe('spa');
    expect(optionsB.stars[0].label).toBe('');
  });

  it('covers label translation branches for services/accommodation/meals', () => {
    const options = buildFilterOptions({
      amenities: [{ id: 'unknown_service', name: 'Servicio backend' }],
      accommodationTypes: [{ id: 'hotel', name: 'Hotel backend' }],
      meals: [{ id: 'unknown_meal', name: 'Comida backend' }],
      stars: [{ id: '3' }],
    } as any);

    expect(options.services[0].label).toBe('Servicio backend');
    expect(options.accommodationTypes[0].label).toBeTruthy();
    expect(options.meals[0].label).toBe('Comida backend');
    expect(options.stars[0].label).toBe('★★★');
  });

  it('falls back to id when translation is missing and name is absent', () => {
    const options = buildFilterOptions({
      amenities: [{ id: 'service_without_translation' }],
      accommodationTypes: [{ id: 'accommodation_without_translation' }],
      meals: [{ id: 'meal_without_translation' }],
      stars: [{ id: '0' }],
    } as any);

    expect(options.services[0].label).toBe('service_without_translation');
    expect(options.accommodationTypes[0].label).toBe('accommodation_without_translation');
    expect(options.meals[0].label).toBe('meal_without_translation');
    expect(options.stars[0].label).toBe('');
  });

  it('computes nights with valid and invalid ranges', () => {
    expect(getNights('2025-12-01', '2025-12-05')).toBe(4);
    expect(getNights('2025-12-05', '2025-12-01')).toBe(1);
    expect(getNights('bad', 'date')).toBe(1);
  });

  it('covers raw list helpers and request guards', () => {
    const apiA: any = {
      services: [{ id: 'wifi' }],
      accommodationTypes: null,
      meals: null,
      stars: null,
    };
    expect(getRawServices(apiA)).toEqual([{ id: 'wifi' }]);
    expect(getRawTypes(apiA)).toEqual([]);
    expect(getRawMeals(apiA)).toEqual([]);
    expect(getRawStars(apiA)).toEqual([]);

    const apiB: any = {
      amenities: [{ id: 'pool' }],
      accommodationTypes: [{ id: 'hotel' }],
      meals: [{ id: 'breakfast' }],
      stars: [3],
    };
    expect(getRawServices(apiB)).toEqual([{ id: 'pool' }]);
    expect(getRawTypes(apiB)).toEqual([{ id: 'hotel' }]);
    expect(getRawMeals(apiB)).toEqual([{ id: 'breakfast' }]);
    expect(getRawStars(apiB)).toEqual([3]);

    expect(shouldApplyRequestResult(false, 1, 1)).toBe(true);
    expect(shouldApplyRequestResult(true, 1, 1)).toBe(false);
    expect(shouldApplyRequestResult(false, 1, 2)).toBe(false);
  });

  it('clears debounce timer only when present', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    clearPriceDebounce(null);
    expect(clearSpy).not.toHaveBeenCalled();
    const t = setTimeout(() => {}, 1);
    clearPriceDebounce(t);
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
