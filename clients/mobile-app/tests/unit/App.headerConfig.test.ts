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

import { getHeaderConfig } from '../../App';

describe('getHeaderConfig', () => {
  it('returns logo, flag and login button for home screen', () => {
    const config = getHeaderConfig('home');
    expect(config.showLogo).toBe(true);
    expect(config.showFlag).toBe(true);
    expect(config.showLogin).toBe(true);
    expect(config.showMenu).toBeFalsy();
  });

  it('returns logo, flag and login button for search screen', () => {
    const config = getHeaderConfig('search');
    expect(config.showLogo).toBe(true);
    expect(config.showFlag).toBe(true);
    expect(config.showLogin).toBe(true);
    expect(config.showMenu).toBeFalsy();
  });

  it('returns logo and flag but no login button for login screen', () => {
    const config = getHeaderConfig('login');
    expect(config.showLogo).toBe(true);
    expect(config.showFlag).toBe(true);
    expect(config.showLogin).toBeFalsy();
    expect(config.showMenu).toBeFalsy();
  });
});
