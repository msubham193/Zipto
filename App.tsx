import React, { useEffect, useState, useCallback } from 'react';
import { Platform, Text, TextInput, AppState } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import './src/i18n';
import RootNavigator from './src/navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/useAuthStore';
import { notificationApi, authApi } from './src/api/client';
import { navigationRef } from './src/navigation/navigationRef';
import {
  InAppNotificationBanner,
  NotificationPayload,
} from './src/components/InAppNotificationBanner';
import { CustomAlert } from './src/components/CustomAlert';
import {
  requestPermissionAndGetToken,
  onForegroundMessage,
  registerBackgroundHandler,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
} from './src/services/fcmService';

const defaultFontFamily =
  Platform.select({ ios: 'Poppins', android: 'Poppins-Regular' }) ||
  'Poppins-Regular';

const textInputDefaultProps = ((TextInput as any).defaultProps ?? {}) as any;
textInputDefaultProps.style = [
  textInputDefaultProps.style,
  { fontFamily: defaultFontFamily },
];
(TextInput as any).defaultProps = textInputDefaultProps;

// Register background handler at module level (before app boots)
registerBackgroundHandler();




function navigateFromNotification(data?: Record<string, string>) {
  if (!data || !navigationRef.isReady()) return;
  const { type, bookingId } = data;

  switch (type) {
    case 'booking_accepted':
    case 'trip_started':
      if (bookingId) {
        navigationRef.navigate('LiveTracking', {
          bookingId,
          isRealBooking: true,
        });
      }
      break;
    case 'trip_completed':
      navigationRef.navigate('MyOrders', { filter: 'completed' });
      break;
    default:
      navigationRef.navigate('Notifications');
      break;
  }
}

interface FcmInitializerProps {
  onNotification: (n: NotificationPayload) => void;
}

function FcmInitializer({ onNotification }: FcmInitializerProps) {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubForeground: () => void = () => { };
    let unsubTokenRefresh: () => void = () => { };
    let unsubOpenedApp: () => void = () => { };

    const init = async () => {
      const token = await requestPermissionAndGetToken();
      if (token) {
        notificationApi
          .registerFcmToken(token)
          .catch((e: any) =>
            console.warn('[FCM] Token registration failed', e?.message),
          );
      }

      // Foreground: show in-app banner
      unsubForeground = onForegroundMessage(message => {
        const title =
          message?.notification?.title ||
          (message?.data?.title as string | undefined) ||
          'Zipto';
        const body =
          message?.notification?.body ||
          (message?.data?.body as string | undefined) ||
          '';
        if (!title) return;
        onNotification({
          title,
          body,
          data: (message?.data as Record<string, string> | undefined) ?? {},
        });
      });

      // Token refresh
      unsubTokenRefresh = onTokenRefresh((newToken: string) => {
        notificationApi.registerFcmToken(newToken).catch(() => { });
      });

      // Background tap
      unsubOpenedApp = onNotificationOpenedApp((message: any) => {
        navigateFromNotification(
          message?.data as Record<string, string> | undefined,
        );
      });

      // Quit-state tap
      const initial = await getInitialNotification();
      if (initial) {
        navigateFromNotification(
          (initial as any)?.data as Record<string, string> | undefined,
        );
      }
    };

    init();

    return () => {
      unsubForeground();
      unsubTokenRefresh();
      unsubOpenedApp();
    };
  }, [isAuthenticated, onNotification]);

  return null;
}

/**
 * Signs the customer out if this number's active role was switched to a rider
 * on the Rider app. Checks on mount and whenever the app returns to the
 * foreground, so the logout is prompt (the 401-on-refresh path is the backstop).
 */
function SessionGuard() {
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = async () => {
      const me = await authApi.getMe();
      if (me?.role && me.role !== 'customer') {
        logout();
      }
    };

    check();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [isAuthenticated, logout]);

  return null;
}

function App() {
  const [notification, setNotification] =
    useState<NotificationPayload | null>(null);

  const handleDismiss = useCallback(() => setNotification(null), []);

  const handleNotificationPress = useCallback((n: NotificationPayload) => {
    navigateFromNotification(n.data);
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootNavigator />
        <SessionGuard />
        <FcmInitializer onNotification={setNotification} />
        <InAppNotificationBanner
          notification={notification}
          onDismiss={handleDismiss}
          onPress={handleNotificationPress}
        />
        <CustomAlert />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;