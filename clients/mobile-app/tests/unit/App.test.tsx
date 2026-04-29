import React from 'react';
import { act, render } from '@testing-library/react-native';

jest.mock('@expo-google-fonts/quicksand', () => ({
  useFonts: () => [true],
  Quicksand_400Regular: {},
  Quicksand_500Medium: {},
  Quicksand_700Bold: {},
}));

jest.mock('expo-navigation-bar', () => ({
  setPositionAsync: jest.fn(),
  setVisibilityAsync: jest.fn(),
  setButtonStyleAsync: jest.fn(),
  setStyle: jest.fn(),
}));

import App from '../../App';

describe('App', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows splash screen first and then renders home screen', () => {
    const { getByTestId, queryByTestId, getByText, unmount } = render(<App />);

    expect(getByTestId('app-root')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(queryByTestId('app-root')).toBeNull();
    expect(getByText('Descubre tus próximas vacaciones')).toBeTruthy();

    unmount();
  });
});
