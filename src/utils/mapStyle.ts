/**
 * Custom Google Map theme for the live-tracking map — a clean, modern, low-noise
 * style (soft greys, muted water, simplified POIs) so the route line, pins and
 * the moving driver marker stand out. Passed to <MapView customMapStyle={MAP_STYLE} />.
 */
export const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f6f8' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e3ebe3' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f1f3f5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e9edf2' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dcec' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9fb6cd' }] },
];
