import React from 'react';
import { render } from '@testing-library/react-native';
import { LoginScreen } from '../../../src/screens/LoginScreen';

jest.mock('../../../src/services/identityService');
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ setAuthData: jest.fn() }),
}));
jest.mock('../../../src/components/common/Snackbar', () => ({
  Snackbar: () => null,
}));

const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  jest.useFakeTimers();
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('LoginScreen — accesibilidad', () => {
  describe('campo email', () => {
    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('email-input').props.accessibilityLabel).toBeTruthy();
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('email-input')).toBeTruthy();
    });
  });

  describe('campo contraseña', () => {
    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('password-input').props.accessibilityLabel).toBeTruthy();
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('password-input')).toBeTruthy();
    });
  });

  describe('botón mostrar/ocultar contraseña', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('toggle-password').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('toggle-password').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('botón de envío', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('submit-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('submit-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('comunica accessibilityState.disabled=true cuando los campos están vacíos', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('enlace de registro', () => {
    it('tiene accessibilityRole="link"', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('register-link').props.accessibilityRole).toBe('link');
    });
  });
});
