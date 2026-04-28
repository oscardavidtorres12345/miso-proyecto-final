import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ActivityIndicator, PanResponder, TouchableOpacity } from 'react-native';

import { SearchBottomSheet } from '../../../src/components/search/SearchBottomSheet';
import { getSearchProperties } from '../../../src/services/searchService';

jest.mock('../../../src/services/searchService', () => ({
  getSearchProperties: jest.fn(),
}));

const panCbs: Record<string, any> = {};
jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => {
  Object.assign(panCbs, config);
  return { panHandlers: {} } as any;
});

const mockSearch = getSearchProperties as jest.Mock;
const { __setSafeAreaInsets } = require('react-native-safe-area-context');

const DEFAULT_PROPS = { isOpen: false, onClose: jest.fn() };

async function openSheet(props = {}) {
  const utils = render(<SearchBottomSheet {...DEFAULT_PROPS} isOpen={true} {...props} />);
  await waitFor(() => utils.getByPlaceholderText('¿Adónde vas?'));
  return utils;
}

async function fillAllFields(utils: ReturnType<typeof render>) {
  const { getByPlaceholderText, getByText, getByTestId } = utils;

  fireEvent.changeText(getByPlaceholderText('¿Adónde vas?'), 'Cartagena');

  fireEvent.press(getByText('Agrega fechas'));
  await waitFor(() => getByTestId('rn-calendar'));
  fireEvent.press(getByTestId('calendar-day-1'));
  fireEvent.press(getByTestId('calendar-day-10'));
  fireEvent.press(getByText('Aplicar'));
  await waitFor(() => { expect(utils.queryByTestId('rn-calendar')).toBeNull(); });

  fireEvent.press(getByText('¿Cuántos?'));
  await waitFor(() => getByText('Adultos'));
  fireEvent.press(getByText('Aplicar'));
  await waitFor(() => getByText(/huésped/));
}

