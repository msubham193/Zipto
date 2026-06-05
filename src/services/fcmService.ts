import { PermissionsAndroid, Platform } from 'react-native';
import { requestPermissionSerialized } from '../utils/permissions';

function getMessaging(): any | null {
  try {
    return require('@react-native-firebase/messaging').default;
  } catch {
    return null;
  }
}

/**
 * Android 13+ (API 33) requires the runtime POST_NOTIFICATIONS permission before
 * the OS will display ANY tray / heads-up push. Firebase's requestPermission()
 * doesn't reliably trigger this dialog, so request it explicitly — serialized so
 * it never races the location-permission dialog on launch.
 */
async function ensureAndroidNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Platform.Version < 33) return;
  const perm = (PermissionsAndroid.PERMISSIONS as any).POST_NOTIFICATIONS;
  if (!perm) return;
  await requestPermissionSerialized(perm);
}

/**
 * Request notification permission and return the FCM device token.
 * Returns null if Firebase is not installed or permission is denied.
 */
export async function requestPermissionAndGetToken(): Promise<string | null> {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      console.log('[FCM] Firebase messaging module not available');
      return null;
    }

    // Android 13+: explicitly request POST_NOTIFICATIONS so tray pushes show.
    await ensureAndroidNotificationPermission();

    const authStatus = await messaging().requestPermission();
    console.log('[FCM] Auth status:', authStatus, '| AUTHORIZED:', messaging.AuthorizationStatus?.AUTHORIZED);
    const enabled =
      authStatus === messaging.AuthorizationStatus?.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus?.PROVISIONAL ||
      authStatus === 1; // fallback: Android always returns 1

    if (!enabled) {
      console.log('[FCM] Permission not enabled, status:', authStatus);
      return null;
    }

    const token = await messaging().getToken();
    console.log('[FCM] Got token:', token ? 'YES' : 'NO');
    if (token) console.log('[FCM_TOKEN_FOR_TEST]', token); // remove after testing
    return token ?? null;
  } catch (e: any) {
    console.log('[FCM] requestPermissionAndGetToken error:', e?.message ?? e);
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
 *
 * The backend sends data-only FCM messages (no `notification` field) so this
 * handler is guaranteed to fire even on OEM Androids with aggressive battery
 * optimization.  We use @notifee/react-native to display the notification
 * ourselves, which bypasses those restrictions.
 */
export function registerBackgroundHandler(): void {
  try {
    const messaging = getMessaging();
    if (!messaging) return;
    messaging().setBackgroundMessageHandler(async (_message: any) => {
      // Firebase handles display automatically for notification messages.
      // No-op handler is required to prevent unhandled promise warnings.
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
