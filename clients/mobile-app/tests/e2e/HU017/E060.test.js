const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';
const EMPTY_EMAIL = process.env.TEST_USER_EMPTY_EMAIL;
const EMPTY_PASSWORD = process.env.TEST_USER_EMPTY_PASSWORD;

const TIMEOUT_APP = 20000;
const TIMEOUT_UI = 10000;
const TIMEOUT_API = 25000;

async function openMyReservations() {
  await waitFor(element(by.id('hero-search-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_APP);
  await waitFor(element(by.id('menu-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
  await element(by.id('menu-btn')).tap();
  await waitFor(element(by.id('my-bookings-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
  await element(by.id('my-bookings-btn')).tap();
  await waitFor(element(by.id('my-reservations-title')))
    .toBeVisible()
    .withTimeout(TIMEOUT_API);
}

describe('E060 — HU017 Reservation cancellation and empty state', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  afterEach(async () => {
    try {
      await waitFor(element(by.id('menu-btn')))
        .toBeVisible()
        .withTimeout(2000);
      await logout();
    } catch {}
  });

  it('E060-AC6/AC7: opens confirmation modal and confirms cancellation with feedback', async () => {
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
    await openMyReservations();

    await waitFor(element(by.id('reservation-cancel-btn')).atIndex(0))
      .toBeVisible()
      .withTimeout(TIMEOUT_API);
    await element(by.id('reservation-cancel-btn')).atIndex(0).tap();

    await waitFor(element(by.id('modal-confirm-title')))
      .toBeVisible()
      .withTimeout(TIMEOUT_UI);
    await expect(element(by.id('modal-confirm-btn'))).toBeVisible();
    await element(by.id('modal-confirm-btn')).tap();

    await waitFor(element(by.id('bookings-feedback-snackbar-message')))
      .toBeVisible()
      .withTimeout(TIMEOUT_API);
  });

  it('E060-AC9 (optional): shows message when there are no active reservations', async () => {
    if (!EMPTY_EMAIL || !EMPTY_PASSWORD) {
      return;
    }

    await loginAs(EMPTY_EMAIL, EMPTY_PASSWORD);
    await openMyReservations();

    await waitFor(element(by.id('my-reservations-empty-message')))
      .toBeVisible()
      .withTimeout(TIMEOUT_API);
  });
});
