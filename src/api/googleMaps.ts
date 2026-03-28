import axios, { CancelTokenSource } from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBk3embTThBzPAZBmSlIYue_JFHk2iBe9A';

// ── Production timeouts ─────────────────────────────────────────────────────
const API_TIMEOUT = 8000; // 8s — generous but protects against hanging
const SEARCH_TIMEOUT = 5000; // 5s for autocomplete (user is waiting)

// ── In-memory caches with TTL ───────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const reverseGeocodeCache = new Map<string, CacheEntry<string>>();
const directionsCache = new Map<string, CacheEntry<[number, number][]>>();
const placeDetailsCache = new Map<string, CacheEntry<any>>();
const searchCache = new Map<string, CacheEntry<any[]>>();

const CACHE_TTL = {
  REVERSE_GEOCODE: 10 * 60 * 1000, // 10 min — addresses don't change
  DIRECTIONS: 5 * 60 * 1000,       // 5 min — traffic can change
  PLACE_DETAILS: 30 * 60 * 1000,   // 30 min — place data is stable
  SEARCH: 2 * 60 * 1000,           // 2 min — stale suggestions are fine briefly
};

const MAX_CACHE_SIZE = 200; // prevent memory leak on long sessions

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) {
    return entry.data;
  }
  if (entry) {
    cache.delete(key); // expired
  }
  return null;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number) {
  // Evict oldest entries if cache is too large
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
  cache.set(key, { data, expiry: Date.now() + ttl });
}

// ── Rate limiter — prevents burst API calls ─────────────────────────────────
const rateLimiter = {
  lastCallTime: {} as Record<string, number>,
  minInterval: {
    searchPlaces: 300,       // max ~3 requests/sec for autocomplete
    reverseGeocode: 1000,    // max 1/sec for reverse geocode
    getDirections: 2000,     // max 1 per 2s for directions
    retrievePlace: 500,      // max 2/sec for place details
  } as Record<string, number>,

  canProceed(method: string): boolean {
    const now = Date.now();
    const last = this.lastCallTime[method] || 0;
    const min = this.minInterval[method] || 0;
    if (now - last < min) {
      return false;
    }
    this.lastCallTime[method] = now;
    return true;
  },
};

// ── Abort controller for search — cancels previous in-flight request ────────
let searchCancelToken: CancelTokenSource | null = null;

