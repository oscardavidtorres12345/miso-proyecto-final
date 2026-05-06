jest.setTimeout(300000);
const TIMEOUT_STARTUP = device.getPlatform() === 'ios' ? 180000 : 30000;

describe('E000 - Builds and launches the app', () => {
  beforeAll(async () => {
    if (device.getPlatform() === 'ios') {
      await device.launchApp({ newInstance: true });
    } else {
      await device.launchApp();
    }

    await device.disableSynchronization();
  });

  it('should have welcome screen', async () => {
    await waitFor(element(by.id('hero-search-btn')))
      .toBeVisible()
      .withTimeout(TIMEOUT_STARTUP);
  });
});