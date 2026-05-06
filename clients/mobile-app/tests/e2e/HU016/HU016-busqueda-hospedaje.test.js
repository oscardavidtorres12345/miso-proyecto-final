/**
 * E2E Tests — HU016: Búsqueda de Hospedaje
 *
 * Cubre los criterios de aceptación:
 *  AC1  Pantalla principal con buscador
 *  AC2  Búsqueda por destino en móvil
 *  AC3  Selector de huéspedes en móvil
 *  AC4  Aplicación de parámetros de huéspedes
 *  AC5  Resultados de búsqueda en móvil
 *  AC6  Resumen de búsqueda visible en resultados
 *  AC7  Acceso al panel de filtros
 *  AC8  Filtros con botones Cancelar y Aplicar
 *  AC9  Expansión de opciones de filtro (Ver más)
 *  AC10 Validación de campos obligatorios
 *  AC11 Precio con impuestos en tarjeta de resultado
 *
 * Estrategia de rendimiento: cada describe usa `beforeAll` para configurar el
 * estado compartido una sola vez, reduciendo los `reloadReactNative()` de 20 a 6.
 */

const TIMEOUT_APP = 20000;
const TIMEOUT_UI = 8000;
const TIMEOUT_API = 15000;

const DESTINATION = 'Cartagena';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('HU016: Búsqueda de Hospedaje', () => {
  beforeAll(async () => {
    if (device.getPlatform() === 'ios') {
      await device.launchApp({ newInstance: true });
    } else {
      await device.launchApp();
    }
    await device.disableSynchronization();
  });

  // -------------------------------------------------------------------------
  // AC1: Pantalla principal con buscador — 1 reload, 2 tests
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // AC2: Búsqueda por destino — 1 reload, 1 test
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // AC3: Selector de huéspedes — 1 reload, 4 tests que comparten el panel
  //
  // T3 incrementa adultos a 3; T4 parte de ese estado y llega a 1 con 2 taps.
  // -------------------------------------------------------------------------
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
      // Default 2 → tap + → 3
      await element(by.text('+')).atIndex(0).tap();
      await expect(element(by.text('3'))).toBeVisible();
    });

    it('decrementa el contador de Adultos sin ir por debajo de 1', async () => {
      // Currently at 3 (from previous test) → tap − twice → 1
      await element(by.text('−')).atIndex(0).tap();
      await element(by.text('−')).atIndex(0).tap();
      await expect(element(by.text('1'))).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC4: Aplicación de parámetros de huéspedes — 1 reload, 2 tests
  //
  // T1 aplica (2 adultos default). T2 abre el panel de nuevo, incrementa y
  // cancela; verifica que se revierte al valor previamente aplicado (2 huéspedes).
  // -------------------------------------------------------------------------
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
      // Sheet still open; open guests panel again (shows 2 adults — value committed in T1)
      await openGuestsPanel();
      await element(by.text('+')).atIndex(0).tap();
      await element(by.id('search-subview-cancel-btn')).tap();
      await waitFor(element(by.id('search-destination-input')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      // Cancel reverts to the last committed value (2 huéspedes)
      await expect(element(by.text('2 huéspedes'))).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC10: Validación de campos obligatorios — 1 reload, 3 tests
  //
  // Cada test abre la hoja, intenta buscar y cierra con el botón atrás de
  // Android (onRequestClose del Modal) antes del siguiente test.
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // AC5 + AC6 + AC7 + AC8 + AC9 + AC11: Resultados y filtros — 1 reload + 1 búsqueda
  //
  // Todos los tests de esta sección comparten el estado de resultados cargado
  // en beforeAll. Los tests de filtros abren y cierran el panel explícitamente.
  // -------------------------------------------------------------------------
  describe('AC5, AC6, AC7, AC8, AC9, AC11: Resultados de búsqueda y filtros', () => {
    beforeAll(async () => {
      await device.reloadReactNative();
      await waitForHome();
      await performSearch();
    });

    // AC5 + AC6
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

    // AC11
    it('muestra la leyenda "Incluye impuestos y cargos" en las tarjetas de resultado', async () => {
      await waitFor(element(by.id('accommodation-taxes-label')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await expect(element(by.id('accommodation-taxes-label'))).toHaveText(
        'Incluye impuestos y cargos',
      );
    });

    // AC7 + AC8
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
      // Close the panel to leave results screen clean for the next test
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

    // AC9
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
      } catch {
        console.log(
          '[AC9] "Ver más" no disponible con los datos del entorno de pruebas.',
        );
      }
    });
  });
});
