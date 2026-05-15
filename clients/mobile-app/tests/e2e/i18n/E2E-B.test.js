const TIMEOUT_APP = 60000;
const TIMEOUT_UI = 8000;

async function waitForHome() {
  await waitFor(element(by.id('hero-search-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_APP);
}

async function switchToEnUS() {
  await element(by.id('flag-btn')).tap();
  await waitFor(element(by.id('flag-option-us'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('flag-option-us')).tap();
}

async function navigateToLogin() {
  await waitFor(element(by.id('login-btn'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('login-btn')).tap();
  await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(TIMEOUT_UI);
}

describe('E2E-B — i18n: Login screen locale switch', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await waitForHome();
  });

  it('shows Login title and submit button in es-CO by default', async () => {
    await navigateToLogin();
    await expect(element(by.text('Inicia sesión en tu cuenta'))).toBeVisible();
    await expect(element(by.id('submit-btn'))).toBeVisible();
  });

  it('switches to en-US before Login and shows English title and submit button', async () => {
    await switchToEnUS();
    await navigateToLogin();
    await expect(element(by.text('Sign in to your account'))).toBeVisible();
    await expect(element(by.id('submit-btn'))).toBeVisible();
  });
});
