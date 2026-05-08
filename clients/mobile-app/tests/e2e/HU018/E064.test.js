const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';
const BASE_URL = process.env.E2E_HTTP_BASE_URL || 'http://127.0.0.1:3001/api/v1';
const BOOKING_ID = 'mock-bk-up-002';

describe('E064 — HU018 Reject expired or already used QR check-in', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  afterEach(async () => {
    await logout();
  });

  it('rejects check-in when QR was already used', async () => {
    const issueResp = await fetch(`${BASE_URL}/bookings/${BOOKING_ID}/checkin/qr-token`, {
      method: 'POST',
      headers: { 'X-User-Id': '4' },
    });
    expect(issueResp.status).toBe(200);
    const issuePayload = await issueResp.json();

    const firstScan = await fetch(`${BASE_URL}/bookings/${BOOKING_ID}/checkin/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': '4',
      },
      body: JSON.stringify({ qr_value: issuePayload.qr_value }),
    });
    expect(firstScan.status).toBe(200);

    const secondScan = await fetch(`${BASE_URL}/bookings/${BOOKING_ID}/checkin/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': '4',
      },
      body: JSON.stringify({ qr_value: issuePayload.qr_value }),
    });

    expect(secondScan.status).toBe(400);
    const rejected = await secondScan.json();
    expect(rejected.detail).toMatch(/QR no permitido|QR expirado/);
  });
});
