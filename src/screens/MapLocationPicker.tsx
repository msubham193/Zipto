import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { googleMapsApi } from '../api/googleMaps';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';


const ODISHA_CENTER = { latitude: 20.2961, longitude: 85.8245 };
const DEFAULT_DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

const MapLocationPicker = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { field, initialLat, initialLon } = (route.params ?? {}) as {
    field: 'pickup' | 'drop';
    initialLat?: number;
    initialLon?: number;
  };

  const initialRegion: Region = {
    latitude: initialLat ?? ODISHA_CENTER.latitude,
    longitude: initialLon ?? ODISHA_CENTER.longitude,
    ...DEFAULT_DELTA,
  };

  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const regionRef = useRef<Region>(initialRegion);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRegionChange = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onRegionChangeComplete = useCallback((r: Region) => {
    regionRef.current = r;
    setIsDragging(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResolving(true);
    setAddress('');
    debounceRef.current = setTimeout(async () => {
      try {
        const addr = await googleMapsApi.reverseGeocode(r.latitude, r.longitude);
        setAddress(addr || '');
      } finally {
        setResolving(false);
      }
    }, 400);
  }, []);

  const handleConfirm = () => {
    if (!address || resolving) return;
    const r = regionRef.current;
    navigation.navigate('PickupDropSelection', {
      pickedLocation: {
        field,
        address,
        lat: r.latitude,
        lon: r.longitude,
      },
    });
  };

  const canConfirm = !!address && !resolving && !isDragging;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Full-screen map */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      />

      {/* Fixed center pin — not a map marker, just an overlay */}
      <View style={s.pinWrap} pointerEvents="none">
        {/* Shadow dot on the ground */}
        <View style={[s.pinShadow, isDragging && s.pinShadowLifted]} />
        {/* Pin icon lifts up while dragging */}
        <View style={[s.pinIcon, isDragging && s.pinIconLifted]}>
          <MaterialIcons
            name="location-pin"
            size={ms(48)}
            color={field === 'pickup' ? '#22C55E' : '#EF4444'}
          />
        </View>
      </View>

      {/* Header overlay */}
      <View style={[s.header, { paddingTop: insets.top + vs(8) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={ms(20)} color="#111" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>
            {field === 'pickup' ? 'Set Pickup' : 'Set Drop Location'}
          </Text>
          <Text style={s.headerSub}>Drag the map to adjust pin</Text>
        </View>
      </View>

      {/* Bottom card */}
      <View style={[s.bottomCard, { paddingBottom: Math.max(insets.bottom, vs(16)) }]}>
        <View style={s.addressRow}>
          <View style={[s.addressDot, field === 'pickup' ? s.addressDotPickup : s.addressDotDrop]} />
          <View style={{ flex: 1 }}>
            <Text style={s.addressFieldLabel}>
              {field === 'pickup' ? 'Pickup Location' : 'Drop Location'}
            </Text>
            {resolving || isDragging ? (
              <View style={s.resolveRow}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={s.resolvingText}>Finding address…</Text>
              </View>
            ) : address ? (
              <Text style={s.addressText} numberOfLines={2}>{address}</Text>
            ) : (
              <Text style={s.addressPlaceholder}>Move map to select location</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[s.confirmBtn, !canConfirm && s.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm}
          activeOpacity={0.85}
        >
          {resolving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="check-circle" size={ms(18)} color="#fff" />
          )}
          <Text style={[s.confirmBtnText, !canConfirm && s.confirmBtnTextDisabled]}>
            Confirm Location
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  // ── Pin overlay ──────────────────────────────────────────────────────────────
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinShadow: {
    position: 'absolute',
    width: ms(14),
    height: ms(6),
    borderRadius: ms(7),
    backgroundColor: 'rgba(0,0,0,0.25)',
    top: '50%',
    marginTop: ms(14), // offset to sit under the pin tip
  },
  pinShadowLifted: {
    width: ms(10),
    height: ms(4),
    opacity: 0.15,
    marginTop: ms(20),
  },
  pinIcon: {
    // nudge up so the tip sits at map center (pin tip is at bottom of icon)
    marginBottom: ms(48),
  },
  pinIconLifted: {
    marginBottom: ms(60),
  },

  // ── Header overlay ────────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hs(16),
    paddingBottom: vs(12),
    gap: hs(10),
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  backBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: fs(11),
    color: '#888',
    marginTop: vs(1),
  },

  // ── Bottom card ───────────────────────────────────────────────────────────────
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: hs(16),
    paddingTop: vs(16),
    gap: vs(14),
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: hs(12),
  },
  addressDot: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    marginTop: vs(4),
    flexShrink: 0,
  },
  addressDotPickup: { backgroundColor: '#22C55E' },
  addressDotDrop: { backgroundColor: '#EF4444' },
  addressFieldLabel: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: vs(2),
  },
  resolveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(8),
  },
  resolvingText: { fontSize: fs(13), color: '#888' },
  addressText: {
    fontSize: fs(14),
    color: '#111',
    fontWeight: '500',
    lineHeight: fs(20),
  },
  addressPlaceholder: {
    fontSize: fs(13),
    color: '#aaa',
  },

  // ── Confirm button ────────────────────────────────────────────────────────────
  confirmBtn: {
    backgroundColor: '#2563EB',
    borderRadius: ms(14),
    paddingVertical: vs(15),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: hs(8),
  },
  confirmBtnDisabled: { backgroundColor: '#E5E7EB' },
  confirmBtnText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  confirmBtnTextDisabled: { color: '#9CA3AF' },
});

export default MapLocationPicker;
