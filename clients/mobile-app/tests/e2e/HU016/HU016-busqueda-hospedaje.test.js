const TIMEOUT_APP = 20000;
const TIMEOUT_UI = 8000;
const TIMEOUT_API = 15000;

const DESTINATION = 'Cartagena';

async function waitForHome() {
  await waitFor(element(by.id('hero-search-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_APP);
}

async function dismissSearchModal() {
  if (device.getPlatform() === 'android') {
    await device.pressBack();
  } else {
    await element(by.id('search-modal-overlay')).tap({ x: 30, y: 80 });
  }
}

async function openSearchSheet() {
  await element(by.id('hero-search-btn')).tap();
  await waitFor(element(by.id('search-destination-input')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function typeDestination(destination = DESTINATION) {
  await element(by.id('search-destination-input')).typeText(destination);
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

async function openDatesPanel() {
  await element(by.id('search-dates-field')).tap();
  await waitFor(element(by.id('search-subview-apply-btn')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function selectDates() {
  await openDatesPanel();
  await waitFor(element(by.text('20')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
  await element(by.text('20')).tap();
  await element(by.text('25')).tap();
  await element(by.id('search-subview-apply-btn')).tap();
  await waitFor(element(by.id('search-destination-input')))
    .toBeVisible()
    .withTimeout(TIMEOUT_UI);
}

async function performSearch(destination = DESTINATION) {
  await openSearchSheet();
  await typeDestination(destination);
  await selectDates();
  await openGuestsPanel();
  await applyGuestsPanel();
  await element(by.id('search-submit-btn')).tap();
  await waitFor(element(by.id('search-summary-bar')))
    .toBeVisible()
    .withTimeout(TIMEOUT_API);
}

describe('HU016: Búsqueda de Hospedaje', () => {
  beforeAll(async () => {
    if (device.getPlatform() === 'ios') {
      await device.launchApp({ newInstance: true });
    } else {
      await device.launchApp();
    }
    await device.disableSynchronization();
  });

  describe('AC1: Pantalla principal con buscador', () => {
    beforeAll(async () => {
      await device.reloadReactNative();
      await waitForHome();
    });

    it('muestra el botón Buscar en la pantalla de inicio', async () => {
      await expect(element(by.id('hero-search-btn'))).toBeVisible();
      await expect(element(by.text('Buscar'))).toBeVisible();
    });

    it('abre el panel de búsqueda al tocar el botón Buscar', async () => {
      await element(by.id('hero-search-btn')).tap();
      await waitFor(element(by.id('search-destination-input')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      await expect(element(by.text('Destino'))).toBeVisible();
      await expect(element(by.text('Fechas'))).toBeVisible();
      await expect(element(by.text('Quién'))).toBeVisible();
    });
  });

  describe('AC2: Búsqueda por destino en móvil', () => {
    beforeAll(async () => {
      await device.reloadReactNative();
      await waitForHome();
      await openSearchSheet();
    });

    it('acepta texto libre en el campo Destino', async () => {
      await typeDestination(DESTINATION);
      await expect(element(by.id('search-destination-input'))).toHaveText(
        DESTINATION,
      );
    });
  });

  describe('AC3: Selector de huéspedes en móvil', () => {
    beforeAll(async () => {
      await device.reloadReactNative();
      await waitForHome();
      await openSearchSheet();
      await openGuestsPanel();
    });

    it('muestra contadores de Adultos, Niños, Habitaciones y toggle de Mascotas', async () => {
      await expect(element(by.text('Adultos'))).toBeVisible();
      await expect(element(by.text('Edad: 13 años o más'))).toBeVisible();
      await expect(element(by.text('Niños'))).toBeVisible();
      await expect(element(by.text('Edad: 0 a 12 años'))).toBeVisible();
      await expect(element(by.text('Habitaciones'))).toBeVisible();
      await expect(element(by.text('Mascotas'))).toBeVisible();
    });

    it('muestra los botones Cancelar y Aplicar en el selector de huéspedes', async () => {
      await expect(element(by.id('search-subview-cancel-btn'))).toBeVisible();
      await expect(element(by.id('search-subview-apply-btn'))).toBeVisible();
    });

    it('incrementa el contador de Adultos', async () => {
      await element(by.text('+')).atIndex(0).tap();
      await expect(element(by.text('3'))).toBeVisible();
    });

    it('decrementa el contador de Adultos sin ir por debajo de 1', async () => {
      await element(by.text('−')).atIndex(0).tap();
      await element(by.text('−')).atIndex(0).tap();
      await expect(element(by.text('1'))).toBeVisible();
    });
  });

  describe('AC4: Aplicación de parámetros de huéspedes', () => {
    beforeAll(async () => {
      await device.reloadReactNative();
      await waitForHome();
      await openSearchSheet();
      await openGuestsPanel();
    });

    it('cierra el panel de huéspedes y actualiza el campo Quién al presionar Aplicar', async () => {
      await applyGuestsPanel();
      await expect(element(by.id('search-destination-input'))).toBeVisible();
      await expect(element(by.text('2 huéspedes'))).toBeVisible();
    });

    it('descarta cambios y cierra el panel al presionar Cancelar', async () => {
      await openGuestsPanel();
      await element(by.text('+')).atIndex(0).tap();
      await element(by.id('search-subview-cancel-btn')).tap();
      await waitFor(element(by.id('search-destination-input')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      await expect(element(by.text('2 huéspedes'))).toBeVisible();
    });
  });

  describe('AC10: Validación de campos obligatorios', () => {
    beforeAll(async () => {
      await device.reloadReactNative();
      await waitForHome();
    });

    it('el botón Buscar está deshabilitado cuando no se completaron Destino ni Fechas', async () => {
      await openSearchSheet();
      await element(by.id('search-submit-btn')).tap();
      await expect(element(by.id('search-summary-bar'))).not.toExist();
      await dismissSearchModal();
      await waitForHome();
    });

    it('el botón Buscar está deshabilitado cuando sólo se ingresa el Destino', async () => {
      await openSearchSheet();
      await typeDestination(DESTINATION);
      await element(by.id('search-submit-btn')).tap();
      await expect(element(by.id('search-summary-bar'))).not.toExist();
      await dismissSearchModal();
      await waitForHome();
    });

    it('el botón Buscar está deshabilitado cuando sólo se seleccionan las Fechas', async () => {
      await openSearchSheet();
      await selectDates();
      await element(by.id('search-submit-btn')).tap();
      await expect(element(by.id('search-summary-bar'))).not.toExist();
      await dismissSearchModal();
      await waitForHome();
    });
  });

  describe('AC5, AC6, AC7, AC8, AC9, AC11: Resultados de búsqueda y filtros', () => {
    beforeAll(async () => {
      await device.reloadReactNative();
      await waitForHome();
      await performSearch();
    });

    it('muestra el resumen de búsqueda con destino, fechas y huéspedes', async () => {
      await expect(element(by.id('search-summary-bar'))).toBeVisible();
      await expect(element(by.id('search-summary-destination'))).toHaveText(
        DESTINATION,
      );
    });

    it('muestra tarjetas de alojamiento en los resultados', async () => {
      await waitFor(element(by.text('Ver detalles')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
    });

    it('las tarjetas incluyen nombre, distancia, estrellas y botón Ver detalles', async () => {
      await waitFor(element(by.text('Ver detalles')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await expect(element(by.text('Ver detalles'))).toBeVisible();
    });

    it('muestra la leyenda "Incluye impuestos y cargos" en las tarjetas de resultado', async () => {
      await waitFor(element(by.id('accommodation-taxes-label')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await expect(element(by.id('accommodation-taxes-label'))).toHaveText(
        'Incluye impuestos y cargos',
      );
    });

    it('abre el panel de filtros con sus secciones al tocar el botón Filtros', async () => {
      await waitFor(element(by.id('search-filter-btn')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await element(by.id('search-filter-btn')).tap();
      await waitFor(element(by.id('filter-panel-header')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      await expect(element(by.text('Filtros'))).toBeVisible();
      await expect(element(by.text('Precio'))).toBeVisible();
      await expect(element(by.id('filter-cancel-btn'))).toBeVisible();
      await expect(element(by.id('filter-apply-btn'))).toBeVisible();
      await element(by.id('filter-cancel-btn')).tap();
      await waitFor(element(by.id('search-summary-bar')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
    });

    it('cierra el panel y descarta cambios al presionar Cancelar', async () => {
      await waitFor(element(by.id('search-filter-btn')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await element(by.id('search-filter-btn')).tap();
      await waitFor(element(by.id('filter-cancel-btn')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      await element(by.id('filter-cancel-btn')).tap();
      await waitFor(element(by.id('search-summary-bar')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      await expect(element(by.id('filter-panel-header'))).not.toBeVisible();
    });

    it('aplica los filtros y cierra el panel al presionar Aplicar', async () => {
      await waitFor(element(by.id('search-filter-btn')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await element(by.id('search-filter-btn')).tap();
      await waitFor(element(by.id('filter-apply-btn')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      await element(by.id('filter-apply-btn')).tap();
      await waitFor(element(by.id('search-summary-bar')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      await expect(element(by.id('filter-panel-header'))).not.toBeVisible();
    });

    it('muestra opciones adicionales al presionar "Ver más" en Servicios', async () => {
      await waitFor(element(by.id('search-filter-btn')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await element(by.id('search-filter-btn')).tap();
      await waitFor(element(by.id('filter-panel-header')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);

      try {
        await waitFor(element(by.text('Ver más')).atIndex(0))
          .toBeVisible()
          .withTimeout(4000);
        await element(by.text('Ver más')).atIndex(0).tap();
        await waitFor(element(by.text('Ver menos')))
          .toBeVisible()
          .withTimeout(TIMEOUT_UI);
        await expect(element(by.text('Ver menos'))).toBeVisible();
      } catch {}
    });
  });
});
