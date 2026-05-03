describe('Push Notifications & Deep Links', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  it('should open app from push notification deep link without crashing', async () => {
    // Simulate opening the app from a push notification deep link.
    // In a real scenario, this would be triggered by tapping a notification.
    await device.launchApp({
      newInstance: false,
      url: 'travelhub://my-bookings?booking_id=bk-001',
    });

    // App should still be visible (no crash when navigating from deep link)
    await waitFor(element(by.id('app-root')))
      .toExist()
      .withTimeout(10000);
  });
});
