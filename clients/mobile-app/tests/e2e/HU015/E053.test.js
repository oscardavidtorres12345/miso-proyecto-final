// Prerequisite: Identity service running.
// Set environment variables before running:
//   TEST_USER_EMAIL   — valid GUEST account email
//   TEST_USER_PASSWORD — valid GUEST account password

const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';

describe('E053 — Keeps session active between app closures', () => {

  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  it('should restore authenticated session after app is fully closed and relaunched', async () => {
    // Given: user logs in successfully
    await loginAs(TEST_EMAIL, TEST_PASSWORD);

    // When: app is terminated (simulates user swiping it away from the recents screen)
    await device.sendToHome();
    await device.terminateApp();

    // And: app is cold-relaunched (AsyncStorage survives process death)
    await device.launchApp({ newInstance: false });
    await device.disableSynchronization();

    // Then: AuthProvider reads the stored session and user is still authenticated
    await waitFor(element(by.id('header-logo'))).toBeVisible().withTimeout(20000);
    await waitFor(element(by.id('menu-btn'))).toBeVisible().withTimeout(10000);

    // And: unauthenticated login button is hidden
    await expect(element(by.id('login-btn'))).not.toBeVisible();

    // Cleanup
    await logout();
  });

  it('should not restore session after explicit logout and app relaunch', async () => {
    // Given: user logs in and then logs out — clearAuthData() removes the token from AsyncStorage
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
    await logout();

    // When: app is terminated and cold-relaunched
    await device.sendToHome();
    await device.terminateApp();
    await device.launchApp({ newInstance: false });
    await device.disableSynchronization();

    // Then: no stored session — user sees the unauthenticated header
    await waitFor(element(by.id('header-logo'))).toBeVisible().withTimeout(20000);
    await waitFor(element(by.id('login-btn'))).toBeVisible().withTimeout(10000);

    // And: authenticated menu is NOT visible
    await expect(element(by.id('menu-btn'))).not.toBeVisible();
  });
});
