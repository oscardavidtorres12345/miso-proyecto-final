const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';

const TIMEOUT_APP = 20000;
const TIMEOUT_UI = 10000;
const TIMEOUT_API = 25000;
const TIMEOUT_LIST = 35000;

async function openMyReservationsViaMenu() {
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

describe('E058 — HU017 Mobile reservations query and navigation', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  afterEach(async () => {
    await logout();
  });

  it('E058-AC1/AC2: allows access to My Reservations and shows active cards with cancel action', async () => {
    await openMyReservationsViaMenu();

    await expect(element(by.id('switch-to-past-trips-btn'))).toBeVisible();

    await waitFor(element(by.id('reservation-cancel-btn')).atIndex(0))
      .toBeVisible()
      .withTimeout(TIMEOUT_LIST);
  });

  it('E058-AC3/AC4/AC5: navigates to Past Trips and returns to active reservations', async () => {
    await openMyReservationsViaMenu();

    await element(by.id('switch-to-past-trips-btn')).tap();
    await waitFor(element(by.id('past-trips-title')))
      .toBeVisible()
      .withTimeout(TIMEOUT_API);

    await expect(element(by.id('switch-to-reservations-btn'))).toBeVisible();
    await element(by.id('switch-to-reservations-btn')).tap();

    await waitFor(element(by.id('my-reservations-title')))
      .toBeVisible()
      .withTimeout(TIMEOUT_API);
  });
});
