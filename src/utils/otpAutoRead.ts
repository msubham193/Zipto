/**
 * OTP auto-fetch helpers (Android).
 *
 * Layered so the OTP fills with zero taps where possible:
 *   1. react-native-otp-verify  — SMS Retriever API, fully hands-free. Requires
 *      the app's 11-char hash to be appended to the OTP SMS (see logOtpHash()).
 *   2. Clipboard                — if the user copied the code, pull it in.
 *   3. (OS autofill props on the TextInput handle the rest — keyboard chip / iOS.)
 *
 * Every function degrades to a safe no-op if the native module isn't installed,
 * so the screen never crashes during/after install.
 */
import { Platform } from 'react-native';

const OTP_LEN = 6;

let RNOtpVerify: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-otp-verify');
  RNOtpVerify = mod?.default ?? mod;
} catch {
  RNOtpVerify = null;
}

let Clipboard: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch {
  Clipboard = null;
}

/** Pull the first N-digit run out of an SMS body. */
function extractOtp(message: string): string | null {
  const m = (message || '').match(new RegExp(`(\\d{${OTP_LEN}})`));
  return m ? m[1] : null;
}

/**
 * Start hands-free SMS auto-read. Calls `onOtp(code)` when the OTP SMS arrives.
 * Returns an unsubscribe function. Android-only; no-op elsewhere.
 */
export function startOtpAutoRead(onOtp: (otp: string) => void): () => void {
  if (Platform.OS !== 'android' || !RNOtpVerify?.getOtp) return () => {};
  try {
    RNOtpVerify.getOtp()
      .then(() =>
        RNOtpVerify.addListener((message: string) => {
          if (!message || message === 'Timeout Error.') return;
          const otp = extractOtp(message);
          if (otp) onOtp(otp);
        }),
      )
      .catch(() => {});
  } catch {
    /* ignore */
  }
  return () => {
    try {
      RNOtpVerify.removeListener?.();
    } catch {
      /* ignore */
    }
  };
}

/** Read a complete OTP from the clipboard, if present. */
export async function readOtpFromClipboard(): Promise<string | null> {
  if (!Clipboard?.getString) return null;
  try {
    const text = await Clipboard.getString();
    const digits = (text || '').replace(/\D/g, '');
    return digits.length === OTP_LEN ? digits : null;
  } catch {
    return null;
  }
}

/**
 * DEV AID: returns this build's SMS Retriever hash. Append it to the OTP SMS
 * (last line) so SMS Retriever can match it. Debug and release builds differ.
 */
export async function logOtpHash(): Promise<string | null> {
  if (Platform.OS !== 'android' || !RNOtpVerify?.getHash) return null;
  try {
    const hashes: string[] = await RNOtpVerify.getHash();
    const hash = hashes?.[0] ?? null;
    if (hash) console.log('[OTP] SMS Retriever app hash:', hash);
    return hash;
  } catch {
    return null;
  }
}
