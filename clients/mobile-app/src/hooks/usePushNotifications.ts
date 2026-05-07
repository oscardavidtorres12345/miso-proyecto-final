import { useEffect, useRef, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { registerPushToken } from '../services/pushNotificationService';

const PUSH_PERMISSION_KEY = 'travel-hub-push-permission-asked';

export type DeepLinkHandler = (url: string) => void;

async function requestPushPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

async function getDevicePushTokenSafe(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data;
  } catch (err) {
    console.warn('Failed to get device push token:', err);
    return null;
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(onDeepLink: DeepLinkHandler) {
  const { session, isAuthenticated } = useAuth();
  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const url = response.notification.request.content.data?.url as string | undefined;
      if (url) {
        onDeepLink(url);
      }
    },
    [onDeepLink],
  );

  useEffect(() => {
    if (!isAuthenticated || !session?.user) return;

    let isMounted = true;

    const setupPush = async () => {
      try {
        const alreadyAsked = await AsyncStorage.getItem(PUSH_PERMISSION_KEY);
        if (!alreadyAsked) {
          await requestPushPermissions();
          await AsyncStorage.setItem(PUSH_PERMISSION_KEY, 'true');
        } else {
          await requestPushPermissions();
        }

        if (!isMounted) return;

        const token = await getDevicePushTokenSafe();
        if (token && isMounted) {
          await registerPushToken(
            String(session.user.user_id),
            token,
            Platform.OS,
          );
        }
      } catch (err) {
        // Best-effort: don't block app if push setup fails
        console.warn('Push notification setup failed:', err);
      }
    };

    setupPush();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, session]);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationResponse]);

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      onDeepLink(url);
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        onDeepLink(url);
      }
    });

    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription.remove();
    };
  }, [onDeepLink]);


}
