const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';

const TIMEOUT_UI = 8000;
const TIMEOUT_NAV = 15000;

async function switchToEnUS() {
  await element(by.id('flag-btn')).tap();
  await waitFor(element(by.id('flag-option-us'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('flag-option-us')).tap();
}

async function navigateToMyReservations() {
  await element(by.id('menu-btn')).tap();
  await waitFor(element(by.id('my-bookings-btn'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('my-bookings-btn')).tap();
}

describe('E2E-C — i18n: My Reservations + Past Trips locale switch (authenticated)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  afterEach(async () => {
    await logout();
  });

  it('shows My Reservations title in es-CO', async () => {
    await navigateToMyReservations();
    await waitFor(element(by.text('Mis reservas'))).toBeVisible().withTimeout(TIMEOUT_NAV);
  });

  it('switches to en-US and shows My Reservations title in English', async () => {
    await switchToEnUS();
    await navigateToMyReservations();
    await waitFor(element(by.text('My reservations'))).toBeVisible().withTimeout(TIMEOUT_NAV);
  });

  it('switches to en-US and shows Past Trips title in English', async () => {
    await switchToEnUS();
    await navigateToMyReservations();
    await waitFor(element(by.text('My reservations'))).toBeVisible().withTimeout(TIMEOUT_NAV);
    await waitFor(element(by.text('Past trips'))).toBeVisible().withTimeout(TIMEOUT_UI);
    await element(by.text('Past trips')).tap();
    await waitFor(element(by.text('Past trips'))).toBeVisible().withTimeout(TIMEOUT_NAV);
  });
});
