const TIMEOUT_APP = 20000;
const TIMEOUT_UI = 8000;
const TIMEOUT_API = 45000;

const DESTINATION = 'Cartagena';

async function waitForHome() {
  await waitFor(element(by.id('hero-search-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_APP);
}

async function openSearchSheet() {
  await element(by.id('hero-search-btn')).tap();
  await waitFor(element(by.id('search-destination-input')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function typeDestination(destination = DESTINATION) {
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
  await waitFor(element(by.id('search-destination-input')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function openDatesPanel() {
  await element(by.id('search-dates-field')).tap();
  await waitFor(element(by.id('search-subview-apply-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function tapCalendarDay(dayText) {
  try {
    await element(by.text(dayText)).tap();
    return;
  } catch {}
  await element(by.text(dayText)).atIndex(0).tap();
}

async function selectDates() {
  await openDatesPanel();
  await waitFor(element(by.text('›')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
  await element(by.text('›')).tap();
  await waitFor(element(by.text('10')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
  await tapCalendarDay('10');
  await tapCalendarDay('17');
  await element(by.id('search-subview-apply-btn')).tap();
  await waitFor(element(by.id('search-destination-input')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function openGuestsPanel() {
  await element(by.id('search-who-field')).tap();
  await waitFor(element(by.id('search-subview-apply-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function applyGuestsPanel() {
  await element(by.id('search-subview-apply-btn')).tap();
  await waitFor(element(by.id('search-destination-input')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function waitForTwoGuestsShown() {
  let lastErr;
  for (const label of ['2 huéspedes', '2 guests']) {
    try {
      await waitFor(element(by.text(label)))
        .toBeVisible()
        .withTimeout(5000);
      return;
    } catch (error) {
      lastErr = error;
    }
  }
  throw lastErr;
}

async function performSearch() {
  await openSearchSheet();
  await typeDestination();
  await selectDates();
  await openGuestsPanel();
  await applyGuestsPanel();
  await waitForTwoGuestsShown();
  await element(by.id('search-submit-btn')).tap();

  await waitFor(element(by.id('search-summary-bar')))
    .toBeVisible()
    .withTimeout(TIMEOUT_API);
  await waitFor(element(by.id('accommodation-view-details-1')))
    .toBeVisible()
    .withTimeout(TIMEOUT_API);
}

async function openFiltersPanel() {
  await waitFor(element(by.id('search-filter-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_API);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await element(by.id('search-filter-btn')).tap();
    try {
      await waitFor(element(by.id('filter-panel-header')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      return;
    } catch {
      if (attempt === 2) throw new Error('Could not open filters panel');
      await waitFor(element(by.id('search-summary-bar')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
    }
  }
}

describe('E055 — F016 Mobile accommodation search with basic filters', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await waitForHome();
  });

  it('applies destination + dates and shows mobile-optimized results', async () => {
    await performSearch();

    await expect(element(by.id('search-summary-destination'))).toHaveText(
      DESTINATION,
    );
    await expect(element(by.id('accommodation-view-details-1'))).toBeVisible();
  });

  it('shows validation when required basic filters are missing', async () => {
    await openSearchSheet();
    await element(by.id('search-submit-btn')).tap();
    await expect(element(by.id('search-summary-bar'))).not.toExist();
  });

  it('allows opening the filters panel on mobile search results', async () => {
    await performSearch();
    await openFiltersPanel();
    await expect(element(by.id('filter-panel-header'))).toBeVisible();
    await expect(element(by.id('filter-apply-btn'))).toBeVisible();
  });
});
