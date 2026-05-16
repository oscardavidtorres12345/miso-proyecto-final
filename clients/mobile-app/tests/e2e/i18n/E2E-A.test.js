const TIMEOUT_APP = 60000;
const TIMEOUT_UI = 8000;
const TIMEOUT_API = 45000;

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

async function resetToEsCO() {
  await element(by.id('flag-btn')).tap();
  await waitFor(element(by.id('flag-option-co'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('flag-option-co')).tap();
}

async function openSearchSheet() {
  await element(by.id('hero-search-btn')).tap();
  await waitFor(element(by.id('search-destination-input'))).toBeVisible().withTimeout(TIMEOUT_UI);
}

async function typeDestination(destination) {
  await element(by.id('search-destination-input')).tap();
  if (device.getPlatform() === 'android') {
    await element(by.id('search-destination-input')).replaceText(destination);
    try {
      await element(by.id('search-destination-input')).tapReturnKey();
    } catch {
      await device.pressBack();
    }
  } else {
    await element(by.id('search-destination-input')).typeText(destination);
  }
  await waitFor(element(by.id('search-destination-input'))).toBeVisible().withTimeout(TIMEOUT_UI);
}

async function selectDates() {
  await element(by.id('search-dates-field')).tap();
  await waitFor(element(by.id('search-subview-apply-btn'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await waitFor(element(by.text('›'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.text('›')).tap();
  await waitFor(element(by.text('10'))).toBeVisible().withTimeout(TIMEOUT_UI);
  try {
    await element(by.text('10')).tap();
  } catch {
    await element(by.text('10')).atIndex(0).tap();
  }
  try {
    await element(by.text('17')).tap();
  } catch {
    await element(by.text('17')).atIndex(0).tap();
  }
  await element(by.id('search-subview-apply-btn')).tap();
  await waitFor(element(by.id('search-destination-input'))).toBeVisible().withTimeout(TIMEOUT_UI);
}

async function performSearch(destination) {
  await openSearchSheet();
  await typeDestination(destination);
  await selectDates();
  await element(by.id('search-who-field')).tap();
  await waitFor(element(by.id('search-subview-apply-btn'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('search-subview-apply-btn')).tap();
  await waitFor(element(by.id('search-destination-input'))).toBeVisible().withTimeout(TIMEOUT_UI);
  await element(by.id('search-submit-btn')).tap();
  await waitFor(element(by.id('search-summary-bar'))).toBeVisible().withTimeout(TIMEOUT_API);
}

async function openFiltersPanel() {
  await waitFor(element(by.id('search-filter-btn'))).toBeVisible().withTimeout(TIMEOUT_API);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await element(by.id('search-filter-btn')).tap();
    try {
      await waitFor(element(by.id('filter-panel-header'))).toBeVisible().withTimeout(TIMEOUT_UI);
      return;
    } catch {
      if (attempt === 2) throw new Error('Could not open filters panel');
      await waitFor(element(by.id('search-summary-bar'))).toBeVisible().withTimeout(TIMEOUT_UI);
    }
  }
}

describe('E2E-A — i18n: Home + Search + FilterPanel locale switch', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await waitForHome();
  });

  it('shows Home hero text in es-CO by default', async () => {
    await expect(element(by.text('Descubre tus próximas vacaciones'))).toBeVisible();
  });

  it('switches to en-US and shows Home hero text in English', async () => {
    await switchToEnUS();
    await expect(element(by.text('Discover your next vacation'))).toBeVisible();
    await resetToEsCO();
  });

  it('switches to en-US and shows flag dropdown in English', async () => {
    await switchToEnUS();
    await element(by.id('flag-btn')).tap();
    await waitFor(element(by.id('flag-dropdown'))).toBeVisible().withTimeout(TIMEOUT_UI);
    await expect(element(by.text('United States'))).toBeVisible();
    await element(by.id('flag-overlay')).tap();
    await resetToEsCO();
  });

  it('switches to en-US and verifies FilterPanel labels in Search', async () => {
    await switchToEnUS();
    await performSearch('Cartagena');
    await openFiltersPanel();
    await expect(element(by.id('filter-panel-header'))).toBeVisible();
    await expect(element(by.id('filter-cancel-btn'))).toBeVisible();
    await expect(element(by.id('filter-apply-btn'))).toBeVisible();
  });
});
