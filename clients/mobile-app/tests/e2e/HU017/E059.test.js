const TIMEOUT_APP = 20000;

// eslint-disable-next-line jest/no-disabled-tests
xdescribe('E059 — F017 Modify reservation dates with fare recalculation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  it('allows changing dates on an existing reservation and shows updated total', async () => {
    // FIXME: reservation date modification not yet implemented
    await waitFor(element(by.id('my-reservations-screen')))
      .toBeVisible()
      .withTimeout(TIMEOUT_APP);
    await element(by.id('reservation-edit-dates-btn')).tap();
    await expect(element(by.id('reservation-updated-total'))).toBeVisible();
  });

  it('cancels date modification and keeps original reservation unchanged', async () => {
    // FIXME: reservation date modification not yet implemented
    await waitFor(element(by.id('reservation-edit-dates-btn')))
      .toBeVisible()
      .withTimeout(TIMEOUT_APP);
    await element(by.id('reservation-edit-dates-btn')).tap();
    await element(by.id('reservation-edit-cancel-btn')).tap();
    await expect(element(by.id('reservation-original-dates'))).toBeVisible();
  });
});
