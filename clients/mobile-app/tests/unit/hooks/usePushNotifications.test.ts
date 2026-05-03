import { renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '../../../src/hooks/usePushNotifications';

const mockRegisterPushToken = jest.fn();
jest.mock('../../../src/services/pushNotificationService', () => ({
  registerPushToken: (...args: any[]) => mockRegisterPushToken(...args),
}));

jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { user_id: 42, username: 'test' } },
    isAuthenticated: true,
  }),
}));



describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
  });

  it('requests permissions and registers token on mount when authenticated', async () => {
    const onDeepLink = jest.fn();
    renderHook(() => usePushNotifications(onDeepLink));

    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockRegisterPushToken).toHaveBeenCalledWith(
        '42',
        'ExponentPushToken[test]',
        'expo',
      );
    });
  });

  it('does not request permissions again if already asked', async () => {
    await AsyncStorage.setItem('travel-hub-push-permission-asked', 'true');
    const onDeepLink = jest.fn();
    renderHook(() => usePushNotifications(onDeepLink));

    await waitFor(() => {
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });
});
