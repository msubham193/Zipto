/**
 * FCM (Firebase Cloud Messaging) service for the Zipto customer app.
 *
 * Uses a conditional require() so the app runs even before
 * google-services.json is placed in android/app/.
 */

function getMessaging(): any | null {
  try {
    return require('@react-native-firebase/messaging').default;
  } catch {
    return null;
  }
}

/**
 * Request notification permission and return the FCM device token.
 * Returns null if Firebase is not installed or permission is denied.
 */
export async function requestPermissionAndGetToken(): Promise<string | null> {
  try {
    const messaging = getMessaging();
    if (!messaging) return null;

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) return null;

    const token = await messaging().getToken();
    return token ?? null;
  } catch {
    return null;
  }
}

/**
 * Subscribe to foreground messages (app is open).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
  handler: (message: any) => void,
): () => void {
  try {
    const messaging = getMessaging();
    if (!messaging) return () => {};
    return messaging().onMessage(handler);
  } catch {
    return () => {};
  }
}

/**
 * Register a background/quit-state message handler.
 * Must be called at module level (before app boots).
 */
export function registerBackgroundHandler(): void {
  try {
    const messaging = getMessaging();
    if (!messaging) return;
    messaging().setBackgroundMessageHandler(async (_message: any) => {
      // Background messages are handled by the system tray automatically.
      // Add custom logic here if needed (e.g., badge count).
    });
  } catch {
    // Firebase not yet installed
  }
}

/**
 * Subscribe to notification-opened events
 * (user taps a notification while app is in background).
 */
export function onNotificationOpenedApp(
  handler: (message: any) => void,
): () => void {
  try {
    const messaging = getMessaging();
    if (!messaging) return () => {};
    return messaging().onNotificationOpenedApp(handler);
  } catch {
    return () => {};
  }
}

/**
 * Check if the app was launched by tapping a notification (quit state).
 */
export async function getInitialNotification(): Promise<any | null> {
  try {
    const messaging = getMessaging();
    if (!messaging) return null;
    return (await messaging().getInitialNotification()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Subscribe to token refresh events.
 * Returns an unsubscribe function.
 */
export function onTokenRefresh(handler: (token: string) => void): () => void {
  try {
    const messaging = getMessaging();
    if (!messaging) return () => {};
    return messaging().onTokenRefresh(handler);
  } catch {
    return () => {};
  }
}
