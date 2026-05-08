import '../src/i18n';

// Ensure real timers are active before each test file to prevent
// fake timer state from leaking between test suites when jest runs in band.
beforeEach(() => {
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
});
