import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../../src/screens/LoginScreen';
import { loginUser } from '../../../src/services/identityService';
import esCO from '../../../src/i18n/locales/es-CO';
import { API_CONFIG } from '../../../src/config/api';

const mockSetAuthData = jest.fn();

jest.mock('../../../src/services/identityService');
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ setAuthData: mockSetAuthData }),
}));
jest.mock('../../../src/components/common/Snackbar', () => ({
  Snackbar: ({ show, message }: { show: boolean; message: string }) => {
    const { Text } = require('react-native');
    return show ? <Text testID="snackbar">{message}</Text> : null;
  },
}));

describe('LoginScreen', () => {
  describe('initial render', () => {
    it('should display the title "Inicia sesión en tu cuenta"', () => {
      const { getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByText(esCO.login.title)).toBeTruthy();
    });

    it('should display the email label', () => {
      const { getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByText(esCO.login.emailLabel)).toBeTruthy();
    });

    it('should display the password label', () => {
      const { getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByText(esCO.login.passwordLabel)).toBeTruthy();
    });

    it('should display the login button', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('submit-btn')).toBeTruthy();
    });

    it('should have the login button disabled initially', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });

    it('should display the registration link', () => {
      const { getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByText(esCO.login.register)).toBeTruthy();
    });

    it('should open the registration URL when pressing the link', () => {
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.press(getByTestId('register-link'));
      expect(openURL).toHaveBeenCalledWith(`${API_CONFIG.WEB_APP_URL}/signup`);
      openURL.mockRestore();
    });

    it('should not display errors before interacting', () => {
      const { queryByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(queryByTestId('email-error')).toBeNull();
      expect(queryByTestId('password-error')).toBeNull();
    });
  });

  describe('email validation', () => {
    it('should display "Campo requerido" when the email is empty and loses focus', () => {
      const { getByTestId, getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent(getByTestId('email-input'), 'blur');
      expect(getByTestId('email-error')).toBeTruthy();
      expect(getByText(esCO.login.fieldRequired)).toBeTruthy();
    });

    it('should display "Correo inválido" when the format is incorrect', () => {
      const { getByTestId, getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'no-es-email');
      fireEvent(getByTestId('email-input'), 'blur');
      expect(getByText(esCO.login.invalidEmail)).toBeTruthy();
    });

    it('should not display an error when the email is valid', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent(getByTestId('email-input'), 'blur');
      expect(queryByTestId('email-error')).toBeNull();
    });

    it('should not display an error before the first blur', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'malo');
      expect(queryByTestId('email-error')).toBeNull();
    });
  });

  describe('password validation', () => {
    it('should display "Campo requerido" when the password is empty and loses focus', () => {
      const { getByTestId, getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent(getByTestId('password-input'), 'blur');
      expect(getByTestId('password-error')).toBeTruthy();
      expect(getByText(esCO.login.fieldRequired)).toBeTruthy();
    });

    it('should not display an error when the password has a value', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('password-input'), 'miPassword123');
      fireEvent(getByTestId('password-input'), 'blur');
      expect(queryByTestId('password-error')).toBeNull();
    });

    it('should not display an error before the first blur', () => {
      const { queryByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(queryByTestId('password-error')).toBeNull();
    });
  });

  describe('button state', () => {
    it('enables the button when email is valid and password has a value', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'miPassword123');
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(false);
    });

    it('should keep the button disabled with an invalid email', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'no-es-email');
      fireEvent.changeText(getByTestId('password-input'), 'miPassword123');
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });

    it('should keep the button disabled without a password', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });

    it('should keep the button disabled without an email', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('password-input'), 'miPassword123');
      expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('password toggle', () => {
    it('should display the Eye icon by default (password hidden)', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      expect(getByTestId('icon-Eye')).toBeTruthy();
      expect(queryByTestId('icon-EyeOff')).toBeNull();
    });

    it('should display EyeOff when pressing the toggle (password visible)', () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.press(getByTestId('toggle-password'));
      expect(getByTestId('icon-EyeOff')).toBeTruthy();
      expect(queryByTestId('icon-Eye')).toBeNull();
    });

    it('should return to Eye when pressing toggle twice', () => {
      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.press(getByTestId('toggle-password'));
      fireEvent.press(getByTestId('toggle-password'));
      expect(getByTestId('icon-Eye')).toBeTruthy();
    });
  });

  describe('login submission', () => {
    const mockLoginResponse = {
      status: 'success',
      message: 'Login successful',
      user: {
        user_id: 1,
        username: 'ana.lopez',
        email: 'usuario@ejemplo.com',
        role: 'GUEST' as const,
        is_active: true,
      },
      permissions: ['read:accommodations'],
      session_ttl_seconds: 3600,
      session_expires_at: '2026-05-01T12:00:00Z',
      access_token: 'tok123',
      token_type: 'Bearer',
    };

    afterEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
    });

    it('should call loginUser when button is pressed', async () => {
      (loginUser as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      mockSetAuthData.mockResolvedValueOnce(undefined);

      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByTestId('submit-btn'));

      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith({
          email: 'usuario@ejemplo.com',
          password: 'password123',
        });
      });
    });

    it('should call setAuthData with full response on successful login', async () => {
      (loginUser as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      mockSetAuthData.mockResolvedValueOnce(undefined);

      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockSetAuthData).toHaveBeenCalledWith(mockLoginResponse);
      });
    });

    it('should show success snackbar after successful login', async () => {
      (loginUser as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      mockSetAuthData.mockResolvedValueOnce(undefined);

      const { getByTestId, getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByTestId('submit-btn'));

      await waitFor(() => {
        expect(getByText(esCO.login.apiSuccess)).toBeTruthy();
      });
    });

    it('should show loading indicator while submitting', async () => {
      let resolveLogin!: (value: typeof mockLoginResponse) => void;
      (loginUser as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => { resolveLogin = resolve; })
      );

      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByTestId('submit-btn'));

      await waitFor(() => {
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });

      resolveLogin(mockLoginResponse);
    });

    it('should call onLoginSuccess after 2 seconds on success', async () => {
      jest.useFakeTimers();
      (loginUser as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      mockSetAuthData.mockResolvedValueOnce(undefined);

      const onLoginSuccess = jest.fn();
      const { getByTestId } = render(<LoginScreen onLoginSuccess={onLoginSuccess} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockSetAuthData).toHaveBeenCalled();
      });

      expect(onLoginSuccess).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2000);
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });

    it('should show no-permission snackbar and not call setAuthData for STAFF role', async () => {
      const staffResponse = { ...mockLoginResponse, user: { ...mockLoginResponse.user, role: 'STAFF' as const } };
      (loginUser as jest.Mock).mockResolvedValueOnce(staffResponse);

      const onLoginSuccess = jest.fn();
      const { getByTestId, getByText } = render(<LoginScreen onLoginSuccess={onLoginSuccess} />);
      fireEvent.changeText(getByTestId('email-input'), 'staff@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByTestId('submit-btn'));

      await waitFor(() => {
        expect(getByText(esCO.login.noPermission)).toBeTruthy();
      });
      expect(mockSetAuthData).not.toHaveBeenCalled();
      expect(onLoginSuccess).not.toHaveBeenCalled();
    });

    it('should show error snackbar when login fails', async () => {
      const errorMessage = 'Correo o contraseña incorrectos. Intenta de nuevo.';
      (loginUser as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { getByTestId, getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'wrongpassword');
      fireEvent.press(getByTestId('submit-btn'));

      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
        expect(getByTestId('snackbar')).toBeTruthy();
      });
    });

    it('should re-enable the button after submission completes', async () => {
      (loginUser as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      mockSetAuthData.mockResolvedValueOnce(undefined);

      const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
      fireEvent.changeText(getByTestId('email-input'), 'usuario@ejemplo.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByTestId('submit-btn'));

      await waitFor(() => {
        expect(getByTestId('submit-btn').props.accessibilityState?.disabled).toBe(false);
      });
    });
  });
});
