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

jest.mock('../../src/screens/SplashScreen', () => ({
  SplashScreen: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'splash-screen' });
  },
}));

jest.mock('../../src/screens/HomeScreen', () => ({
  HomeScreen: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'home-screen' });
  },
}));

jest.mock('../../src/screens/SearchScreen', () => ({
  SearchScreen: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'search-screen' });
  },
}));

jest.mock('../../src/screens/LoginScreen', () => ({
  LoginScreen: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'login-screen' });
  },
}));

jest.mock('../../src/components/common/Header', () => ({
  Header: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'header' });
  },
}));

jest.mock('../../src/context/LocaleContext', () => ({
  LocaleProvider: ({ children }: { children: any }) => children,
  useLocale: () => ({
    selectedCountry: { code: 'co', label: 'Colombia' },
    setSelectedCountry: jest.fn(),
    locale: 'es-CO',
  }),
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
    const { getByTestId, queryByTestId } = render(<App />);

    expect(getByTestId('splash-screen')).toBeTruthy();
    expect(queryByTestId('home-screen')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(queryByTestId('splash-screen')).toBeNull();
    expect(getByTestId('home-screen')).toBeTruthy();
  });

  it('renders header after splash screen', () => {
    const { getByTestId, queryByTestId } = render(<App />);

    expect(queryByTestId('header')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(getByTestId('header')).toBeTruthy();
  });
});
