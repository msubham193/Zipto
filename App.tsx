import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import {store} from './src/store';
import './src/i18n'; // Init i18n
import RootNavigator from './src/navigation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useAuthStore} from './src/store/useAuthStore';
import {notificationApi} from './src/api/client';
import {
  requestPermissionAndGetToken,
  onForegroundMessage,
  registerBackgroundHandler,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
} from './src/services/fcmService';

// Register background handler at module level (before app boots)
registerBackgroundHandler();

function FcmInitializer() {
  const {isAuthenticated} = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {return;}

    let unsubForeground: () => void = () => {};
    let unsubTokenRefresh: () => void = () => {};
    let unsubOpenedApp: () => void = () => {};

    const init = async () => {
      // 1. Request permission + register token
      const token = await requestPermissionAndGetToken();
      if (token) {
        notificationApi.registerFcmToken(token).catch(() => {});
      }

      // 2. Foreground messages — show a local alert or update notification badge
      unsubForeground = onForegroundMessage(_message => {
        // Notification handled in-app via the Notifications inbox screen
      });

      // 3. Token refresh — re-register with backend
      unsubTokenRefresh = onTokenRefresh(newToken => {
        notificationApi.registerFcmToken(newToken).catch(() => {});
      });

      // 4. App opened from background notification
      unsubOpenedApp = onNotificationOpenedApp(_message => {
        // Navigation to specific screen can be added here if needed
      });

      // 5. App launched from quit-state notification
      const initial = await getInitialNotification();
      if (initial) {
        // Navigation to specific screen can be added here if needed
      }
    };

    init();

    return () => {
      unsubForeground();
      unsubTokenRefresh();
      unsubOpenedApp();
    };
  }, [isAuthenticated]);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <FcmInitializer />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;