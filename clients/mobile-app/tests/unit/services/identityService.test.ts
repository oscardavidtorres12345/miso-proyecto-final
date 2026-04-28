import { loginUser, registerUser } from '../../../src/services/identityService';

globalThis.fetch = jest.fn() as unknown as typeof fetch;

const mockOk = (data: unknown) =>
  Promise.resolve({ ok: true, json: async () => data } as Response);
const mockFail = () => Promise.resolve({ ok: false } as Response);

describe('identityService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('registerUser', () => {
    const payload = {
      firstName: 'Ana',
      lastName: 'López',
      email: 'ana@test.com',
      password: 'pass123',
      countryCode: 'CO',
    };
    const mockResponse = { id: 'u1', email: 'ana@test.com' };

    it('calls the register endpoint with POST', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      await registerUser(payload);

      const [url, options] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/auth/register');
      expect(options.method).toBe('POST');
    });

    it('sends the payload as JSON body', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      await registerUser(payload);

      const options = (fetch as jest.Mock).mock.calls[0][1];
      expect(options.body).toBe(JSON.stringify(payload));
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('returns the register response on success', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      const result = await registerUser(payload);
      expect(result).toEqual(mockResponse);
    });

    it('throws when registration fails', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockFail());
      await expect(registerUser(payload)).rejects.toThrow('Failed to register user');
    });
  });

  describe('loginUser', () => {
    const payload = { email: 'ana@test.com', password: 'pass123' };
    const mockResponse = {
      token: 'tok123',
      userId: 'u1',
      role: 'GUEST',
      firstName: 'Ana',
      lastName: 'López',
    };

    it('calls the login endpoint with POST', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      await loginUser(payload);

      const [url, options] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/auth/login');
      expect(options.method).toBe('POST');
    });

    it('sends credentials as JSON body', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      await loginUser(payload);

      const options = (fetch as jest.Mock).mock.calls[0][1];
      expect(options.body).toBe(JSON.stringify(payload));
    });

    it('returns the login response on success', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      const result = await loginUser(payload);
      expect(result).toEqual(mockResponse);
    });

    it('throws on invalid credentials', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockFail());
      await expect(loginUser(payload)).rejects.toThrow('Invalid credentials');
    });
  });
});
