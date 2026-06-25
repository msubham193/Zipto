import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'zipto_pending_rating';

export interface PendingRating {
  bookingId: string;
  driverName?: string;
}

/**
 * A delivered-but-not-yet-rated booking, persisted so the rating prompt can be
 * surfaced on whichever screen the customer lands on (LiveTracking right after
 * delivery, or Home later). Cleared once the customer rates or dismisses it.
 */
export async function setPendingRating(value: PendingRating): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* non-critical */
  }
}

export async function getPendingRating(): Promise<PendingRating | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.bookingId ? (parsed as PendingRating) : null;
  } catch {
    return null;
  }
}

export async function clearPendingRating(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* non-critical */
  }
}
