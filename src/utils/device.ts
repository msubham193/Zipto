import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALL_ID_KEY = 'bookfleet_install_id';

let cached: string | null = null;

/**
 * A stable, anonymous per-install id (persisted in AsyncStorage). Used for
 * referral anti-abuse — it is NOT a hardware id and survives only until the
 * app's data is cleared / reinstalled, which is exactly the granularity we want.
 */
export async function getInstallId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
  } catch {
    /* ignore */
  }
  const generated =
    `${Date.now().toString(36)}-` +
    `${Math.random().toString(36).slice(2, 10)}-` +
    `${Math.random().toString(36).slice(2, 10)}`;
  cached = generated;
  try {
    await AsyncStorage.setItem(INSTALL_ID_KEY, generated);
  } catch {
    /* ignore */
  }
  return generated;
}
