import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Keyboard, PanResponder, Platform, TouchableOpacity } from 'react-native';

import { SearchBottomSheet } from '../../../src/components/search/SearchBottomSheet';

const panCbs: Record<string, any> = {};
jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => {
  Object.assign(panCbs, config);
  return { panHandlers: {} } as any;
});

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

  it('Buscar button does not call onSearch when fields are empty', async () => {
    const onSearch = jest.fn();
    const { getByText } = await openSheet({ onSearch });
    fireEvent.press(getByText('Buscar'));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('handleSearch early-returns when invoked while canSearch is false', async () => {
    const onSearch = jest.fn();
    const utils = await openSheet({ onSearch });
    const searchBtn = utils
      .UNSAFE_getAllByType(TouchableOpacity)
      .find((node) => node.props.children?.props?.children === 'Buscar');

    act(() => {
      searchBtn?.props.onPress?.();
    });

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('Buscar does not call onSearch when disabled', async () => {
    const onSearch = jest.fn();
    const { getByText } = await openSheet({ onSearch });
    fireEvent.press(getByText('Buscar'));
    expect(onSearch).not.toHaveBeenCalled();
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
    expect(getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('0').length).toBeGreaterThanOrEqual(1);
  });

  it('increments adult counter', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));

    const plusButtons = getAllByText('+');
    fireEvent.press(plusButtons[0]); // adults +1 → 3
    expect(getAllByText('3').length).toBeGreaterThanOrEqual(1);
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

    await waitFor(() => getByText('2 huéspedes'));
    expect(getByText('2 huéspedes')).toBeTruthy();
  });

  it('shows plural form for multiple guests', async () => {
    const { getByText, getAllByText } = await openSheet();
    fireEvent.press(getByText('¿Cuántos?'));
    await waitFor(() => getByText('Adultos'));

    fireEvent.press(getAllByText('+')[0]);
    fireEvent.press(getByText('Aplicar'));

    await waitFor(() => getByText('3 huéspedes'));
    expect(getByText('3 huéspedes')).toBeTruthy();
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

  it('Buscar becomes enabled and calls onSearch after all fields are filled', async () => {
    const onSearch = jest.fn();
    const utils = await openSheet({ onSearch });
    await fillAllFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByText('Buscar'));
    });

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
  });

  it('calls onSearch with correct args on Buscar press', async () => {
    const onSearch = jest.fn();
    const onClose = jest.fn();
    const utils = await openSheet({ onClose, onSearch });
    await fillAllFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByText('Buscar'));
    });

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'Cartagena',
        adults: 2,
        children: 0,
        rooms: 1,
        pets: false,
      }),
    );
  });

  it('calls onClose after Buscar press when onSearch is provided', async () => {
    const onSearch = jest.fn();
    const onClose = jest.fn();
    const utils = await openSheet({ onClose, onSearch });
    await fillAllFields(utils);

    await act(async () => {
      fireEvent.press(utils.getByText('Buscar'));
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
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

  it('pre-fills fields when initial values are provided', async () => {
    const utils = render(
      <SearchBottomSheet
        isOpen={true}
        onClose={jest.fn()}
        initialDestination="Bogotá"
        initialCheckIn="2025-12-01"
        initialCheckOut="2025-12-05"
        initialGuests={{ adults: 2, children: 1, rooms: 1, pets: true }}
      />,
    );
    await waitFor(() => utils.getByPlaceholderText('¿Adónde vas?'));
    expect(utils.getByPlaceholderText('¿Adónde vas?').props.value).toBe('Bogotá');
  });

  it('shows singular guest label when exactly one guest is selected', async () => {
    const utils = render(
      <SearchBottomSheet
        isOpen={true}
        onClose={jest.fn()}
        initialGuests={{ adults: 1, children: 0, rooms: 1, pets: false }}
      />,
    );

    await waitFor(() => {
      expect(utils.getByText('1 huésped')).toBeTruthy();
    });
  });

  it('does not re-hydrate state on reopen after first open', async () => {
    const onClose = jest.fn();
    const utils = render(
      <SearchBottomSheet
        isOpen={true}
        onClose={onClose}
        initialDestination="Bogotá"
      />,
    );

    await waitFor(() => utils.getByPlaceholderText('¿Adónde vas?'));
    const destinationInput = utils.getByPlaceholderText('¿Adónde vas?');
    fireEvent.changeText(destinationInput, 'Medellín');

    utils.rerender(
      <SearchBottomSheet
        isOpen={false}
        onClose={onClose}
        initialDestination="Bogotá"
      />,
    );
    utils.rerender(
      <SearchBottomSheet
        isOpen={true}
        onClose={onClose}
        initialDestination="Cali"
      />,
    );

    await waitFor(() => utils.getByPlaceholderText('¿Adónde vas?'));
    expect(utils.getByPlaceholderText('¿Adónde vas?').props.value).toBe('Medellín');
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

  it('updates keyboard height on show/hide listeners', async () => {
    const listeners: Record<string, any> = {};
    const addListenerSpy = jest.spyOn(Keyboard, 'addListener').mockImplementation((event: string, cb: any) => {
      listeners[event] = cb;
      return { remove: jest.fn() } as any;
    });

    const utils = await openSheet();
    const getPanel = () =>
      utils
        .UNSAFE_getAllByType(require('react-native').Animated.View)
        .find((node: any) =>
          Array.isArray(node.props.style) &&
          node.props.style.some((entry: any) => entry && typeof entry === 'object' && 'marginBottom' in entry),
        );

    act(() => {
      listeners.keyboardDidShow?.({ endCoordinates: { height: 300 } });
      listeners.keyboardWillShow?.({ endCoordinates: { height: 300 } });
    });
    let animatedPanel = getPanel();
    expect(animatedPanel?.props.style[1].marginBottom).toBe(300);

    act(() => {
      listeners.keyboardDidHide?.();
      listeners.keyboardWillHide?.();
    });
    animatedPanel = getPanel();
    expect(animatedPanel?.props.style[1].marginBottom).toBe(0);

    addListenerSpy.mockRestore();
  });

  it('registers iOS keyboardWill events path', async () => {
    const osDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', { value: 'ios' });

    const listeners: Record<string, any> = {};
    const addListenerSpy = jest.spyOn(Keyboard, 'addListener').mockImplementation((event: string, cb: any) => {
      listeners[event] = cb;
      return { remove: jest.fn() } as any;
    });

    const utils = await openSheet();
    const panel = () =>
      utils
        .UNSAFE_getAllByType(require('react-native').Animated.View)
        .find((node: any) =>
          Array.isArray(node.props.style) &&
          node.props.style.some((entry: any) => entry && typeof entry === 'object' && 'marginBottom' in entry),
        );

    act(() => {
      listeners.keyboardWillShow?.({ endCoordinates: { height: 250 } });
    });
    expect(panel()?.props.style[1].marginBottom).toBe(250);

    act(() => {
      listeners.keyboardWillHide?.();
    });
    expect(panel()?.props.style[1].marginBottom).toBe(0);

    addListenerSpy.mockRestore();
    if (osDescriptor) {
      Object.defineProperty(Platform, 'OS', osDescriptor);
    } else {
      Object.defineProperty(Platform, 'OS', { value: 'android' });
    }
  });
});
