// Prerequisite: identity-service running.
// Set environment variables before running:
//   TRAVELHUB_USER_EMAIL    — valid registered user email
//   TRAVELHUB_USER_PASSWORD — corresponding password
//
// Tested flows:
//   - User logs in and registers push token
//   - App opens from push-notification deep link (cold start) and navigates to My Reservations
//   - App opens from push-notification deep link when in background and navigates to My Reservations

const { loginAs } = require('./helpers/login');

const TEST_USER = process.env.TRAVELHUB_USER_EMAIL    || 'guest.e2e.co@travelhub.com';
const TEST_PASS = process.env.TRAVELHUB_USER_PASSWORD || 'Guest2026!';

describe('Push Notifications & Deep Links', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  it('should login, register push token, and open My Reservations from push-notification deep link (cold start)', async () => {
    // Given: user is logged in (push token is registered automatically on login)
    await loginAs(TEST_USER, TEST_PASS);

    // Verify we are on the home screen after login
    await expect(element(by.id('menu-btn'))).toBeVisible();

    // Simulate app being closed and reopened from a push-notification tap.
    // The OS passes the notification payload URL to the app (cold start).
    await device.launchApp({
      newInstance: true,
      url: 'travelhub://my-bookings?booking_id=demo-001',
    });
    await device.disableSynchronization();

    // Then: the app should navigate directly to the My Reservations screen
    await waitFor(element(by.id('switch-to-past-trips-btn')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.text('Mis reservas'))).toBeVisible();
  });

  it('should navigate to My Reservations from push-notification deep link when app is in background', async () => {
    // Given: user is logged in
    await loginAs(TEST_USER, TEST_PASS);
    await expect(element(by.id('menu-btn'))).toBeVisible();

    // When: app is sent to background (user receives push notification)
    await device.sendToHome();

    // And: user taps the notification, which brings the app to foreground with the deep link
    await device.launchApp({
      newInstance: false,
      url: 'travelhub://my-bookings?booking_id=demo-001',
    });
    await device.disableSynchronization();

    // Then: the app should navigate to the My Reservations screen
    await waitFor(element(by.id('switch-to-past-trips-btn')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.text('Mis reservas'))).toBeVisible();
  });
});
