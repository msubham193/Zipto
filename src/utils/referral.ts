import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_CODE_KEY = 'zipto_pending_referral_code';

/**
 * Extract a referral code from a deep link. Supports:
 *   zipto://refer?code=ABC123
 *   zipto://refer/ABC123
 *   https://ridezipto.com/refer/ABC123
 *   https://ridezipto.com/refer?code=ABC123
 */
export function parseReferralCode(url?: string | null): string | null {
  if (!url) return null;
  try {
    // Query param ?code=
    const queryMatch = url.match(/[?&]code=([A-Za-z0-9]{4,12})/i);
    if (queryMatch?.[1]) return queryMatch[1].toUpperCase();

    // Path segment after /refer/
    const pathMatch = url.match(/refer[/]([A-Za-z0-9]{4,12})/i);
    if (pathMatch?.[1]) return pathMatch[1].toUpperCase();
  } catch {
    /* ignore malformed urls */
  }
  return null;
}

/** Persist a referral code captured from a deep link, to prefill at signup. */
export async function stashReferralCode(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_CODE_KEY, code.toUpperCase());
  } catch {
    /* ignore */
  }
}

/** Read (and clear) a previously stashed referral code. */
export async function popReferralCode(): Promise<string | null> {
  try {
    const code = await AsyncStorage.getItem(PENDING_CODE_KEY);
    if (code) await AsyncStorage.removeItem(PENDING_CODE_KEY);
    return code;
  } catch {
    return null;
  }
}
