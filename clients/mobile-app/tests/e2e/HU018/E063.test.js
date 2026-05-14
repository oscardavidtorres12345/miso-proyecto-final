const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';

const TIMEOUT_APP = 20000;
const TIMEOUT_UI = 20000;
const TIMEOUT_API = 25000;

async function openMyReservations() {
  await waitFor(element(by.id('hero-search-btn'))).toBeVisible().withTimeout(TIMEOUT_APP);
  await waitFor(element(by.id('menu-btn'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('menu-btn')).tap();
  await waitFor(element(by.id('my-bookings-btn'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('my-bookings-btn')).tap();
  await waitFor(element(by.id('my-reservations-title'))).toBeVisible().withTimeout(TIMEOUT_API);
}

describe('E063 — HU018 Manual check-in flow without QR code', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  afterEach(async () => {
    await logout();
  });

  it('allows check-in by using manual form from app', async () => {
    await openMyReservations();

    await waitFor(element(by.text('Check-in manual')).atIndex(0))
      .toBeVisible()
      .withTimeout(TIMEOUT_UI);
    await element(by.text('Check-in manual')).atIndex(0).tap();

    await waitFor(element(by.id('manual-checkin-document-number-input')))
      .toBeVisible()
      .withTimeout(TIMEOUT_UI);

    await element(by.id('manual-checkin-document-number-input')).tap();
    await element(by.id('manual-checkin-document-number-input')).typeText('123456789');
    await element(by.id('manual-checkin-contact-hint-input')).tap();
    await element(by.id('manual-checkin-contact-hint-input')).typeText('guest.e2e.co@travelhub.com');
    await element(by.id('manual-checkin-contact-hint-input')).tapReturnKey();

    await element(by.id('manual-checkin-confirm-btn')).tap();

    await waitFor(element(by.id('bookings-feedback-snackbar-message')))
      .toBeVisible()
      .withTimeout(TIMEOUT_API);
  });
});
