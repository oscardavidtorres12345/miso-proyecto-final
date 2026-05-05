import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Header } from '../../../src/components/common/Header';

jest.mock('../../../src/context/LocaleContext', () => {
  const React = require('react');
  const COUNTRIES = [
    { code: 'co', label: 'Colombia' },
    { code: 'ar', label: 'Argentina' },
    { code: 'us', label: 'Estados Unidos' },
  ];
  function useLocale() {
    const [selectedCountry, setSelectedCountry] = React.useState(COUNTRIES[0]);
    return { selectedCountry, setSelectedCountry, locale: 'es-CO' };
  }
  return { COUNTRIES, useLocale };
});

const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

describe('Header — accessibility', () => {
  describe('logo', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showLogo />);
      expect(getByTestId('header-logo').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<Header showLogo />);
      expect(getByTestId('header-logo').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('cart', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showCart />);
      expect(getByTestId('cart-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<Header showCart />);
      expect(getByTestId('cart-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('login button', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showLogin />);
      expect(getByTestId('login-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<Header showLogin />);
      expect(getByTestId('login-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('menu button', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showMenu />);
      expect(getByTestId('menu-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<Header showMenu />);
      expect(getByTestId('menu-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('dropdown menu buttons', () => {
    it('my bookings button has accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showMenu showMyBookings />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('my-bookings-btn').props.accessibilityRole).toBe('button');
    });

    it('my bookings button has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<Header showMenu showMyBookings />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('my-bookings-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('logout button has accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('logout-btn').props.accessibilityRole).toBe('button');
    });

    it('logout button has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('logout-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('country selector', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showFlag />);
      expect(getByTestId('flag-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<Header showFlag />);
      expect(getByTestId('flag-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('country options have accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByTestId('flag-option-co').props.accessibilityRole).toBe('button');
      expect(getByTestId('flag-option-ar').props.accessibilityRole).toBe('button');
    });

    it('country options have accessibilityLabel with the country name', () => {
      const { getByTestId } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByTestId('flag-option-co').props.accessibilityLabel).toBe('Colombia');
      expect(getByTestId('flag-option-ar').props.accessibilityLabel).toBe('Argentina');
    });
  });
});
