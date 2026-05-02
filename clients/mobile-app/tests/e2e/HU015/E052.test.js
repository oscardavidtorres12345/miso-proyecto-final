// E052 — Login exitoso en app móvil con credenciales válidas
// HU015 | Detox E2E | Expo React Native
//
// Prerequisite: Identity service running.
// Set environment variables before running:
//   TEST_USER_EMAIL   — valid GUEST account email
//   TEST_USER_PASSWORD — valid GUEST account password

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'e2e@travelhub.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'E2eTest1234!';

describe('E052 — Successful login with valid credentials', () => {

  beforeEach(async () => {
    // Fresh launch between tests — same pattern as starter.test.js
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  it('should navigate to home screen and show authenticated header after successful login', async () => {
    // Given: user is on the login screen
    await waitFor(element(by.id('header-logo')))
      .toBeVisible()
      .withTimeout(20000);
    await waitFor(element(by.id('login-btn')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('login-btn')).tap();
    await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(5000);

    // When: user enters valid GUEST credentials
    await element(by.id('email-input')).tap();
    await element(by.id('email-input')).typeText(TEST_EMAIL);
    await element(by.id('password-input')).tap();
    await element(by.id('password-input')).typeText(TEST_PASSWORD);

    // And: submits the form
    await element(by.id('submit-btn')).tap();

    // Then: after API call + 2-second navigation delay, the home screen is active
    //       and the header shows the authenticated user menu.
    // Timeout = 10s (API) + 2s (setTimeout in LoginScreen) + 3s (margin) = 15s
    await waitFor(element(by.id('menu-btn')))
      .toBeVisible()
      .withTimeout(15000);

    // And: the unauthenticated login button is no longer visible
    await expect(element(by.id('login-btn'))).not.toBeVisible();
  });

  it('should show an error snackbar for invalid credentials', async () => {
    // Given: user is on the login screen
    await waitFor(element(by.id('header-logo')))
      .toBeVisible()
      .withTimeout(20000);
    await waitFor(element(by.id('login-btn')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('login-btn')).tap();
    await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(5000);

    // When: user enters incorrect credentials
    await element(by.id('email-input')).tap();
    await element(by.id('email-input')).typeText('notreal@example.com');
    await element(by.id('password-input')).tap();
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('submit-btn')).tap();

    // Then: error snackbar from login screen is displayed
    await waitFor(element(by.id('login-snackbar')))
      .toBeVisible()
      .withTimeout(10000);

    // And: user remains on the login screen (email input still visible)
    await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(3000);

    // And: header does NOT show authenticated menu
    await expect(element(by.id('menu-btn'))).not.toBeVisible();
  });
});
