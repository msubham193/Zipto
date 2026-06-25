import { PermissionsAndroid, Platform, Rationale } from 'react-native';

/**
 * Android can only show ONE runtime-permission dialog at a time. If two
 * `PermissionsAndroid.request` calls overlap (e.g. location + notifications on
 * app launch), the second is silently dropped and its dialog never appears.
 *
 * This serializes every permission request through a single promise chain so
 * the dialogs are always shown one after another, never racing.
 */
let chain: Promise<unknown> = Promise.resolve();

export async function requestPermissionSerialized(
  permission: string,
  rationale?: Rationale,
): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const run = async (): Promise<boolean> => {
    try {
      const perm = permission as any;
      if (!perm) return false;
      const already = await PermissionsAndroid.check(perm);
      if (already) return true;
      const result = await PermissionsAndroid.request(perm, rationale);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const result = chain.then(run, run) as Promise<boolean>;
  // Keep the chain alive regardless of this request's outcome.
  chain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
