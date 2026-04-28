import { getSearchFilters, getSearchProperties } from '../../../src/services/searchService';

globalThis.fetch = jest.fn() as unknown as typeof fetch;

const mockOk = (data: unknown) =>
  Promise.resolve({ ok: true, json: async () => data } as Response);
const mockFail = (status = 400) =>
  Promise.resolve({ ok: false, status } as Response);

describe('searchService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getSearchFilters', () => {
    const query = { destination: 'Cartagena', checkIn: '2025-12-01', checkOut: '2025-12-05' };
    const mockData = { amenities: [], accommodationTypes: [], meals: [], stars: [3, 4, 5] };

    it('calls the correct endpoint with query params', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchFilters(query);

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/search/filters');
      expect(url).toContain('destination=Cartagena');
      expect(url).toContain('check_in=2025-12-01');
      expect(url).toContain('check_out=2025-12-05');
    });

    it('uses GET method', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchFilters(query);
      expect((fetch as jest.Mock).mock.calls[0][1]).toEqual({ method: 'GET' });
    });

    it('returns the parsed response', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      const result = await getSearchFilters(query);
      expect(result).toEqual(mockData);
    });

    it('throws when response is not ok', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockFail());
      await expect(getSearchFilters(query)).rejects.toThrow('Failed to fetch search filters.');
    });
  });

  describe('getSearchProperties', () => {
    const baseQuery = { destination: 'Bogotá', checkIn: '2025-12-01', checkOut: '2025-12-05' };
    const mockData = { results: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

    it('calls the correct endpoint', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchProperties(baseQuery);

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/search/properties');
      expect(url).toContain('destination=Bogot%C3%A1');
    });

    it('includes default values for optional numeric params', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchProperties(baseQuery);

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('adults=1');
      expect(url).toContain('children=0');
      expect(url).toContain('rooms=1');
      expect(url).toContain('pets=false');
      expect(url).toContain('page=1');
      expect(url).toContain('page_size=10');
    });

    it('includes priceMin and priceMax when provided', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchProperties({ ...baseQuery, priceMin: 100, priceMax: 500 });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('price_min=100');
      expect(url).toContain('price_max=500');
    });

    it('includes mealPlan when provided', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchProperties({ ...baseQuery, mealPlan: 'ALL_INCLUSIVE' });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('meal_plan=ALL_INCLUSIVE');
    });

    it('appends stars array as repeated params', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchProperties({ ...baseQuery, stars: [3, 4, 5] });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('stars=3');
      expect(url).toContain('stars=4');
      expect(url).toContain('stars=5');
    });

    it('appends amenities array as repeated params', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchProperties({ ...baseQuery, amenities: ['wifi', 'pool'] });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('amenities=wifi');
      expect(url).toContain('amenities=pool');
    });

    it('appends accommodationType array as repeated params', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchProperties({ ...baseQuery, accommodationType: ['HOTEL', 'HOSTEL'] });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('accommodation_type=HOTEL');
      expect(url).toContain('accommodation_type=HOSTEL');
    });

    it('skips array params when empty', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getSearchProperties({ ...baseQuery, stars: [], amenities: [] });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).not.toContain('stars=');
      expect(url).not.toContain('amenities=');
    });

    it('returns parsed response on success', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      const result = await getSearchProperties(baseQuery);
      expect(result).toEqual(mockData);
    });

    it('throws with status attached on non-ok response', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockFail(404));
      await expect(getSearchProperties(baseQuery)).rejects.toThrow('Failed to fetch properties.');
    });
  });
});
