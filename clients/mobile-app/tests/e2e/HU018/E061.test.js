const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';
const BASE_URL = process.env.EXPO_PUBLIC_BOOKING_URL || 'http://10.0.2.2:3001/api/v1';
const BOOKING_ID = 'mock-bk-up-001';

describe('E061 — HU018 QR token generation for confirmed booking', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  afterEach(async () => {
    await logout();
  });

  it('returns a unique QR value for a confirmed booking', async () => {
    const resp = await fetch(`${BASE_URL}/bookings/${BOOKING_ID}/checkin/qr-token`, {
      method: 'POST',
      headers: { 'X-User-Id': '4' },
    });

    expect(resp.status).toBe(200);
    const payload = await resp.json();
    expect(payload.booking_id).toBe(BOOKING_ID);
    expect(typeof payload.qr_value).toBe('string');
    expect(payload.qr_value.length).toBeGreaterThan(8);
    expect(typeof payload.expires_at).toBe('string');
  });
});
