import React from 'react';
import { cleanup, render, screen } from '@testing-library/react-native';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    width: 400,
    height: 800,
    scale: 2,
    fontScale: 1,
  })),
}));

jest.mock('../../../src/assets/logo.svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ width, height }: { width: number; height: number }) =>
    React.createElement(View, {
      testID: 'splash-logo',
      accessibilityLabel: `logo-${width}-${height}`,
    });
});

import { SplashScreen } from '../../../src/screens/SplashScreen';

const useWindowDimensions = jest.requireMock(
  'react-native/Libraries/Utilities/useWindowDimensions',
).default as jest.Mock;

describe('SplashScreen', () => {
  const scale = { scale: 2, fontScale: 1 };

  beforeEach(() => {
    useWindowDimensions.mockReturnValue({
      width: 400,
      height: 800,
      ...scale,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders background stack and branded logo wrapper', () => {
    render(<SplashScreen />);

    expect(useWindowDimensions).toHaveBeenCalled();
    expect(screen.getByTestId('splash-logo')).toBeTruthy();
    expect(screen.toJSON()).not.toBeNull();
  });

  it('caps logo width at 280 on wide screens', () => {
    useWindowDimensions.mockReturnValue({
      width: 520,
      height: 900,
      ...scale,
    });

    render(<SplashScreen />);

    const logoWidth = Math.min(520 - 48, 280);
    const logoHeight = (logoWidth * 68) / 225;
    expect(screen.getByTestId('splash-logo').props.accessibilityLabel).toBe(
      `logo-${logoWidth}-${logoHeight}`,
    );
  });

  it('shrinks logo when window width minus padding is below 280', () => {
    useWindowDimensions.mockReturnValue({
      width: 220,
      height: 640,
      ...scale,
    });

    render(<SplashScreen />);

    const logoWidth = Math.min(220 - 48, 280);
    const logoHeight = (logoWidth * 68) / 225;
    expect(screen.getByTestId('splash-logo').props.accessibilityLabel).toBe(
      `logo-${logoWidth}-${logoHeight}`,
    );
  });
});
