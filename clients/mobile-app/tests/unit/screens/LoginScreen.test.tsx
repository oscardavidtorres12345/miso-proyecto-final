import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { LoginScreen } from '../../../src/screens/LoginScreen';

describe('LoginScreen', () => {
  describe('render inicial', () => {
    it('muestra el título "Inicia sesión en tu cuenta"', () => {
      const { getByText } = render(<LoginScreen />);
      expect(getByText('Inicia sesión en tu cuenta')).toBeTruthy();
    });

    it('muestra los labels de los campos', () => {
      const { getByText } = render(<LoginScreen />);
      expect(getByText('Correo')).toBeTruthy();
      expect(getByText('Contraseña')).toBeTruthy();
    });

    it('muestra el botón de ingresar', () => {
      const { getByTestId } = render(<LoginScreen />);
      expect(getByTestId('submit-btn')).toBeTruthy();
    });

    it('el botón está deshabilitado al inicio', () => {
      const { getByTestId } = render(<LoginScreen />);
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });

    it('muestra el link de registro', () => {
      const { getByText } = render(<LoginScreen />);
      expect(getByText('Regístrate')).toBeTruthy();
    });

    it('no muestra errores antes de interactuar', () => {
      const { queryByTestId } = render(<LoginScreen />);
      expect(queryByTestId('email-error')).toBeNull();
      expect(queryByTestId('password-error')).toBeNull();
    });
  });

  describe('validación de email', () => {
    it('muestra "Campo requerido" cuando el email está vacío y pierde el foco', () => {
      const { getByTestId, getByText } = render(<LoginScreen />);
      fireEvent(getByTestId('email-input'), 'blur');
      expect(getByTestId('email-error')).toBeTruthy();
      expect(getByText('Campo requerido')).toBeTruthy();
    });

    it('muestra "Correo inválido" cuando el formato es incorrecto', () => {
      const { getByTestId, getByText } = render(<LoginScreen />);
      fireEvent.changeText(getByTestId('email-input'), 'no-es-email');
      fireEvent(getByTestId('email-input'), 'blur');
      expect(getByText('Correo inválido')).toBeTruthy();
    });

    it('no muestra error cuando el email es válido', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent(getByTestId('email-input'), 'blur');
      expect(queryByTestId('email-error')).toBeNull();
    });

    it('no muestra error antes del primer blur', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);
      fireEvent.changeText(getByTestId('email-input'), 'malo');
      expect(queryByTestId('email-error')).toBeNull();
    });
  });

  describe('validación de contraseña', () => {
    it('muestra "Campo requerido" cuando la contraseña está vacía y pierde el foco', () => {
      const { getByTestId, getByText } = render(<LoginScreen />);
      fireEvent(getByTestId('password-input'), 'blur');
      expect(getByTestId('password-error')).toBeTruthy();
      expect(getByText('Campo requerido')).toBeTruthy();
    });

    it('no muestra error cuando la contraseña tiene valor', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);
      fireEvent.changeText(getByTestId('password-input'), 'miPassword123');
      fireEvent(getByTestId('password-input'), 'blur');
      expect(queryByTestId('password-error')).toBeNull();
    });

    it('no muestra error antes del primer blur', () => {
      const { queryByTestId } = render(<LoginScreen />);
      expect(queryByTestId('password-error')).toBeNull();
    });
  });

  describe('estado del botón', () => {
    it('habilita el botón cuando email válido y contraseña con valor', () => {
      const { getByTestId } = render(<LoginScreen />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'miPassword123');
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(false);
    });

    it('mantiene el botón deshabilitado con email inválido', () => {
      const { getByTestId } = render(<LoginScreen />);
      fireEvent.changeText(getByTestId('email-input'), 'no-es-email');
      fireEvent.changeText(getByTestId('password-input'), 'miPassword123');
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });

    it('mantiene el botón deshabilitado sin contraseña', () => {
      const { getByTestId } = render(<LoginScreen />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });

    it('mantiene el botón deshabilitado sin email', () => {
      const { getByTestId } = render(<LoginScreen />);
      fireEvent.changeText(getByTestId('password-input'), 'miPassword123');
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('toggle de contraseña', () => {
    it('muestra el ícono Eye por defecto (contraseña oculta)', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);
      expect(getByTestId('icon-Eye')).toBeTruthy();
      expect(queryByTestId('icon-EyeOff')).toBeNull();
    });

    it('muestra EyeOff al presionar toggle (contraseña visible)', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);
      fireEvent.press(getByTestId('toggle-password'));
      expect(getByTestId('icon-EyeOff')).toBeTruthy();
      expect(queryByTestId('icon-Eye')).toBeNull();
    });

    it('vuelve a Eye al presionar toggle dos veces', () => {
      const { getByTestId } = render(<LoginScreen />);
      fireEvent.press(getByTestId('toggle-password'));
      fireEvent.press(getByTestId('toggle-password'));
      expect(getByTestId('icon-Eye')).toBeTruthy();
    });
  });
});
