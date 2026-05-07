// Detox globals (device, element, by, waitFor) are injected by the test runner.

async function loginAs(email, password) {
  // Wait for splash screen to finish (hero-search-btn only appears after splash)
  await waitFor(element(by.id('hero-search-btn')))
    .toBeVisible()
    .withTimeout(60000);
  await waitFor(element(by.id('login-btn'))).toBeVisible().withTimeout(10000);
  await element(by.id('login-btn')).tap();
  await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(5000);

  await element(by.id('email-input')).tap();
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).tap();
  await element(by.id('password-input')).typeText(password);
  await element(by.id('password-input')).tapReturnKey();

  // On Android with disableSynchronization the keyboard animation is not
  // awaited automatically; scroll the form up so the submit button is clear.
  if (device.getPlatform() === 'android') {
    await element(by.id('password-input')).swipe('up', 'slow', 0.3);
  }

  await waitFor(element(by.id('submit-btn'))).toBeVisible().withTimeout(5000);
  await element(by.id('submit-btn')).tap();
  await waitFor(element(by.id('menu-btn'))).toBeVisible().withTimeout(15000);
}

async function logout() {
  await element(by.id('menu-btn')).tap();
  await waitFor(element(by.id('logout-btn'))).toBeVisible().withTimeout(3000);
  await element(by.id('logout-btn')).tap();
  await waitFor(element(by.id('login-btn'))).toBeVisible().withTimeout(10000);
}

module.exports = { loginAs, logout };
