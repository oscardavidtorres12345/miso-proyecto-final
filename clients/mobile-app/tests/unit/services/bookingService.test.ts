import { cancelBooking, createBookingHold, getUserBookings } from '../../../src/services/bookingService';

globalThis.fetch = jest.fn() as unknown as typeof fetch;

const mockOk = (data: unknown) =>
  Promise.resolve({ ok: true, json: async () => data } as Response);
const mockFail = () => Promise.resolve({ ok: false } as Response);

describe('bookingService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createBookingHold', () => {
    const payload = { userId: 'u1', roomId: 10, checkIn: '2025-12-01', checkOut: '2025-12-05', adults: 2 };
    const mockResponse = { bookingId: 'b1', status: 'HOLD' };

    it('calls the hold endpoint with POST', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      await createBookingHold(payload);

      const [url, options] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/bookings/hold');
      expect(options.method).toBe('POST');
    });

    it('sends the payload as JSON', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      await createBookingHold(payload);

      const options = (fetch as jest.Mock).mock.calls[0][1];
      expect(options.body).toBe(JSON.stringify(payload));
    });

    it('returns the hold response on success', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      const result = await createBookingHold(payload);
      expect(result).toEqual(mockResponse);
    });

    it('throws on failure', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockFail());
      await expect(createBookingHold(payload)).rejects.toThrow('Failed to create booking hold');
    });
  });

  describe('getUserBookings', () => {
    const mockData = { bookings: [{ bookingId: 'b1', status: 'CONFIRMED' }] };

    it('calls the bookings endpoint with userId as query param', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getUserBookings('u1');

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/bookings');
      expect(url).toContain('user_id=u1');
    });

    it('uses GET method', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      await getUserBookings('u1');

      expect((fetch as jest.Mock).mock.calls[0][1].method).toBe('GET');
    });

    it('returns user bookings on success', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockData));
      const result = await getUserBookings('u1');
      expect(result).toEqual(mockData);
    });

    it('throws on failure', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockFail());
      await expect(getUserBookings('u1')).rejects.toThrow('Failed to fetch user bookings');
    });
  });

  describe('cancelBooking', () => {
    const mockResponse = { bookingId: 'b1', status: 'CANCELLED' };

    it('calls the cancel endpoint for the given booking', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      await cancelBooking('b1');

      const [url, options] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/bookings/b1/cancel');
      expect(options.method).toBe('POST');
    });

    it('returns the cancel response on success', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      const result = await cancelBooking('b1');
      expect(result).toEqual(mockResponse);
    });

    it('throws on failure', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockFail());
      await expect(cancelBooking('b1')).rejects.toThrow('Failed to cancel booking');
    });
  });
});
