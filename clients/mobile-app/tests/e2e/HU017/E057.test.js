const TIMEOUT_API = 45000;

// eslint-disable-next-line jest/no-disabled-tests
xdescribe('E057 — F017 Complete new reservation creation from mobile', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  it('completes full booking flow: search → detail → checkout → confirmation', async () => {
    // FIXME: end-to-end reservation creation from mobile not yet implemented
    await waitFor(element(by.id('accommodation-view-details-1')))
      .toBeVisible()
      .withTimeout(TIMEOUT_API);
    await element(by.id('accommodation-view-details-1')).tap();
    await element(by.id('booking-reserve-btn')).tap();
    await element(by.id('checkout-confirm-btn')).tap();
    await expect(element(by.id('booking-confirmation-screen'))).toBeVisible();
  });
});
