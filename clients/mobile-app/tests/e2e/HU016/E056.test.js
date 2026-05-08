const TIMEOUT_APP = 20000;
const TIMEOUT_API = 45000;

// eslint-disable-next-line jest/no-disabled-tests
xdescribe('E056 — F016 Mobile accommodation search with geolocation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  it('requests location permission and pre-fills destination with nearby city', async () => {
    // FIXME: geolocation-based search not yet implemented in the app
    await waitFor(element(by.id('hero-search-btn')))
      .toBeVisible()
      .withTimeout(TIMEOUT_APP);
    await element(by.id('search-use-location-btn')).tap();
    await expect(element(by.id('search-destination-input'))).not.toHaveText('');
  });

  it('shows accommodations near current location without manual destination', async () => {
    // FIXME: geolocation search not yet implemented
    await waitFor(element(by.id('search-summary-bar')))
      .toBeVisible()
      .withTimeout(TIMEOUT_API);
    await expect(element(by.id('accommodation-view-details-1'))).toBeVisible();
  });
});
