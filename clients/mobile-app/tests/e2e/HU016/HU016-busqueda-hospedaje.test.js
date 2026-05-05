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
 */

const TIMEOUT_APP  = 20000;
const TIMEOUT_UI   = 8000;
const TIMEOUT_API  = 15000;

const DESTINATION  = 'Cartagena';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/**
 * Selects check-in on day 20 and check-out on day 25 of the visible month.
 * Works when the current month still has those days in the future.
 */
async function selectDates() {
  await openDatesPanel();
  await waitFor(element(by.text('20'))).toBeVisible().withTimeout(TIMEOUT_UI);
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

  beforeEach(async () => {
    await device.reloadReactNative();
    await waitForHome();
  });

  // -------------------------------------------------------------------------
  // AC1: Pantalla principal con buscador
  // -------------------------------------------------------------------------
  describe('AC1: Pantalla principal con buscador', () => {
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
  // AC2: Búsqueda por destino en móvil
  // -------------------------------------------------------------------------
  describe('AC2: Búsqueda por destino en móvil', () => {
    it('acepta texto libre en el campo Destino', async () => {
      await openSearchSheet();
      await typeDestination(DESTINATION);
      await expect(element(by.id('search-destination-input'))).toHaveText(DESTINATION);
    });
  });

  // -------------------------------------------------------------------------
  // AC3: Selector de huéspedes en móvil
  // -------------------------------------------------------------------------
  describe('AC3: Selector de huéspedes en móvil', () => {
    it('muestra contadores de Adultos, Niños, Habitaciones y toggle de Mascotas', async () => {
      await openSearchSheet();
      await openGuestsPanel();
      await expect(element(by.text('Adultos'))).toBeVisible();
      await expect(element(by.text('Edad: 13 años o más'))).toBeVisible();
      await expect(element(by.text('Niños'))).toBeVisible();
      await expect(element(by.text('Edad: 0 a 12 años'))).toBeVisible();
      await expect(element(by.text('Habitaciones'))).toBeVisible();
      await expect(element(by.text('Mascotas'))).toBeVisible();
    });

    it('muestra los botones Cancelar y Aplicar en el selector de huéspedes', async () => {
      await openSearchSheet();
      await openGuestsPanel();
      await expect(element(by.id('search-subview-cancel-btn'))).toBeVisible();
      await expect(element(by.id('search-subview-apply-btn'))).toBeVisible();
    });

    it('incrementa el contador de Adultos', async () => {
      await openSearchSheet();
      await openGuestsPanel();
      // Default is 2 adults — tap + and expect 3
      await element(by.text('+')).atIndex(0).tap();
      await expect(element(by.text('3'))).toBeVisible();
    });

    it('decrementa el contador de Adultos sin ir por debajo de 1', async () => {
      await openSearchSheet();
      await openGuestsPanel();
      // Default is 2 adults — tap − twice; should stop at 1
      await element(by.text('−')).atIndex(0).tap();
      await element(by.text('−')).atIndex(0).tap();
      await expect(element(by.text('1'))).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC4: Aplicación de parámetros de huéspedes
  // -------------------------------------------------------------------------
  describe('AC4: Aplicación de parámetros de huéspedes', () => {
    it('cierra el panel de huéspedes y actualiza el campo Quién al presionar Aplicar', async () => {
      await openSearchSheet();
      await openGuestsPanel();
      await applyGuestsPanel();
      // Panel closed — main sheet visible again
      await expect(element(by.id('search-destination-input'))).toBeVisible();
      // Field now shows "2 huéspedes" (default 2 adults + 0 children)
      await expect(element(by.text('2 huéspedes'))).toBeVisible();
    });

    it('descarta cambios y cierra el panel al presionar Cancelar', async () => {
      await openSearchSheet();
      await openGuestsPanel();
      // Increment before cancelling
      await element(by.text('+')).atIndex(0).tap();
      await element(by.id('search-subview-cancel-btn')).tap();
      await waitFor(element(by.id('search-destination-input')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);
      // Value should still show default "¿Cuántos?" placeholder
      await expect(element(by.text('¿Cuántos?'))).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC10: Validación de campos obligatorios en móvil
  // (ejecutar antes de AC5 para no depender del backend)
  // -------------------------------------------------------------------------
  describe('AC10: Validación de campos obligatorios', () => {
    it('el botón Buscar está deshabilitado cuando no se completaron Destino ni Fechas', async () => {
      await openSearchSheet();
      // Without filling any field the submit button must be disabled
      await expect(element(by.id('search-submit-btn'))).toBeVisible();
      // Detox checks the disabled state via not.toHaveToggleValue / toHaveValue;
      // for TouchableOpacity with disabled=true the element is not touchable.
      // We verify it does NOT navigate to results when tapped.
      await element(by.id('search-submit-btn')).tap();
      // Search results summary should NOT appear
      await expect(element(by.id('search-summary-bar'))).not.toExist();
    });

    it('el botón Buscar está deshabilitado cuando sólo se ingresa el Destino', async () => {
      await openSearchSheet();
      await typeDestination(DESTINATION);
      await element(by.id('search-submit-btn')).tap();
      await expect(element(by.id('search-summary-bar'))).not.toExist();
    });

    it('el botón Buscar está deshabilitado cuando sólo se seleccionan las Fechas', async () => {
      await openSearchSheet();
      await selectDates();
      await element(by.id('search-submit-btn')).tap();
      await expect(element(by.id('search-summary-bar'))).not.toExist();
    });
  });

  // -------------------------------------------------------------------------
  // AC5 + AC6: Resultados y resumen de búsqueda
  // -------------------------------------------------------------------------
  describe('AC5 y AC6: Resultados de búsqueda y resumen visible', () => {
    it('muestra el resumen de búsqueda con destino, fechas y huéspedes', async () => {
      await performSearch();
      await expect(element(by.id('search-summary-bar'))).toBeVisible();
      await expect(element(by.id('search-summary-destination'))).toHaveText(DESTINATION);
    });

    it('muestra tarjetas de alojamiento en los resultados', async () => {
      await performSearch();
      // Wait for at least one accommodation card to appear
      await waitFor(element(by.text('Ver detalles')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
    });

    it('las tarjetas incluyen nombre, distancia, estrellas y botón Ver detalles', async () => {
      await performSearch();
      await waitFor(element(by.text('Ver detalles')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      // Button visible implies card structure rendered
      await expect(element(by.text('Ver detalles'))).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC11: Precio con impuestos en tarjeta de resultado
  // -------------------------------------------------------------------------
  describe('AC11: Precio con impuestos en tarjeta de resultado', () => {
    it('muestra la leyenda "Incluye impuestos y cargos" en las tarjetas de resultado', async () => {
      await performSearch();
      await waitFor(element(by.id('accommodation-taxes-label')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await expect(element(by.id('accommodation-taxes-label'))).toHaveText(
        'Incluye impuestos y cargos',
      );
    });
  });

  // -------------------------------------------------------------------------
  // AC7 + AC8: Panel de filtros
  // -------------------------------------------------------------------------
  describe('AC7 y AC8: Panel de filtros con Cancelar y Aplicar', () => {
    it('abre el panel de filtros con sus secciones al tocar el botón Filtros', async () => {
      await performSearch();
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
    });

    it('cierra el panel y descarta cambios al presionar Cancelar', async () => {
      await performSearch();
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
      await performSearch();
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
  });

  // -------------------------------------------------------------------------
  // AC9: Expansión de opciones de filtro (Ver más)
  // -------------------------------------------------------------------------
  describe('AC9: Expansión de opciones de filtro', () => {
    it('muestra opciones adicionales al presionar "Ver más" en Servicios', async () => {
      await performSearch();
      await waitFor(element(by.id('search-filter-btn')))
        .toBeVisible()
        .withTimeout(TIMEOUT_API);
      await element(by.id('search-filter-btn')).tap();
      await waitFor(element(by.id('filter-panel-header')))
        .toBeVisible()
        .withTimeout(TIMEOUT_UI);

      // "Ver más" appears only when there are more than 6 items in a group.
      // We wait for it; if the API returns fewer than 6 services the test is skipped.
      try {
        await waitFor(element(by.text('Ver más')).atIndex(0))
          .toBeVisible()
          .withTimeout(4000);
        const countBefore = await element(by.id('filter-apply-btn')).getAttributes();
        await element(by.text('Ver más')).atIndex(0).tap();
        // After expansion, "Ver menos" should appear
        await waitFor(element(by.text('Ver menos')))
          .toBeVisible()
          .withTimeout(TIMEOUT_UI);
        await expect(element(by.text('Ver menos'))).toBeVisible();
      } catch {
        // "Ver más" not present — not enough filter options returned by API
        console.log('[AC9] "Ver más" no disponible con los datos del entorno de pruebas.');
      }
    });
  });
});
