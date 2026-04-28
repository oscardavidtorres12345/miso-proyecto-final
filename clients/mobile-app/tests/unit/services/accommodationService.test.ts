import { getHotelById } from '../../../src/services/accommodationService';

globalThis.fetch = jest.fn() as unknown as typeof fetch;

const mockOk = (data: unknown) =>
  Promise.resolve({ ok: true, json: async () => data } as Response);
const mockFail = () => Promise.resolve({ ok: false, json: async () => ({}) } as Response);

const mockHotel = { id: 1, name: 'Hotel Test', stars: 4, rating: { score: 4.5, reviewCount: 120 }, rooms: [] };

describe('accommodationService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getHotelById', () => {
    it('calls the correct URL for a given id', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockHotel));
      await getHotelById('42');

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/hotels/42');
    });

    it('uses GET method with Content-Type header', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockHotel));
      await getHotelById('1');

      expect((fetch as jest.Mock).mock.calls[0][1]).toEqual(
        expect.objectContaining({ method: 'GET', headers: { 'Content-Type': 'application/json' } }),
      );
    });

    it('returns the hotel data on success', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockHotel));
      const result = await getHotelById('1');
      expect(result).toEqual(mockHotel);
    });

    it('appends checkIn param when provided', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockHotel));
      await getHotelById('1', { checkIn: '2025-12-01' });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('check_in=2025-12-01');
    });

    it('appends checkOut param when provided', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockHotel));
      await getHotelById('1', { checkOut: '2025-12-05' });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('check_out=2025-12-05');
    });

    it('appends adults param when provided', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockHotel));
      await getHotelById('1', { adults: 2 });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('adults=2');
    });

    it('appends all search params together', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockHotel));
      await getHotelById('7', { checkIn: '2025-12-01', checkOut: '2025-12-05', adults: 3 });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/hotels/7');
      expect(url).toContain('check_in=2025-12-01');
      expect(url).toContain('check_out=2025-12-05');
      expect(url).toContain('adults=3');
    });

    it('throws when response is not ok', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockFail());
      await expect(getHotelById('99')).rejects.toThrow('Failed to fetch hotel details');
    });
  });
});
