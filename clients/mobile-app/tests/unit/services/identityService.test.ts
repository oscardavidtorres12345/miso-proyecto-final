import { loginUser, registerUser } from '../../../src/services/identityService';

globalThis.fetch = jest.fn() as unknown as typeof fetch;

const mockOk = (data: unknown) =>
  Promise.resolve({ ok: true, json: async () => data, status: 200 } as Response);
const mockFail = (data: unknown = {}, status: number = 401) =>
  Promise.resolve({ ok: false, json: async () => data, status } as Response);

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
      status: 'success',
      message: 'Login successful',
      user: {
        user_id: 1,
        username: 'ana.lopez',
        email: 'ana@test.com',
        role: 'GUEST' as const,
        is_active: true,
      },
      permissions: ['read:accommodations'],
      session_ttl_seconds: 3600,
      session_expires_at: '2026-05-01T12:00:00Z',
      access_token: 'tok123',
      token_type: 'Bearer',
    };

    it('calls the login endpoint with POST', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(mockOk(mockResponse));
      await loginUser(payload);

      const [url, options] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/identity/auth/web/login');
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

    it('throws on invalid credentials with error message', async () => {
      const errorResponse = { detail: 'Invalid credentials' };
      (fetch as jest.Mock).mockReturnValueOnce(mockFail(errorResponse, 401));
      await expect(loginUser(payload)).rejects.toThrow('Invalid credentials');
    });

    it('throws on error with array details', async () => {
      const errorResponse = { detail: [{ msg: 'Invalid email' }, { msg: 'Invalid password' }] };
      (fetch as jest.Mock).mockReturnValueOnce(mockFail(errorResponse, 400));
      await expect(loginUser(payload)).rejects.toThrow('Invalid email, Invalid password');
    });

    it('attaches status code to error', async () => {
      const errorResponse = { detail: 'Unauthorized' };
      (fetch as jest.Mock).mockReturnValueOnce(mockFail(errorResponse, 401));
      try {
        await loginUser(payload);
        fail('should have thrown');
      } catch (error: any) {
        expect(error.status).toBe(401);
      }
    });
  });
});