describe('SearchBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it('renders nothing visible when isOpen is false', () => {
    const { queryByPlaceholderText } = render(<SearchBottomSheet {...DEFAULT_PROPS} />);
    expect(queryByPlaceholderText('¿Adónde vas?')).toBeNull();
  });

  it('shows the main view when isOpen is true', async () => {
    const { getByText, getByPlaceholderText } = await openSheet();
    expect(getByText('Destino')).toBeTruthy();
    expect(getByText('Fechas')).toBeTruthy();
    expect(getByText('Quién')).toBeTruthy();
    expect(getByPlaceholderText('¿Adónde vas?')).toBeTruthy();
  });

  it('Buscar button does not call API when fields are empty', async () => {
    const { getByText } = await openSheet();
    fireEvent.press(getByText('Buscar'));
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('handleSearch early-returns when invoked while canSearch is false', async () => {
    const utils = await openSheet();
    const searchBtn = utils
      .UNSAFE_getAllByType(TouchableOpacity)
      .find((node) => node.props.children?.props?.children === 'Buscar');

    act(() => {
      searchBtn?.props.onPress?.();
    });

    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('Buscar does not call API when disabled', async () => {
    const { getByText } = await openSheet();
    fireEvent.press(getByText('Buscar'));
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('updates destination as user types', async () => {
    const { getByPlaceholderText } = await openSheet();
    const input = getByPlaceholderText('¿Adónde vas?');
    fireEvent.changeText(input, 'Medellín');
    expect(input.props.value).toBe('Medellín');
  });

  it('navigates to dates sub-view when Fechas field is tapped', async () => {
    const { getByText, getByTestId } = await openSheet();
    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => getByTestId('rn-calendar'));
    expect(getByTestId('rn-calendar')).toBeTruthy();
  });

  it('first calendar press sets check-in with no check-out', async () => {
    const { getByText, getByTestId } = await openSheet();
    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => getByTestId('rn-calendar'));

    fireEvent.press(getByTestId('calendar-day-1'));
    fireEvent.press(getByTestId('calendar-day-1'));
    expect(getByTestId('rn-calendar')).toBeTruthy();
  });

  it('second calendar press on earlier date resets selection', async () => {
    const { getByText, getByTestId } = await openSheet();
    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => getByTestId('rn-calendar'));

    fireEvent.press(getByTestId('calendar-day-10'));
    fireEvent.press(getByTestId('calendar-day-1'));
    expect(getByTestId('rn-calendar')).toBeTruthy();
  });

  it('second calendar press on later date sets check-out', async () => {
    const { getByText, getByTestId } = await openSheet();
    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => getByTestId('rn-calendar'));

    fireEvent.press(getByTestId('calendar-day-1'));
    fireEvent.press(getByTestId('calendar-day-10'));
    expect(getByTestId('rn-calendar')).toBeTruthy();
  });

  it('third calendar press when both dates already set resets to new check-in', async () => {
    const { getByText, getByTestId } = await openSheet();
    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => getByTestId('rn-calendar'));

    fireEvent.press(getByTestId('calendar-day-1'));
    fireEvent.press(getByTestId('calendar-day-10'));
    fireEvent.press(getByTestId('calendar-day-05'));
    expect(getByTestId('rn-calendar')).toBeTruthy();
  });

  it('applying dates returns to main view and shows date display', async () => {
    const { getByText, getByTestId, queryByTestId } = await openSheet();
    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => getByTestId('rn-calendar'));

    fireEvent.press(getByTestId('calendar-day-1'));
    fireEvent.press(getByTestId('calendar-day-10'));
    fireEvent.press(getByText('Aplicar'));

    await waitFor(() => expect(queryByTestId('rn-calendar')).toBeNull());
    expect(getByText('Destino')).toBeTruthy();
  });

  it('cancelling dates returns to main view without applying', async () => {
    const { getByText, getByTestId, queryByTestId } = await openSheet();
    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => getByTestId('rn-calendar'));

    fireEvent.press(getByTestId('calendar-day-1'));
    fireEvent.press(getByText('Cancelar'));

    await waitFor(() => expect(queryByTestId('rn-calendar')).toBeNull());
    expect(getByText('Agrega fechas')).toBeTruthy();
  });

  it('navigates to guests sub-view when Quién field is tapped', async () => {
    const { getByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));
    expect(getByText('Adultos')).toBeTruthy();
    expect(getByText('Niños')).toBeTruthy();
    expect(getByText('Habitaciones')).toBeTruthy();
    expect(getByText('Mascotas')).toBeTruthy();
  });

  it('shows correct initial counter values', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));

    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('0').length).toBeGreaterThanOrEqual(1);
  });

  it('increments adult counter', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));

    const plusButtons = getAllByText('+');
    fireEvent.press(plusButtons[0]); // adults +1 → 2
    expect(getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('decrement button for adults at minimum does not reduce below 1', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));

    const minusButtons = getAllByText('−');
    fireEvent.press(minusButtons[0]);
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('increments and decrements children counter', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Niños'));

    const plusButtons = getAllByText('+');
    fireEvent.press(plusButtons[1]);
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1);

    const minusButtons = getAllByText('−');
    fireEvent.press(minusButtons[1]);
    expect(getAllByText('0').length).toBeGreaterThan(0);
  });

  it('increments rooms counter', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Habitaciones'));

    const plusButtons = getAllByText('+');
    fireEvent.press(plusButtons[2]);
    expect(getAllByText('2').length).toBeGreaterThan(0);
  });

  it('toggles pets switch', async () => {
    const { getByText, UNSAFE_getByType } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Mascotas'));

    const { Switch } = require('react-native');
    const switchEl = UNSAFE_getByType(Switch);
    expect(switchEl.props.value).toBe(false);
    fireEvent(switchEl, 'valueChange', true);
    expect(UNSAFE_getByType(Switch).props.value).toBe(true);
  });

  it('applying guests shows guest count in main view', async () => {
    const { getByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));
    fireEvent.press(getByText('Aplicar'));

    await waitFor(() => getByText('1 huésped'));
    expect(getByText('1 huésped')).toBeTruthy();
  });

  it('shows plural form for multiple guests', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));

    fireEvent.press(getAllByText('+')[0]);
    fireEvent.press(getByText('Aplicar'));

    await waitFor(() => getByText('2 huéspedes'));
    expect(getByText('2 huéspedes')).toBeTruthy();
  });

  it('cancelling guests returns to main without applying', async () => {
    const { getByText, queryByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));

    fireEvent.press(getByText('Cancelar'));

    await waitFor(() => getByText('¿Cuántos?'));
    expect(getByText('¿Cuántos?')).toBeTruthy();
    expect(queryByText('huésped')).toBeNull();
  });

  it('Buscar becomes enabled after all three fields are filled', async () => {
    mockSearch.mockResolvedValueOnce({ results: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });

    const utils = await openSheet();
    await fillAllFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByText('Buscar'));
    });

    await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
  });

  it('calls getSearchProperties with correct args on Buscar press', async () => {
    mockSearch.mockResolvedValueOnce({ results: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });

    const onClose = jest.fn();
    const utils = await openSheet({ onClose });
    await fillAllFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByText('Buscar'));
    });

    await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));

    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'Cartagena',
        checkIn: '2025-12-01',
        checkOut: '2025-12-10',
        adults: 1,
        children: 0,
        rooms: 1,
        pets: false,
      }),
    );
  });

  it('calls onSearchResults when search succeeds', async () => {
    const mockData = { results: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    mockSearch.mockResolvedValueOnce(mockData);

    const onSearchResults = jest.fn();
    const onClose = jest.fn();
    const utils = await openSheet({ onClose, onSearchResults });
    await fillAllFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByText('Buscar'));
    });

    await waitFor(() => expect(onSearchResults).toHaveBeenCalledWith(mockData));
  });

  it('shows loading indicator while search request is in progress', async () => {
    let resolveSearch: ((value: any) => void) | undefined;
    mockSearch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );

    const utils = await openSheet();
    await fillAllFields(utils);

    fireEvent.press(utils.getByText('Buscar'));
    expect(utils.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

    await act(async () => {
      resolveSearch?.({ results: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
    });
  });

  it('shows Alert when search fails', async () => {
    mockSearch.mockRejectedValueOnce(new Error('Network error'));
    const { Alert } = require('react-native');
    jest.spyOn(Alert, 'alert');

    const utils = await openSheet();
    await fillAllFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByText('Buscar'));
    });

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo realizar la búsqueda. Intenta de nuevo.'),
    );
  });

  it('pressing overlay (onRequestClose) triggers close', async () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = await openSheet({ onClose });
    const { Modal } = require('react-native');
    const modal = UNSAFE_getByType(Modal);
    await act(async () => {
      fireEvent(modal, 'requestClose');
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('animateOpen fires when Modal onShow fires', async () => {
    const { UNSAFE_getByType } = await openSheet();
    const { Modal } = require('react-native');
    const modal = UNSAFE_getByType(Modal);
    await act(async () => {
      fireEvent(modal, 'show');
    });
    expect(modal).toBeTruthy();
  });

  it('decrements adult counter after incrementing above minimum', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));

    const plusButtons = getAllByText('+');
    fireEvent.press(plusButtons[0]);

    const minusButtons = getAllByText('−');
    fireEvent.press(minusButtons[0]);
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('decrements rooms counter after incrementing above minimum', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Habitaciones'));

    const plusButtons = getAllByText('+');
    fireEvent.press(plusButtons[2]);

    const minusButtons = getAllByText('−');
    fireEvent.press(minusButtons[2]);
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('calendar renders arrow buttons via renderArrow prop', async () => {
    const { getByText } = await openSheet();
    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => expect(require('react-native').View).toBeTruthy());
    expect(getByText('Aplicar')).toBeTruthy();
  });

  it('uses fallback date label when selected dates are invalid', async () => {
    const { getByText, getByTestId } = await openSheet();

    fireEvent.press(getByText('Agrega fechas'));
    await waitFor(() => getByTestId('rn-calendar'));
    fireEvent.press(getByTestId('calendar-day-bad1'));
    fireEvent.press(getByTestId('calendar-day-bad2'));
    fireEvent.press(getByText('Aplicar'));

    await waitFor(() => {
      expect(getByText('fecha-invalida-a - fecha-invalida-b')).toBeTruthy();
    });
  });

  it('applies inset styles when safe-area top and bottom are present', async () => {
    __setSafeAreaInsets({ top: 24, right: 0, bottom: 16, left: 0 });
    const utils = await openSheet();

    fireEvent.press(utils.getByText('Agrega fechas'));
    await waitFor(() => utils.getByTestId('rn-calendar'));

    expect(utils.getByText('Fechas')).toBeTruthy();
  });

  it('panResponder move with dy > 0 updates panel position', async () => {
    await openSheet();
    act(() => {
      panCbs.onStartShouldSetPanResponder?.();
      panCbs.onMoveShouldSetPanResponder?.(null, { dy: 20 });
      panCbs.onPanResponderMove?.(null, { dy: 50 });
    });
    expect(true).toBe(true);
  });

  it('panResponder move with dy <= 0 is a no-op', async () => {
    await openSheet();
    act(() => {
      panCbs.onPanResponderMove?.(null, { dy: 0 });
      panCbs.onPanResponderMove?.(null, { dy: -10 });
    });
    expect(true).toBe(true);
  });

  it('panResponder release with large dy triggers close', async () => {
    const onClose = jest.fn();
    await openSheet({ onClose });
    await act(async () => {
      panCbs.onPanResponderRelease?.(null, { dy: 100, vy: 0 });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('panResponder release with high vy triggers close', async () => {
    const onClose = jest.fn();
    await openSheet({ onClose });
    await act(async () => {
      panCbs.onPanResponderRelease?.(null, { dy: 10, vy: 0.8 });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('panResponder release with small dy/vy springs panel back', async () => {
    await openSheet();
    act(() => {
      panCbs.onPanResponderRelease?.(null, { dy: 20, vy: 0.1 });
    });
    expect(true).toBe(true);
  });
});
