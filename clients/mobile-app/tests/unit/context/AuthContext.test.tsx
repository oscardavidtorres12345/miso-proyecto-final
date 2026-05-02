import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../../src/context/AuthContext';

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const mockLoginResponse = {
  status: 'success',
  message: 'Login successful',
  user: {
    user_id: 1,
    username: 'ana.lopez',
    email: 'ana@test.com',
    role: 'GUEST' as const,
    is_active: true,
  },
  permissions: ['read:accommodations'],
  session_ttl_seconds: 3600,
  session_expires_at: new Date(Date.now() + 3_600_000).toISOString(),
  access_token: 'tok123',
  token_type: 'Bearer',
};

function AuthConsumer() {
  const { session, isAuthenticated, token, autoLoggedOut } = useAuth();
  return (
    <Text testID="output">
      {JSON.stringify({ isAuthenticated, token, username: session?.user.username, autoLoggedOut })}
    </Text>
  );
}

function AuthActions() {
  const { setAuthData, clearAuthData } = useAuth();
  return (
    <>
      <Text testID="set-auth" onPress={() => void setAuthData(mockLoginResponse)}>set</Text>
      <Text testID="clear-auth" onPress={() => void clearAuthData()}>clear</Text>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.getItem.mockResolvedValue(null);
  AsyncStorage.setItem.mockResolvedValue(undefined);
  AsyncStorage.removeItem.mockResolvedValue(undefined);
});

describe('AuthContext', () => {
  describe('initial state', () => {
    it('starts unauthenticated when AsyncStorage is empty', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );
      await act(async () => {});
      const output = JSON.parse(getByTestId('output').props.children);
      expect(output.isAuthenticated).toBe(false);
      expect(output.token).toBeNull();
    });

    it('restores session from AsyncStorage on mount', async () => {
      const stored = {
        user: mockLoginResponse.user,
        permissions: mockLoginResponse.permissions,
        sessionExpiresAt: mockLoginResponse.session_expires_at,
        token: 'tok123',
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(stored));

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );
      await act(async () => {});

      const output = JSON.parse(getByTestId('output').props.children);
      expect(output.isAuthenticated).toBe(true);
      expect(output.token).toBe('tok123');
      expect(output.username).toBe('ana.lopez');
    });

    it('ignores expired sessions on mount', async () => {
      const expiredSession = {
        user: mockLoginResponse.user,
        permissions: [],
        sessionExpiresAt: new Date(Date.now() - 1000).toISOString(),
        token: 'expired-tok',
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(expiredSession));

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );
      await act(async () => {});

      const output = JSON.parse(getByTestId('output').props.children);
      expect(output.isAuthenticated).toBe(false);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('travel-hub-auth');
    });

    it('handles corrupted AsyncStorage data gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('not-valid-json{{');

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );
      await act(async () => {});

      const output = JSON.parse(getByTestId('output').props.children);
      expect(output.isAuthenticated).toBe(false);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('travel-hub-auth');
    });
  });

  describe('setAuthData', () => {
    it('persists session to AsyncStorage', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
          <AuthActions />
        </AuthProvider>
      );
      await act(async () => {});

      await act(async () => {
        getByTestId('set-auth').props.onPress();
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'travel-hub-auth',
        expect.stringContaining('"username":"ana.lopez"')
      );
    });

    it('updates isAuthenticated to true', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
          <AuthActions />
        </AuthProvider>
      );
      await act(async () => {});

      await act(async () => {
        getByTestId('set-auth').props.onPress();
      });

      const output = JSON.parse(getByTestId('output').props.children);
      expect(output.isAuthenticated).toBe(true);
      expect(output.token).toBe('tok123');
    });
  });

  describe('clearAuthData', () => {
    it('removes session from AsyncStorage and sets unauthenticated', async () => {
      const stored = {
        user: mockLoginResponse.user,
        permissions: [],
        sessionExpiresAt: mockLoginResponse.session_expires_at,
        token: 'tok123',
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(stored));

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
          <AuthActions />
        </AuthProvider>
      );
      await act(async () => {});

      await act(async () => {
        getByTestId('clear-auth').props.onPress();
      });

      const output = JSON.parse(getByTestId('output').props.children);
      expect(output.isAuthenticated).toBe(false);
      expect(output.token).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('travel-hub-auth');
    });
  });

  describe('auto-logout timer', () => {
    it('sets autoLoggedOut when session expires', async () => {
      jest.useFakeTimers();

      const soonExpiring = {
        user: mockLoginResponse.user,
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 1000).toISOString(),
        token: 'tok123',
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(soonExpiring));

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );
      await act(async () => {});

      let output = JSON.parse(getByTestId('output').props.children);
      expect(output.isAuthenticated).toBe(true);

      await act(async () => {
        jest.advanceTimersByTime(1001);
      });

      output = JSON.parse(getByTestId('output').props.children);
      expect(output.isAuthenticated).toBe(false);
      expect(output.autoLoggedOut).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('travel-hub-auth');

      jest.useRealTimers();
    });
  });

  describe('useAuth outside provider', () => {
    it('throws when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within AuthProvider');
      consoleError.mockRestore();
    });
  });
});
