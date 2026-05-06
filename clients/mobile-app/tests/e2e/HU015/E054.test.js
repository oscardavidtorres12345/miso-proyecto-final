// Prerequisite: Identity service running.
// Set environment variables before running:
//   TEST_USER_EMAIL   — valid GUEST account email
//   TEST_USER_PASSWORD — valid GUEST account password

const { loginAs, logout } = require('../helpers/login');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest.e2e.co@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Guest2026!';

describe('E054 — Session synchronization between mobile and web apps', () => {

  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  it('should keep session active when app is sent to background and brought back to foreground', async () => {
    // Given: user is authenticated — the same JWT that the web platform would use is held in memory
    await loginAs(TEST_EMAIL, TEST_PASSWORD);

    // When: app is sent to background (e.g. user switches to another app)
    await device.sendToHome();

    // And: app is brought back to foreground without a process kill
    await device.launchApp({ newInstance: false });
    await device.disableSynchronization();

    // Then: in-memory session is intact — no re-authentication needed
    await waitFor(element(by.id('header-logo'))).toBeVisible().withTimeout(20000);
    await waitFor(element(by.id('menu-btn'))).toBeVisible().withTimeout(10000);
    await expect(element(by.id('login-btn'))).not.toBeVisible();

    // And: user can still navigate to protected areas (menu is fully operational)
    await element(by.id('menu-btn')).tap();
    await waitFor(element(by.id('my-bookings-btn'))).toBeVisible().withTimeout(3000);
    await waitFor(element(by.id('logout-btn'))).toBeVisible().withTimeout(3000);

    // Cleanup
    await element(by.id('logout-btn')).tap();
    await waitFor(element(by.id('login-btn'))).toBeVisible().withTimeout(10000);
  });
});
