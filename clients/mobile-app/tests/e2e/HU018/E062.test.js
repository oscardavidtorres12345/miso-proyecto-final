const { expect: jestExpect } = require('@jest/globals');
const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';
const BASE_URL = process.env.E2E_HTTP_BASE_URL || 'http://127.0.0.1:3001/api/v1';
const BOOKING_ID = 'mock-bk-up-001';

describe('E062 — HU018 Successful QR scan and validation at check-in', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  afterEach(async () => {
    await logout();
  });

  it('accepts a valid QR value and confirms check-in', async () => {
    const issueResp = await fetch(`${BASE_URL}/bookings/${BOOKING_ID}/checkin/qr-token`, {
      method: 'POST',
      headers: { 'X-User-Id': '4' },
    });
    jestExpect(issueResp.status).toBe(200);
    const issuePayload = await issueResp.json();

    const scanResp = await fetch(`${BASE_URL}/bookings/${BOOKING_ID}/checkin/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': '4',
      },
      body: JSON.stringify({ qr_value: issuePayload.qr_value }),
    });

    jestExpect(scanResp.status).toBe(200);
    const scanPayload = await scanResp.json();
    jestExpect(scanPayload.status).toBe('CHECKED_IN');
    jestExpect(scanPayload.booking_id).toBe(BOOKING_ID);
  });
});
