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

jest.mock('../../src/screens/HomeScreen', () => ({ HomeScreen: () => null }));
jest.mock('../../src/screens/SearchScreen', () => ({ SearchScreen: () => null }));
jest.mock('../../src/screens/LoginScreen', () => ({ LoginScreen: () => null }));
jest.mock('../../src/screens/SplashScreen', () => ({ SplashScreen: () => null }));
jest.mock('../../src/components/common/Header', () => ({ Header: () => null }));
jest.mock('../../src/components/common/Snackbar', () => ({ Snackbar: () => null }));
jest.mock('../../src/context/AuthContext', () => ({ AuthProvider: ({ children }: any) => children, useAuth: () => ({ session: null, isAuthenticated: false, clearAuthData: jest.fn(), autoLoggedOut: false, clearAutoLoggedOut: jest.fn() }) }));

import { getHeaderConfig } from '../../App';

describe('getHeaderConfig', () => {
  describe('unauthenticated user', () => {
    it('returns login button for home screen', () => {
      const config = getHeaderConfig('home', false);
      expect(config.showLogo).toBe(true);
      expect(config.showFlag).toBe(true);
      expect(config.showLogin).toBe(true);
      expect(config.showMenu).toBeFalsy();
      expect(config.showMyBookings).toBeFalsy();
    });

    it('returns login button for search screen', () => {
      const config = getHeaderConfig('search', false);
      expect(config.showLogin).toBe(true);
      expect(config.showMenu).toBeFalsy();
    });

    it('hides login button on login screen', () => {
      const config = getHeaderConfig('login', false);
      expect(config.showLogo).toBe(true);
      expect(config.showFlag).toBe(true);
      expect(config.showLogin).toBeFalsy();
      expect(config.showMenu).toBeFalsy();
    });
  });

  describe('authenticated user', () => {
    it('shows menu and my bookings for home screen', () => {
      const config = getHeaderConfig('home', true);
      expect(config.showLogo).toBe(true);
      expect(config.showFlag).toBe(true);
      expect(config.showMenu).toBe(true);
      expect(config.showMyBookings).toBe(true);
      expect(config.showLogin).toBeFalsy();
    });

    it('shows menu for search screen', () => {
      const config = getHeaderConfig('search', true);
      expect(config.showMenu).toBe(true);
      expect(config.showLogin).toBeFalsy();
    });

    it('hides menu on login screen even when authenticated', () => {
      const config = getHeaderConfig('login', true);
      expect(config.showMenu).toBeFalsy();
      expect(config.showLogin).toBeFalsy();
    });

    it('shows menu and my bookings on reservations screen', () => {
      const config = getHeaderConfig('reservations', true);
      expect(config.showMenu).toBe(true);
      expect(config.showMyBookings).toBe(true);
      expect(config.showLogin).toBeFalsy();
    });

    it('shows menu and my bookings on pastTrips screen', () => {
      const config = getHeaderConfig('pastTrips', true);
      expect(config.showMenu).toBe(true);
      expect(config.showMyBookings).toBe(true);
    });
  });

  describe('bookings screens unauthenticated', () => {
    it('shows login on reservations when not authenticated', () => {
      const config = getHeaderConfig('reservations', false);
      expect(config.showLogin).toBe(true);
      expect(config.showMenu).toBeFalsy();
    });

    it('shows login on pastTrips when not authenticated', () => {
      const config = getHeaderConfig('pastTrips', false);
      expect(config.showLogin).toBe(true);
      expect(config.showMyBookings).toBeFalsy();
    });
  });

  describe('accommodationDetail screen', () => {
    it('shows menu and bookings for authenticated user', () => {
      const config = getHeaderConfig('accommodationDetail', true);
      expect(config.showMenu).toBe(true);
      expect(config.showMyBookings).toBe(true);
      expect(config.showLogin).toBeFalsy();
    });

    it('shows login for unauthenticated user', () => {
      const config = getHeaderConfig('accommodationDetail', false);
      expect(config.showLogin).toBe(true);
      expect(config.showMenu).toBeFalsy();
    });
  });
});