// ── Round coordinates for cache key (4 decimals = ~11m precision) ───────────
function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export const googleMapsApi = {
  /**
   * Search for places using Google Places Autocomplete API
   * - Cancels previous in-flight request
   * - Returns cached results for identical queries
   * - Rate-limited to prevent burst calls
   */
  searchPlaces: async (
    query: string,
    proximity?: {lat: number; lng: number},
    _sessionToken?: string,
  ) => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const trimmed = query.trim().toLowerCase();
      const cacheKey = `${trimmed}|${proximity ? coordKey(proximity.lat, proximity.lng) : ''}`;

      // Check cache first
      const cached = getCached(searchCache, cacheKey);
      if (cached) { return cached; }

      // Rate limit
      if (!rateLimiter.canProceed('searchPlaces')) {
        const fallback = getCached(searchCache, cacheKey);
        return fallback || [];
      }

      // Cancel previous in-flight search request
      if (searchCancelToken) {
        searchCancelToken.cancel('New search supersedes previous');
      }
      searchCancelToken = axios.CancelToken.source();

      const params: Record<string, string> = {
        input: query,
        key: GOOGLE_MAPS_API_KEY,
        components: 'country:in',
        language: 'en',
      };

      if (proximity) {
        params.location = `${proximity.lat},${proximity.lng}`;
        params.radius = '50000';
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        { params, timeout: SEARCH_TIMEOUT, cancelToken: searchCancelToken.token },
      );

      if (response.data.status !== 'OK' || !response.data.predictions) {
        return [];
      }

      const results = response.data.predictions.map((prediction: any) => ({
        id: prediction.place_id,
        name: prediction.structured_formatting?.main_text || prediction.description,
        address: prediction.description,
        center: undefined,
        context: prediction.structured_formatting,
        metadata: {
          place_id: prediction.place_id,
          feature_type: prediction.types?.[0],
        },
      }));

      setCache(searchCache, cacheKey, results, CACHE_TTL.SEARCH);
      return results;
    } catch (error) {
      if (axios.isCancel(error)) {
        return []; // silently return — superseded by newer request
      }
      console.error('Google Places Autocomplete error:', error);
      return [];
    }
  },

  /**
   * Reverse geocode coordinates to get address
   * - Cached for 10 minutes (rounded to ~11m grid)
   * - Rate-limited to 1 call/sec
   */
  reverseGeocode: async (lat: number, lng: number) => {
    const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const cacheKey = coordKey(lat, lng);

    // Check cache
    const cached = getCached(reverseGeocodeCache, cacheKey);
    if (cached) { return cached; }

    // Rate limit — return fallback if throttled
    if (!rateLimiter.canProceed('reverseGeocode')) {
      return fallback;
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            latlng: `${lat},${lng}`,
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
            result_type: 'street_address|route|sublocality',
          },
          timeout: API_TIMEOUT,
        },
      );

      if (response.data.status === 'OK' && response.data.results?.length > 0) {
        const address = response.data.results[0].formatted_address || fallback;
        setCache(reverseGeocodeCache, cacheKey, address, CACHE_TTL.REVERSE_GEOCODE);
        return address;
      }
    } catch (error) {
      console.error('Google reverse geocode error:', error);
    }

    return fallback;
  },

  /**
   * Retrieve full details of a place using place_id
   * - Cached for 30 minutes
   * - Only requests minimal fields to reduce billing
   */
  retrievePlace: async (placeId: string, _sessionToken?: string) => {
    // Check cache
    const cached = getCached(placeDetailsCache, placeId);
    if (cached) { return cached; }

    if (!rateLimiter.canProceed('retrievePlace')) {
      return getCached(placeDetailsCache, placeId) || null;
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            key: GOOGLE_MAPS_API_KEY,
            fields: 'name,formatted_address,geometry',
            language: 'en',
          },
          timeout: API_TIMEOUT,
        },
      );

      if (response.data.status === 'OK' && response.data.result) {
        const result = response.data.result;
        const loc = result.geometry?.location;
        const placeData = {
          id: placeId,
          name: result.name,
          address: result.formatted_address,
          center: loc ? [loc.lng, loc.lat] : undefined,
          properties: result,
        };
        setCache(placeDetailsCache, placeId, placeData, CACHE_TTL.PLACE_DETAILS);
        return placeData;
      }
      return null;
    } catch (error) {
      console.error('Google place details error:', error);
      return null;
    }
  },

  /**
   * Get driving directions between two points
   * - Cached for 5 minutes
   * - Rate-limited to 1 call per 2s
   * Returns coordinates array as [lng, lat][]
   */
  getDirections: async (
    origin: [number, number], // [lng, lat]
    destination: [number, number], // [lng, lat]
  ): Promise<[number, number][] | null> => {
    const cacheKey = `${coordKey(origin[1], origin[0])}->${coordKey(destination[1], destination[0])}`;

    // Check cache
    const cached = getCached(directionsCache, cacheKey);
    if (cached) { return cached; }

    if (!rateLimiter.canProceed('getDirections')) {
      return getCached(directionsCache, cacheKey) || null;
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin: `${origin[1]},${origin[0]}`,
            destination: `${destination[1]},${destination[0]}`,
            key: GOOGLE_MAPS_API_KEY,
            mode: 'driving',
          },
          timeout: API_TIMEOUT,
        },
      );

      if (response.data.status === 'OK' && response.data.routes?.length > 0) {
        const encodedPolyline = response.data.routes[0].overview_polyline?.points;
        if (encodedPolyline) {
          const coords = decodePolyline(encodedPolyline);
          setCache(directionsCache, cacheKey, coords, CACHE_TTL.DIRECTIONS);
          return coords;
        }
      }
      return null;
    } catch (error) {
      console.error('Google Directions API error:', error);
      return null;
    }
  },

  /** Clear all caches — call on logout or app reset */
  clearCaches: () => {
    reverseGeocodeCache.clear();
    directionsCache.clear();
    placeDetailsCache.clear();
    searchCache.clear();
  },
};

/**
 * Decode Google's encoded polyline format into [lng, lat][] coordinates
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}
