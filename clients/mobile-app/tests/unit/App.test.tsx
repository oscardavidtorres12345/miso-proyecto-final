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

jest.mock('../../src/screens/HomeScreen', () => ({
  HomeScreen: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'home-screen' });
  },
}));

jest.mock('../../src/screens/SplashScreen', () => ({
  SplashScreen: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'splash-screen' });
  },
}));

describe('App', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows splash screen first and then renders home screen', () => {
    const { getByTestId, queryByTestId } = render(<App />);

    expect(getByTestId('splash-screen')).toBeTruthy();
    expect(queryByTestId('home-screen')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(queryByTestId('splash-screen')).toBeNull();
    expect(getByTestId('home-screen')).toBeTruthy();
  });
});
