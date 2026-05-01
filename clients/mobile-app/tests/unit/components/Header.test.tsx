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

// __setSafeAreaInsets only exists in the Jest mock, not in the real package types
const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

describe('Header', () => {
  describe('empty render', () => {
    it('renders no elements when no props are passed', () => {
      const { queryByTestId } = render(<Header />);
      expect(queryByTestId('header-logo')).toBeNull();
      expect(queryByTestId('cart-btn')).toBeNull();
      expect(queryByTestId('login-btn')).toBeNull();
      expect(queryByTestId('menu-btn')).toBeNull();
      expect(queryByTestId('flag-btn')).toBeNull();
    });
  });

  describe('showLogo', () => {
    it('shows the logo when showLogo is true', () => {
      const { getByTestId } = render(<Header showLogo />);
      expect(getByTestId('header-logo')).toBeTruthy();
    });

    it('does not show the logo when showLogo is false', () => {
      const { queryByTestId } = render(<Header showLogo={false} />);
      expect(queryByTestId('header-logo')).toBeNull();
    });

    it('calls onLogoPress when the logo is pressed', () => {
      const onLogoPress = jest.fn();
      const { getByTestId } = render(<Header showLogo onLogoPress={onLogoPress} />);
      fireEvent.press(getByTestId('header-logo'));
      expect(onLogoPress).toHaveBeenCalledTimes(1);
    });

    it('does not throw when logo is pressed without onLogoPress handler', () => {
      const { getByTestId } = render(<Header showLogo />);
      expect(() => fireEvent.press(getByTestId('header-logo'))).not.toThrow();
    });
  });

  describe('showCart', () => {
    it('shows the cart button when showCart is true', () => {
      const { getByTestId } = render(<Header showCart />);
      expect(getByTestId('cart-btn')).toBeTruthy();
    });

    it('does not show badge when cartItemCount is 0', () => {
      const { queryByTestId } = render(<Header showCart cartItemCount={0} />);
      expect(queryByTestId('cart-badge')).toBeNull();
    });

    it('shows badge with count when cartItemCount > 0', () => {
      const { getByTestId, getByText } = render(<Header showCart cartItemCount={5} />);
      expect(getByTestId('cart-badge')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('shows "99+" when cartItemCount exceeds 99', () => {
      const { getByText } = render(<Header showCart cartItemCount={100} />);
      expect(getByText('99+')).toBeTruthy();
    });

    it('shows "99" exactly when cartItemCount is 99', () => {
      const { getByText } = render(<Header showCart cartItemCount={99} />);
      expect(getByText('99')).toBeTruthy();
    });
  });

  describe('showLogin', () => {
    it('shows the login button', () => {
      const { getByTestId } = render(<Header showLogin />);
      expect(getByTestId('login-btn')).toBeTruthy();
    });
  });

  describe('showMenu', () => {
    it('shows the menu button', () => {
      const { getByTestId } = render(<Header showMenu />);
      expect(getByTestId('menu-btn')).toBeTruthy();
    });

    it('opens the dropdown when the menu button is pressed', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      expect(queryByTestId('menu-dropdown')).toBeNull();
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('menu-dropdown')).toBeTruthy();
    });

    it('closes the dropdown when the menu button is pressed again', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('menu-dropdown')).toBeTruthy();
      fireEvent.press(getByTestId('menu-btn'));
      expect(queryByTestId('menu-dropdown')).toBeNull();
    });

    it('closes the dropdown when the overlay is pressed', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      fireEvent.press(getByTestId('menu-overlay'));
      expect(queryByTestId('menu-dropdown')).toBeNull();
    });
  });

  describe('username initial', () => {
    it('shows the first letter of username in uppercase', () => {
      const { getByText } = render(<Header showMenu username="alice" />);
      expect(getByText('A')).toBeTruthy();
    });

    it('falls back to "U" when username is empty', () => {
      const { getByText } = render(<Header showMenu username="" />);
      expect(getByText('U')).toBeTruthy();
    });

    it('falls back to "U" when username is not provided', () => {
      const { getByText } = render(<Header showMenu />);
      expect(getByText('U')).toBeTruthy();
    });
  });

  describe('showMyBookings', () => {
    it('shows the my-bookings button when showMyBookings is true and menu is open', () => {
      const { getByTestId } = render(<Header showMenu showMyBookings />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('my-bookings-btn')).toBeTruthy();
    });

    it('does not show "Mis reservas" when showMyBookings is false', () => {
      const { getByTestId, queryByTestId } = render(
        <Header showMenu showMyBookings={false} />,
      );
      fireEvent.press(getByTestId('menu-btn'));
      expect(queryByTestId('my-bookings-btn')).toBeNull();
    });

    it('does not show "Mis reservas" when showMyBookings is not provided', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(queryByTestId('my-bookings-btn')).toBeNull();
    });

    it('always shows the logout button in the dropdown', () => {
      const { getByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('logout-btn')).toBeTruthy();
    });
  });

  describe('logout-btn', () => {
    it('closes the dropdown when logout is pressed', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('menu-dropdown')).toBeTruthy();
      fireEvent.press(getByTestId('logout-btn'));
      expect(queryByTestId('menu-dropdown')).toBeNull();
    });
  });

  describe('showFlag', () => {
    it('shows the flag button', () => {
      const { getByTestId } = render(<Header showFlag />);
      expect(getByTestId('flag-btn')).toBeTruthy();
    });

    it('opens the flag dropdown when the button is pressed', () => {
      const { getByTestId, queryByTestId } = render(<Header showFlag />);
      expect(queryByTestId('flag-dropdown')).toBeNull();
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByTestId('flag-dropdown')).toBeTruthy();
    });

    it('closes the flag dropdown when the overlay is pressed', () => {
      const { getByTestId, queryByTestId } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      fireEvent.press(getByTestId('flag-overlay'));
      expect(queryByTestId('flag-dropdown')).toBeNull();
    });

    it('selecting a country closes the dropdown and updates the flag', () => {
      const { getByTestId, queryByTestId } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      fireEvent.press(getByTestId('flag-option-ar'));
      expect(queryByTestId('flag-dropdown')).toBeNull();
      expect(getByTestId('flag-img-ar')).toBeTruthy();
    });

    it('shows all three country options in the dropdown', () => {
      const { getByTestId, getByText } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByText('Colombia')).toBeTruthy();
      expect(getByText('Argentina')).toBeTruthy();
      expect(getByText('Estados Unidos')).toBeTruthy();
    });

    it('defaults to Colombia as the initial selection', () => {
      const { getByTestId } = render(<Header showFlag />);
      expect(getByTestId('flag-img-co')).toBeTruthy();
    });
  });

  describe('safe area', () => {
    it('renders without error when insets.top has a value', () => {
      __setSafeAreaInsets({ top: 44, right: 0, bottom: 34, left: 0 });
      const { getByTestId } = render(<Header showLogo showCart showLogin showMenu showFlag />);
      expect(getByTestId('header-logo')).toBeTruthy();
    });
  });

  describe('independent dropdowns', () => {
    it('opening the menu dropdown does not open the flag dropdown', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu showFlag />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('menu-dropdown')).toBeTruthy();
      expect(queryByTestId('flag-dropdown')).toBeNull();
    });

    it('opening the flag dropdown does not open the menu dropdown', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByTestId('flag-dropdown')).toBeTruthy();
      expect(queryByTestId('menu-dropdown')).toBeNull();
    });

    it('closing the menu dropdown does not close the flag dropdown', () => {
      const { getByTestId } = render(<Header showMenu showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('flag-dropdown')).toBeTruthy();
      expect(getByTestId('menu-dropdown')).toBeTruthy();
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('flag-dropdown')).toBeTruthy();
    });
  });
});
