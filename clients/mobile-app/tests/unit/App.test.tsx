import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

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
  HomeScreen: ({ onNavigateToSearch }: { onNavigateToSearch: (p: any) => void }) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'home-screen' },
      React.createElement(
        TouchableOpacity,
        {
          testID: 'go-search-btn',
          onPress: () =>
            onNavigateToSearch({
              destination: 'Bogota',
              checkIn: '2026-05-20',
              checkOut: '2026-05-23',
              adults: 2,
              children: 0,
              rooms: 1,
              pets: false,
            }),
        },
        React.createElement(Text, null, 'go search'),
      ),
    );
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
  Header: ({ showMyBookings, onMyBookingsPress }: { showMyBookings?: boolean; onMyBookingsPress?: () => void }) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'header' },
      showMyBookings
        ? React.createElement(
            TouchableOpacity,
            { testID: 'my-bookings-btn', onPress: onMyBookingsPress },
            React.createElement(Text, null, 'my bookings'),
          )
        : null,
    );
  },
}));

jest.mock('../../src/screens/MyReservationsScreen', () => ({
  MyReservationsScreen: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'reservations-screen' });
  },
}));

jest.mock('../../src/screens/PastTripsScreen', () => ({
  PastTripsScreen: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'past-trips-screen' });
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

jest.mock('../../src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: any }) => children,
  useAuth: () => ({
    session: {
      user: {
        user_id: 15,
        username: 'mobile-user',
        email: 'mobile@test.com',
        role: 'GUEST',
        is_active: true,
      },
      permissions: [],
      sessionExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      token: 'mock-token',
    },
    token: 'mock-token',
    isAuthenticated: true,
    autoLoggedOut: false,
    clearAuthData: jest.fn(),
    clearAutoLoggedOut: jest.fn(),
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

  it('E017-01 shows access to My Reservations for authenticated mobile user', () => {
    const { getByTestId, queryByTestId } = render(<App />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(getByTestId('home-screen')).toBeTruthy();

    fireEvent.press(getByTestId('go-search-btn'));

    expect(getByTestId('search-screen')).toBeTruthy();
    expect(getByTestId('my-bookings-btn')).toBeTruthy();

    fireEvent.press(getByTestId('my-bookings-btn'));

    expect(getByTestId('reservations-screen')).toBeTruthy();
    expect(queryByTestId('search-screen')).toBeNull();
  });
});
