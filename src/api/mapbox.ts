import axios from 'axios';
import {MAPBOX_PUBLIC_TOKEN} from '../config/mapboxToken.ts';

const MAPBOX_ACCESS_TOKEN = MAPBOX_PUBLIC_TOKEN;

// Mapbox Search Box API v1 client
const searchBoxClient = axios.create({
  baseURL: 'https://api.mapbox.com/search/searchbox/v1',
});

// Mapbox Geocoding API client for reverse geocoding
const geocodingClient = axios.create({
  baseURL: 'https://api.mapbox.com/search/geocode/v6',
});

// Mapbox Directions API client
const directionsClient = axios.create({
  baseURL: 'https://api.mapbox.com/directions/v5/mapbox',
});

export const mapboxApi = {
  /**
   * Search for places using Mapbox Search Box API v1
   * Provides better autocomplete suggestions
   */
  searchPlaces: async (
    query: string,
    proximity?: {lat: number; lng: number},
    sessionToken?: string,
  ) => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      // Build URL with parameters
      let url = `/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_ACCESS_TOKEN}&country=IN&language=en&limit=10`;

      // Add proximity if available for better results
      if (proximity) {
        url += `&proximity=${proximity.lng},${proximity.lat}`;
      }

      // Add session token for better analytics (optional)
      if (sessionToken) {
        url += `&session_token=${sessionToken}`;
      }

      // Add types filter for relevant results
      url += `&types=address,poi,street,locality,place`;

      const response = await searchBoxClient.get(url);

      if (!response.data.suggestions || response.data.suggestions.length === 0) {
        return [];
      }

      // Map suggestions to our location format
      return response.data.suggestions.map((suggestion: any) => ({
        id: suggestion.mapbox_id || suggestion.name,
        name: suggestion.name,
        address: suggestion.full_address || suggestion.place_formatted || suggestion.name,
        center: suggestion.center
          ? [suggestion.center[0], suggestion.center[1]]
          : undefined, // [lng, lat]
        context: suggestion.context,
        metadata: {
          mapbox_id: suggestion.mapbox_id,
          feature_type: suggestion.feature_type,
        },
      }));
    } catch (error) {
      console.error('Mapbox Search Box API error:', error);
      return [];
    }
  },

  /**
   * Reverse geocode coordinates to get address
   * Uses Mapbox Geocoding API v6
   */
  reverseGeocode: async (lat: number, lng: number) => {
    const coordinateFallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    try {
      const response = await geocodingClient.get('/reverse', {
        params: {
          longitude: lng,
          latitude: lat,
          access_token: MAPBOX_ACCESS_TOKEN,
          language: 'en',
          limit: 1,
          // Geocoding v6 does not support `poi` in types.
          types:
            'address,street,neighborhood,locality,place,district,region',
        },
      });

      const features = response.data?.features;
      if (features && features.length > 0) {
        const selectedFeature = features[0];

        return (
          selectedFeature.properties?.full_address ||
          selectedFeature.properties?.place_formatted ||
          selectedFeature.properties?.name ||
          selectedFeature.place_name ||
          coordinateFallback
        );
      }
    } catch (error) {
      console.error('Mapbox reverse geocode v6 error:', error);
    }

    // Fallback: legacy geocoding endpoint is still widely supported for reverse lookups.
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            language: 'en',
            limit: 1,
            types: 'address,place,locality,neighborhood',
          },
        },
      );

      const feature = response.data?.features?.[0];
      if (feature) {
        return feature.place_name || feature.text || coordinateFallback;
      }
    } catch (error) {
      console.error('Mapbox reverse geocode v5 fallback error:', error);
    }

    return coordinateFallback;
  },

  /**
   * Retrieve full details of a place using mapbox_id
   * Useful after user selects a suggestion
   */
  retrievePlace: async (mapboxId: string, sessionToken?: string) => {
    try {
      let url = `/retrieve/${mapboxId}?access_token=${MAPBOX_ACCESS_TOKEN}`;

      if (sessionToken) {
        url += `&session_token=${sessionToken}`;
      }

      const response = await searchBoxClient.get(url);

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        return {
          id: feature.properties.mapbox_id,
          name: feature.properties.name,
          address:
            feature.properties.full_address ||
            feature.properties.place_formatted,
          center: feature.geometry.coordinates, // [lng, lat]
          properties: feature.properties,
        };
      }
      return null;
    } catch (error) {
      console.error('Mapbox retrieve place error:', error);
      return null;
    }
  },

  /**
   * Get driving directions between two points
   * Returns the route geometry as coordinates array
   */
  getDirections: async (
    origin: [number, number],
    destination: [number, number],
  ): Promise<[number, number][] | null> => {
    try {
      const url = `/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full`;

      const response = await directionsClient.get(url);

      if (response.data.routes && response.data.routes.length > 0) {
        return response.data.routes[0].geometry.coordinates as [number, number][];
      }
      return null;
    } catch (error) {
      console.error('Mapbox Directions API error:', error);
      return null;
    }
  },
};
