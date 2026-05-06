jest.setTimeout(300000);

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
    await waitFor(element(by.id('app-root')))
      .toExist()
      .withTimeout(20000);
  });
});