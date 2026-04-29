import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Header } from '../../../src/components/common/Header';

const { __setSafeAreaInsets } = require('react-native-safe-area-context');

beforeEach(() => {
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

describe('Header', () => {
  describe('render vacío', () => {
    it('no muestra ningún elemento cuando no se pasan props', () => {
      const { queryByTestId } = render(<Header />);
      expect(queryByTestId('header-logo')).toBeNull();
      expect(queryByTestId('cart-btn')).toBeNull();
      expect(queryByTestId('login-btn')).toBeNull();
      expect(queryByTestId('menu-btn')).toBeNull();
      expect(queryByTestId('flag-btn')).toBeNull();
    });
  });

  describe('showLogo', () => {
    it('muestra el logo cuando showLogo es true', () => {
      const { getByTestId } = render(<Header showLogo />);
      expect(getByTestId('header-logo')).toBeTruthy();
    });

    it('no muestra el logo cuando showLogo es false', () => {
      const { queryByTestId } = render(<Header showLogo={false} />);
      expect(queryByTestId('header-logo')).toBeNull();
    });
  });

  describe('showCart', () => {
    it('muestra el botón de carrito cuando showCart es true', () => {
      const { getByTestId } = render(<Header showCart />);
      expect(getByTestId('cart-btn')).toBeTruthy();
    });

    it('no muestra badge cuando cartItemCount es 0', () => {
      const { queryByTestId } = render(<Header showCart cartItemCount={0} />);
      expect(queryByTestId('cart-badge')).toBeNull();
    });

    it('muestra badge con número cuando cartItemCount > 0', () => {
      const { getByTestId, getByText } = render(<Header showCart cartItemCount={5} />);
      expect(getByTestId('cart-badge')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('muestra "99+" cuando cartItemCount > 99', () => {
      const { getByText } = render(<Header showCart cartItemCount={100} />);
      expect(getByText('99+')).toBeTruthy();
    });

    it('muestra "99" exactamente cuando cartItemCount es 99', () => {
      const { getByText } = render(<Header showCart cartItemCount={99} />);
      expect(getByText('99')).toBeTruthy();
    });
  });

  describe('showLogin', () => {
    it('muestra el botón de login con texto "Login"', () => {
      const { getByTestId, getByText } = render(<Header showLogin />);
      expect(getByTestId('login-btn')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
    });
  });

  describe('showMenu', () => {
    it('muestra el botón de menú', () => {
      const { getByTestId } = render(<Header showMenu />);
      expect(getByTestId('menu-btn')).toBeTruthy();
    });

    it('abre el dropdown al presionar el botón de menú', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      expect(queryByTestId('menu-dropdown')).toBeNull();
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('menu-dropdown')).toBeTruthy();
    });

    it('cierra el dropdown al presionar el botón de menú de nuevo', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('menu-dropdown')).toBeTruthy();
      fireEvent.press(getByTestId('menu-btn'));
      expect(queryByTestId('menu-dropdown')).toBeNull();
    });

    it('cierra el dropdown al presionar el overlay', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      fireEvent.press(getByTestId('menu-overlay'));
      expect(queryByTestId('menu-dropdown')).toBeNull();
    });
  });

  describe('username initial', () => {
    it('muestra la primera letra en mayúscula del username', () => {
      const { getByText } = render(<Header showMenu username="alice" />);
      expect(getByText('A')).toBeTruthy();
    });

    it('usa "U" como fallback cuando el username está vacío', () => {
      const { getByText } = render(<Header showMenu username="" />);
      expect(getByText('U')).toBeTruthy();
    });

    it('usa "U" como fallback cuando no se pasa username', () => {
      const { getByText } = render(<Header showMenu />);
      expect(getByText('U')).toBeTruthy();
    });
  });

  describe('showMyBookings', () => {
    it('muestra "Mis reservas" cuando showMyBookings es true y el menú está abierto', () => {
      const { getByTestId, getByText } = render(<Header showMenu showMyBookings />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('my-bookings-btn')).toBeTruthy();
      expect(getByText('Mis reservas')).toBeTruthy();
    });

    it('no muestra "Mis reservas" cuando showMyBookings es false', () => {
      const { getByTestId, queryByTestId } = render(
        <Header showMenu showMyBookings={false} />,
      );
      fireEvent.press(getByTestId('menu-btn'));
      expect(queryByTestId('my-bookings-btn')).toBeNull();
    });

    it('no muestra "Mis reservas" cuando showMyBookings no se pasa', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(queryByTestId('my-bookings-btn')).toBeNull();
    });

    it('siempre muestra "Cerrar sesión" en el dropdown', () => {
      const { getByTestId, getByText } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByText('Cerrar sesión')).toBeTruthy();
    });
  });

  describe('logout-btn', () => {
    it('cierra el dropdown al presionar cerrar sesión', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('menu-dropdown')).toBeTruthy();
      fireEvent.press(getByTestId('logout-btn'));
      expect(queryByTestId('menu-dropdown')).toBeNull();
    });
  });

  describe('showFlag', () => {
    it('muestra el botón de bandera', () => {
      const { getByTestId } = render(<Header showFlag />);
      expect(getByTestId('flag-btn')).toBeTruthy();
    });

    it('abre el dropdown de banderas al presionar el botón', () => {
      const { getByTestId, queryByTestId } = render(<Header showFlag />);
      expect(queryByTestId('flag-dropdown')).toBeNull();
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByTestId('flag-dropdown')).toBeTruthy();
    });

    it('cierra el dropdown al presionar el overlay', () => {
      const { getByTestId, queryByTestId } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      fireEvent.press(getByTestId('flag-overlay'));
      expect(queryByTestId('flag-dropdown')).toBeNull();
    });

    it('seleccionar un país cierra el dropdown y actualiza la bandera', () => {
      const { getByTestId, queryByTestId } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      fireEvent.press(getByTestId('flag-option-ar'));
      expect(queryByTestId('flag-dropdown')).toBeNull();
      expect(getByTestId('flag-img-ar')).toBeTruthy();
    });

    it('muestra las tres opciones de país en el dropdown', () => {
      const { getByTestId, getByText } = render(<Header showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByText('Colombia')).toBeTruthy();
      expect(getByText('Argentina')).toBeTruthy();
      expect(getByText('Estados Unidos')).toBeTruthy();
    });

    it('la selección inicial es Colombia', () => {
      const { getByTestId } = render(<Header showFlag />);
      expect(getByTestId('flag-img-co')).toBeTruthy();
    });
  });

  describe('safe area', () => {
    it('renderiza sin error cuando insets.top tiene valor', () => {
      __setSafeAreaInsets({ top: 44, right: 0, bottom: 34, left: 0 });
      const { getByTestId } = render(<Header showLogo showCart showLogin showMenu showFlag />);
      expect(getByTestId('header-logo')).toBeTruthy();
    });
  });

  describe('dropdowns independientes', () => {
    it('abrir el dropdown de menú no abre el de banderas', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu showFlag />);
      fireEvent.press(getByTestId('menu-btn'));
      expect(getByTestId('menu-dropdown')).toBeTruthy();
      expect(queryByTestId('flag-dropdown')).toBeNull();
    });

    it('abrir el dropdown de banderas no abre el de menú', () => {
      const { getByTestId, queryByTestId } = render(<Header showMenu showFlag />);
      fireEvent.press(getByTestId('flag-btn'));
      expect(getByTestId('flag-dropdown')).toBeTruthy();
      expect(queryByTestId('menu-dropdown')).toBeNull();
    });

    it('cerrar el dropdown de menú no cierra el de banderas', () => {
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
