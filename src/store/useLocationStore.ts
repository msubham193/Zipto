import { create } from 'zustand';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleMapsApi } from '../api/googleMaps';
import { requestPermissionSerialized } from '../utils/permissions';

const STALE_MS = 10 * 60 * 1000;   // background refresh after 10 min
const ERROR_RETRY_MS = 90 * 1000;  // retry after error in 90 sec
const COORD_THRESHOLD = 0.0005;    // ~50m — skip geocode if barely moved
const STORAGE_KEY = '@zipto_location_v1';

interface LocationState {
  address: string;
  latitude: number | null;
  longitude: number | null;
  fetchedAt: number | null;
  loading: boolean;
  hydrated: boolean; // true once AsyncStorage has been read

  fetch: (force?: boolean) => Promise<void>;
  isStale: () => boolean;
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  // Serialized so it never races the notification-permission dialog on launch
  // (Android shows only one permission dialog at a time).
  return requestPermissionSerialized(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'Zipto needs your location to show nearby services.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    },
  );
}

function getGPS(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      reject,
      // maximumAge: use device-cached GPS if less than 2 min old — instant on most devices
      // timeout reduced to 5s so the skeleton clears faster on first permission grant
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 },
    ),
  );
}

function coordsMoved(lat1: number | null, lon1: number | null, lat2: number, lon2: number): boolean {
  if (lat1 === null || lon1 === null) return true;
  return Math.abs(lat1 - lat2) > COORD_THRESHOLD || Math.abs(lon1 - lon2) > COORD_THRESHOLD;
}

let _fetchPromise: Promise<void> | null = null;

export const useLocationStore = create<LocationState>((set, get) => {
  // Hydrate from AsyncStorage immediately on module load
  AsyncStorage.getItem(STORAGE_KEY)
    .then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          const state = get();
          // Only restore if store is still empty (nothing fetched yet)
          if (!state.address) {
            set({
              address: saved.address,
              latitude: saved.latitude,
              longitude: saved.longitude,
              fetchedAt: saved.fetchedAt,
            });
          }
        } catch {}
      }
    })
    .catch(() => {})
    .finally(() => set({ hydrated: true }));

  return {
    address: '',
    latitude: null,
    longitude: null,
    fetchedAt: null,
    loading: false,
    hydrated: false,

    isStale: () => {
      const { fetchedAt } = get();
      if (!fetchedAt) return true;
      return Date.now() - fetchedAt > STALE_MS;
    },

    fetch: async (force = false) => {
      // Deduplicate concurrent calls
      if (_fetchPromise) return _fetchPromise;

      const state = get();

      // Use error-retry window: if last fetch failed (address='Current Location', fetchedAt set),
      // don't hammer — wait ERROR_RETRY_MS unless forced
      if (!force && state.fetchedAt && state.address === 'Current Location') {
        if (Date.now() - state.fetchedAt < ERROR_RETRY_MS) return;
      }

      // Skip if cache is fresh and not forced
      if (!force && !state.isStale() && state.address && state.address !== 'Current Location') return;

      _fetchPromise = (async () => {
        // Only show skeleton when we have no address at all
        if (!get().address) set({ loading: true });

        try {
          const granted = await requestPermission();
          if (!granted) {
            set({ address: 'Location permission denied', fetchedAt: Date.now(), loading: false });
            return;
          }

          const { latitude, longitude } = await getGPS();

          // Skip reverse geocode if device barely moved — reuse existing address
          const current = get();
          if (!force && current.address && current.address !== 'Current Location' &&
              !coordsMoved(current.latitude, current.longitude, latitude, longitude)) {
            set({ latitude, longitude, fetchedAt: Date.now(), loading: false });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, latitude, longitude, fetchedAt: Date.now() })).catch(() => {});
            return;
          }

          // Coords obtained — clear the skeleton immediately so the header stops blocking.
          // Reverse geocoding runs in the background and updates the address quietly.
          set({ latitude, longitude, loading: false, address: get().address || 'Detecting address…' });

          // Reverse geocode
          let address = 'Current Location';
          try {
            const raw = await googleMapsApi.reverseGeocode(latitude, longitude);
            const isFallback = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(raw?.trim() ?? '');
            if (raw && !isFallback) {
              address = raw.split(',').slice(0, 2).join(', ');
            }
          } catch {
            // Geocode failed — keep address as 'Current Location', still cache coords
          }

          const next = { address, latitude, longitude, fetchedAt: Date.now() };
          set({ ...next });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});

        } catch {
          // GPS failed — mark fetchedAt so we don't retry immediately
          const hadAddress = get().address;
          set({
            loading: false,
            fetchedAt: Date.now(), // ← KEY FIX: stops infinite retry
            address: hadAddress || 'Current Location',
          });
        } finally {
          _fetchPromise = null;
        }
      })();

      return _fetchPromise;
    },
  };
});
