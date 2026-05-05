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

describe('Header — accesibilidad', () => {
  describe('logo', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showLogo />);
      expect(getByTestId('header-logo').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<Header showLogo />);
      expect(getByTestId('header-logo').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('carrito', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showCart />);
      expect(getByTestId('cart-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<Header showCart />);
      expect(getByTestId('cart-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('botón login', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showLogin />);
      expect(getByTestId('login-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<Header showLogin />);
      expect(getByTestId('login-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('botón menú', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showMenu />);
      expect(getByTestId('menu-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<Header showMenu />);
      expect(getByTestId('menu-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('botones del menú desplegable', () => {
    it('el botón de mis reservas tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showMenu showMyBookings />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('my-bookings-btn').props.accessibilityRole).toBe('button');
    });

    it('el botón de mis reservas tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<Header showMenu showMyBookings />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('my-bookings-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('el botón de logout tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('logout-btn').props.accessibilityRole).toBe('button');
    });

    it('el botón de logout tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('logout-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('selector de país', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showFlag />);
      expect(getByTestId('flag-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<Header showFlag />);
      expect(getByTestId('flag-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('las opciones de país tienen accessibilityRole="button"', () => {
      const { getByTestId } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByTestId('flag-option-co').props.accessibilityRole).toBe('button');
      expect(getByTestId('flag-option-ar').props.accessibilityRole).toBe('button');
    });

    it('las opciones de país tienen accessibilityLabel con el nombre del país', () => {
      const { getByTestId } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByTestId('flag-option-co').props.accessibilityLabel).toBe('Colombia');
      expect(getByTestId('flag-option-ar').props.accessibilityLabel).toBe('Argentina');
    });
  });
});
