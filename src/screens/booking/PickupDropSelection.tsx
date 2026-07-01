import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Animated,
  Image,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Modal,
} from 'react-native';
import { showAlert } from '../../components/CustomAlert';
import Reanimated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing as REasing,
} from 'react-native-reanimated';

// Shared, calm easing for all entrance transitions (no spring/bounce).
const ENTER_EASE = REasing.bezier(0.22, 1, 0.36, 1);
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleMapsApi as mapboxApi } from '../../api/googleMaps';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocationStore } from '../../store/useLocationStore';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../../utils/metrics';

// ─── Parse lat/lon from a shared maps link or plain "lat,lon" text ────────────
function extractCoordsFromText(text: string): { lat: number; lon: number } | null {
  const patterns = [
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,                    // Google Maps /@lat,lon,zoom
    /[?&]q=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,               // ?q=lat,lon
    /[?&]ll=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,              // ll=lat,lon
    /[?&]center=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,          // center=lat,lon
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,                // Google Maps embed !3d!4d
    /^(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)$/,                // plain lat,lon
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lon = parseFloat(m[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) return { lat, lon };
    }
  }
  return null;
}

async function resolveSharedLink(input: string): Promise<{ lat: number; lon: number } | null> {
  const text = input.trim();

  // Try direct extraction first
  const direct = extractCoordsFromText(text);
  if (direct) return direct;

  // If it looks like a URL, follow redirects (short links like maps.app.goo.gl)
  if (/^https?:\/\//i.test(text)) {
    try {
      const response = await fetch(text, { method: 'GET', redirect: 'follow' } as RequestInit);
      const finalUrl = response.url || text;
      const fromFinal = extractCoordsFromText(finalUrl);
      if (fromFinal) return fromFinal;
      // Also try parsing the response body for embedded coords
      const body = await response.text();
      const fromBody = extractCoordsFromText(body.slice(0, 2000));
      if (fromBody) return fromBody;
    } catch { /* network failure — fall through */ }
  }

  return null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PICKUP_CACHE_KEY = 'pickup_location_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LOCATION_CHANGE_THRESHOLD_M = 200;

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F7F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F5',
  primary: '#2563EB',
  accent: '#3B82F6',
  accentLight: '#EFF6FF',
  green: '#22C55E',
  greenDark: '#16A34A',
  red: '#EF4444',
  redDark: '#DC2626',
  text: '#111111',
  textSub: '#555555',
  textMuted: '#999999',
  border: '#E8E8E8',
  borderMed: '#DEDEDE',
  separator: '#F0F0F0',
  pill: '#F0F0F0',
  pillText: '#333333',
  heart: '#CCCCCC',
  shadow: '#000000',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Location = {
  id: string;
  name: string;
  address: string;
  center?: [number, number];
  metadata?: { place_id?: string; feature_type?: string };
};
type LocationType = 'Home' | 'Shop' | 'Office' | 'Other';

const LOCATION_TYPES: LocationType[] = ['Home', 'Shop', 'Office', 'Other'];

// ─── Sub-components ───────────────────────────────────────────────────────────

// Pulsing ring behind the active route dot — gives the pickup/drop indicator life.
const PulsingDot = ({ color, active }: { color: string; active: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      // Slow, soft halo — subtle "live" cue, not an attention-grabbing flash.
      scale.value = withRepeat(
        withSequence(
          withTiming(1.9, { duration: 1500, easing: REasing.out(REasing.quad) }),
          withTiming(1, { duration: 0 }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.18, { duration: 0 }),
          withTiming(0, { duration: 1500, easing: REasing.out(REasing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [active]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: color,
        },
        ringStyle,
      ]}
    />
  );
};

const SectionLabel = ({
  label, icon, iconColor = C.accent,
}: { label: string; icon: string; iconColor?: string }) => (
  <View style={sub.sectionLabel}>
    <View style={[sub.sectionIconBox, { backgroundColor: iconColor + '18' }]}>
      <MaterialIcons name={icon} size={ms(14)} color={iconColor} />
    </View>
    <Text style={sub.sectionLabelText}>{label}</Text>
  </View>
);

const FieldInput = ({
  icon, placeholder, value, onChangeText, keyboardType, maxLength, rightNode, onFocus: onFocusProp, error,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  maxLength?: number;
  rightNode?: React.ReactNode;
  onFocus?: () => void;
  error?: string;
}) => {
  const [focused, setFocused] = useState(false);
  // IMPORTANT: keep this tree structure STABLE whether or not `error` is set.
  // Previously the component returned the field <View> directly when there was
  // no error and a wrapped <View> when there was — toggling that moved the
  // TextInput into a new parent, remounting it and stealing focus (the cursor
  // jumped to another field). Always render the wrapper; only the error Text
  // appears/disappears as a sibling, so the TextInput is never remounted.
  return (
    <View>
      <View style={[sub.fieldWrap, focused && sub.fieldWrapFocused, !!error && sub.fieldWrapError]}>
        <MaterialIcons name={icon} size={ms(17)} color={error ? C.red : focused ? C.accent : C.textMuted} style={sub.fieldIcon} />
        <TextInput
          style={sub.fieldInput}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={() => { setFocused(true); onFocusProp?.(); }}
          onBlur={() => setFocused(false)}
        />
        {rightNode}
      </View>
      {!!error && <Text style={sub.fieldErrorText}>{error}</Text>}
    </View>
  );
};

const sub = StyleSheet.create({
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(8),
    marginBottom: vs(12),
    marginTop: vs(2),
  },
  sectionIconBox: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabelText: {
    fontSize: fs(13),
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.2,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: hs(12),
    marginBottom: vs(8),
  },
  fieldWrapFocused: {
    borderColor: C.accent,
    backgroundColor: C.accentLight,
  },
  fieldWrapError: {
    borderColor: C.red,
    marginBottom: vs(4),
  },
  fieldErrorText: {
    color: C.red,
    fontSize: fs(11),
    marginBottom: vs(8),
    marginLeft: hs(4),
  },
  fieldIcon: { marginRight: hs(8) },
  fieldInput: {
    flex: 1,
    fontSize: fs(13),
    color: C.text,
    paddingVertical: vs(10),
    fontWeight: '400',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const PickupDropSelection = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const locationStore = useLocationStore();
  const insets = useSafeAreaInsets();
  const serviceCategory = route.params?.serviceCategory || 'send_packages';

  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop'>('pickup');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderMobile, setSenderMobile] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<LocationType | ''>('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [autoFillingPickup, setAutoFillingPickup] = useState(false);
  const [locationChanged, setLocationChanged] = useState(false);

  // Import-from-link modal
  const [importModal, setImportModal] = useState<{ visible: boolean; field: 'pickup' | 'drop' }>({
    visible: false, field: 'pickup',
  });
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  const sessionTokenRef = useRef(`session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

  // Receive result from MapLocationPicker
  const lastPickedKey = useRef<string>('');
  useEffect(() => {
    const picked = route.params?.pickedLocation as
      | { field: 'pickup' | 'drop'; address: string; lat: number; lon: number }
      | undefined;
    if (!picked) return;
    const key = `${picked.field}|${picked.lat}|${picked.lon}`;
    if (key === lastPickedKey.current) return;
    lastPickedKey.current = key;
    const coords = { latitude: picked.lat, longitude: picked.lon };
    if (picked.field === 'pickup') {
      setPickup(picked.address);
      setPickupCoords(coords);
      setActiveInput('drop');
      savePickupCache(picked.address, coords);
    } else {
      setDrop(picked.address);
      setDropCoords(coords);
      setActiveInput('' as 'pickup' | 'drop');
    }
    setFilteredLocations([]);
  }, [route.params?.pickedLocation]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PICKUP_CACHE_KEY);
        if (!raw) { detectCurrentLocation(); return; }
        const cached = JSON.parse(raw) as {
          address: string;
          coords: { latitude: number; longitude: number };
          cachedAt: number;
        };
        if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
          setPickup(cached.address);
          setPickupCoords(cached.coords);
          setActiveInput('drop');
        } else {
          detectCurrentLocation();
        }
      } catch { detectCurrentLocation(); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pickupCoords) {
      setLocationChanged(false);
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    const id = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const dist = haversineDistance(latitude, longitude, pickupCoords.latitude, pickupCoords.longitude);
        setLocationChanged(dist > LOCATION_CHANGE_THRESHOLD_M);
      },
      () => { },
      { enableHighAccuracy: false, maximumAge: 30000, distanceFilter: 50 } as any,
    );
    watchIdRef.current = id;
    return () => { Geolocation.clearWatch(id); watchIdRef.current = null; };
  }, [pickupCoords]);

  const savePickupCache = async (address: string, coords: { latitude: number; longitude: number }) => {
    try {
      await AsyncStorage.setItem(PICKUP_CACHE_KEY, JSON.stringify({ address, coords, cachedAt: Date.now() }));
    } catch { }
  };

  const detectCurrentLocation = async () => {
    setAutoFillingPickup(true);
    try {
      // Use cached location if fresh (avoids GPS round-trip)
      const { address: cachedAddr, latitude: cachedLat, longitude: cachedLon, isStale } = locationStore;
      if (cachedAddr && cachedLat && cachedLon && !isStale()) {
        setPickup(cachedAddr);
        setPickupCoords({ latitude: cachedLat, longitude: cachedLon });
        setActiveInput('drop');
        setLocationChanged(false);
        await savePickupCache(cachedAddr, { latitude: cachedLat, longitude: cachedLon });
        return;
      }

      // Cache miss or stale — fetch fresh from GPS
      await locationStore.fetch(true);
      const { address, latitude, longitude } = useLocationStore.getState();
      if (address && latitude && longitude) {
        setPickup(address);
        setPickupCoords({ latitude, longitude });
        setActiveInput('drop');
        setLocationChanged(false);
        await savePickupCache(address, { latitude, longitude });
      }
    } catch (err) {
      console.log('GPS pickup error:', err);
    } finally {
      setAutoFillingPickup(false);
    }
  };

  useEffect(() => {
    if (user?.name && !senderName.trim()) setSenderName(user.name);
    if (user?.phone && !senderMobile.trim()) setSenderMobile(user.phone.replace(/\D/g, '').slice(-10));
  }, [user, senderName, senderMobile]);

  const handleLocationSelect = async (location: Location) => {
    try {
      if (!location.metadata?.place_id) {
        showAlert('Error', 'Invalid location data. Please try selecting again.');
        return;
      }
      const fullLocationData = await mapboxApi.retrievePlace(location.metadata.place_id!, sessionTokenRef.current);
      if (!fullLocationData || !fullLocationData.center) {
        showAlert('Error', 'Could not get location coordinates. Please try again.');
        return;
      }
      const fullAddress = fullLocationData.name + ', ' + fullLocationData.address;
      const coordinates = { latitude: fullLocationData.center[1], longitude: fullLocationData.center[0] };
      if (activeInput === 'pickup') { setPickup(fullAddress); setPickupCoords(coordinates); }
      else { setDrop(fullAddress); setDropCoords(coordinates); }
      setFilteredLocations([]);
      setActiveInput('' as 'pickup' | 'drop');
      sessionTokenRef.current = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    } catch {
      showAlert('Error', 'Failed to select location. Please try again.');
    }
  };

  const handleSearchLocation = async (text: string) => {
    if (activeInput === 'pickup') setPickup(text);
    else setDrop(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.trim().length < 2) { setFilteredLocations([]); setIsSearching(false); return; }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await mapboxApi.searchPlaces(text, undefined, sessionTokenRef.current);
        setFilteredLocations(results);
      } catch { setFilteredLocations([]); }
      finally { setIsSearching(false); }
    }, 600);
  };

  const validateMobileNumber = (n: string) => n.replace(/\D/g, '').length === 10;

  const openImport = (field: 'pickup' | 'drop') => {
    setImportText('');
    setImportModal({ visible: true, field });
  };

  const handleImportSubmit = async () => {
    const text = importText.trim();
    if (!text) return;
    setImportLoading(true);
    try {
      const coords = await resolveSharedLink(text);
      if (!coords) {
        showAlert('Could not read location', 'Make sure you pasted a valid Google Maps link or coordinates like "20.2961, 85.8245".');
        return;
      }
      const address = await mapboxApi.reverseGeocode(coords.lat, coords.lon);
      if (!address) {
        showAlert('Error', 'Could not resolve address for those coordinates.');
        return;
      }
      const coordsObj = { latitude: coords.lat, longitude: coords.lon };
      if (importModal.field === 'pickup') {
        setPickup(address);
        setPickupCoords(coordsObj);
        setActiveInput('drop');
        savePickupCache(address, coordsObj);
      } else {
        setDrop(address);
        setDropCoords(coordsObj);
        setActiveInput('' as 'pickup' | 'drop');
      }
      setFilteredLocations([]);
      setImportModal({ visible: false, field: 'pickup' });
    } finally {
      setImportLoading(false);
    }
  };

  const navigateToBook = () => {
    if (!senderName.trim()) { showAlert('Missing Information', 'Please enter sender name'); return; }
    if (!validateMobileNumber(senderMobile)) { showAlert('Invalid Mobile Number', 'Please enter a valid 10-digit sender mobile number'); return; }
    if (!receiverName.trim()) { showAlert('Missing Information', 'Please enter receiver name'); return; }
    if (!validateMobileNumber(receiverMobile)) { showAlert('Invalid Mobile Number', 'Please enter a valid 10-digit receiver mobile number'); return; }
    // Same-number is surfaced inline under the field + disables Continue, so just guard here.
    if (senderMobile.replace(/\D/g, '') === receiverMobile.replace(/\D/g, '')) return;
    if (!selectedLocationType) { showAlert('Missing Information', 'Please select location type'); return; }
    if (selectedLocationType === 'Other' && !customLocationName.trim()) { showAlert('Missing Information', 'Please enter custom location name'); return; }
    if (!pickupCoords) { showAlert('Invalid Pickup Location', 'Please select pickup location from the suggestions'); return; }
    if (!dropCoords) { showAlert('Invalid Drop Location', 'Please select drop location from the suggestions'); return; }
    if (pickup && drop) {
      navigation.navigate('VehicleSelection', {
        pickup, drop, pickupCoords, dropCoords,
        currentLocationCoords: null,
        senderName, senderMobile,
        receiverName, receiverMobile,
        serviceCategory,
        locationType: selectedLocationType === 'Other' ? customLocationName : selectedLocationType,
      });
    }
  };

  // Inline validation: receiver number must differ from sender's. Shown once the
  // receiver number is fully typed (10 digits), under the receiver mobile field.
  const receiverSameAsSender =
    receiverMobile.replace(/\D/g, '').length === 10 &&
    receiverMobile.replace(/\D/g, '') === senderMobile.replace(/\D/g, '');

  const canProceed =
    pickup.trim() !== '' && drop.trim() !== '' &&
    senderName.trim() !== '' && validateMobileNumber(senderMobile) &&
    receiverName.trim() !== '' && validateMobileNumber(receiverMobile) &&
    !receiverSameAsSender &&
    selectedLocationType !== '' &&
    (selectedLocationType !== 'Other' || customLocationName.trim() !== '');

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'Home': return 'home';
      case 'Shop': return 'store';
      case 'Office': return 'business';
      default: return 'location-on';
    }
  };

  // ── Suggestion List ───────────────────────────────────────────────────────
  const SuggestionList = ({ query }: { query: string }) => (
    <View style={styles.suggestionBox}>
      {isSearching && filteredLocations.length === 0 && (
        <View style={styles.suggestionLoading}>
          <ActivityIndicator size="small" color={C.accent} />
          <Text style={styles.suggestionLoadingText}>Searching…</Text>
        </View>
      )}

      {!isSearching && filteredLocations.length > 0 &&
        filteredLocations.map((item, idx) => (
          <Reanimated.View
            key={item.id}
            entering={FadeIn.delay(idx * 35).duration(220)}
          >
            <TouchableOpacity
              style={[
                styles.suggestionRow,
                idx < filteredLocations.length - 1 && styles.suggestionRowBorder,
              ]}
              onPress={() => handleLocationSelect(item)}
              activeOpacity={0.65}
            >
              <View style={styles.suggestionPinIcon}>
                <MaterialIcons name="location-on" size={ms(18)} color={C.accent} />
              </View>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address}</Text>
              </View>
              <MaterialIcons name="north-east" size={ms(18)} color={C.textMuted} />
            </TouchableOpacity>
          </Reanimated.View>
        ))
      }

      {!isSearching && filteredLocations.length === 0 && query.trim().length > 2 && (
        <Reanimated.View entering={FadeIn.duration(220)} style={styles.suggestionEmpty}>
          <MaterialIcons name="search-off" size={ms(32)} color={C.textMuted} />
          <Text style={styles.suggestionEmptyText}>No results for "{query}"</Text>
          <Text style={styles.suggestionEmptySub}>Try a different search term</Text>
        </Reanimated.View>
      )}
    </View>
  );

  // ─── Main Drop/Pickup Screen ──────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/*
        KEY FIX: Use a plain View with paddingTop = insets.top instead of
        SafeAreaView directly wrapping the header. This gives us full control
        over exactly how far below the status bar the header sits on every
        Android/iOS device, including notched & Dynamic Island phones.
      */}
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} translucent />

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={styles.backBtnRound}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.6}
          >
            <MaterialIcons name="arrow-back" size={ms(20)} color={C.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitleLarge}>Select Location</Text>

          <Reanimated.View entering={FadeIn.delay(120).duration(300)} style={styles.headerBadge}>
            <MaterialIcons name="place" size={ms(18)} color={C.primary} />
          </Reanimated.View>
        </View>

        {/* ── Scrollable body ── */}
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formScroll}
          >
            {/* ── Route card ── */}
            <Reanimated.View entering={FadeInDown.delay(40).duration(420).easing(ENTER_EASE)} style={styles.routeCard}>
              {/* Pickup row */}
              <View style={[styles.routeRow, activeInput === 'pickup' && styles.routeRowActive]}>
                <View style={styles.routeIconCol}>
                  <View style={styles.dotWrap}>
                    <PulsingDot color={C.green} active={activeInput === 'pickup'} />
                    <View style={styles.dotPickup} />
                  </View>
                  <View style={styles.routeConnector} />
                </View>
                {pickupCoords && activeInput !== 'pickup' ? (
                  <Text
                    style={[styles.routeTextInput, styles.routeTextDisplay]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    onPress={() => { setPickupCoords(null); setActiveInput('pickup'); }}
                  >
                    {pickup}
                  </Text>
                ) : (
                  <TextInput
                    style={styles.routeTextInput}
                    placeholder={autoFillingPickup ? 'Detecting your location…' : 'Pickup location'}
                    placeholderTextColor={C.textMuted}
                    value={pickup}
                    onChangeText={text => {
                      if (pickupCoords) setPickupCoords(null);
                      handleSearchLocation(text);
                    }}
                    onFocus={() => setActiveInput('pickup')}
                  />
                )}
                {autoFillingPickup ? (
                  <ActivityIndicator size="small" color={C.accent} style={styles.locateLoader} />
                ) : (!pickup || locationChanged) ? (
                  <TouchableOpacity
                    onPress={detectCurrentLocation}
                    style={styles.locateBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons
                      name="my-location"
                      size={ms(18)}
                      color={locationChanged ? C.red : C.accent}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Divider */}
              <View style={styles.routeDivider} />

              {/* Drop row */}
              <View style={[styles.routeRow, activeInput === 'drop' && styles.routeRowActive]}>
                <View style={styles.routeIconCol}>
                  <View style={styles.dotWrap}>
                    <PulsingDot color={C.red} active={activeInput === 'drop'} />
                    <View style={styles.dotDrop} />
                  </View>
                </View>
                {dropCoords && activeInput !== 'drop' ? (
                  <Text
                    style={[styles.routeTextInput, styles.routeTextDisplay]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    onPress={() => { setDropCoords(null); setActiveInput('drop'); }}
                  >
                    {drop}
                  </Text>
                ) : (
                  <TextInput
                    style={styles.routeTextInput}
                    placeholder="Drop location"
                    placeholderTextColor={C.textMuted}
                    value={drop}
                    onChangeText={text => {
                      if (dropCoords) setDropCoords(null);
                      handleSearchLocation(text);
                    }}
                    onFocus={() => setActiveInput('drop')}
                  />
                )}
              </View>
            </Reanimated.View>

            {/* ── Location action buttons ── */}
            <Reanimated.View entering={FadeInDown.delay(100).duration(420).easing(ENTER_EASE)} style={styles.mapStopsRow}>
              <TouchableOpacity
                style={styles.mapStopsBtn}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('MapLocationPicker', {
                    field: activeInput === 'drop' ? 'drop' : 'pickup',
                    initialLat: (activeInput === 'drop' ? dropCoords?.latitude : pickupCoords?.latitude) ?? undefined,
                    initialLon: (activeInput === 'drop' ? dropCoords?.longitude : pickupCoords?.longitude) ?? undefined,
                  })
                }
              >
                <MaterialIcons name="map" size={ms(16)} color={C.accent} />
                <Text style={styles.mapStopsBtnText}>Choose from Map</Text>
              </TouchableOpacity>

              <View style={styles.mapStopsDivider} />

              <TouchableOpacity
                style={styles.mapStopsBtn}
                activeOpacity={0.7}
                onPress={() => openImport(activeInput === 'drop' ? 'drop' : 'pickup')}
              >
                <MaterialIcons name="link" size={ms(16)} color={C.accent} />
                <Text style={styles.mapStopsBtnText}>Import Shared Link</Text>
              </TouchableOpacity>
            </Reanimated.View>

            {/* Suggestion lists */}
            {activeInput === 'pickup' && pickup.trim().length > 1 && !pickupCoords && (
              <View style={styles.suggestionContainer}>
                <SuggestionList query={pickup} />
              </View>
            )}
            {activeInput === 'drop' && drop.trim().length > 1 && !dropCoords && (
              <View style={styles.suggestionContainer}>
                <SuggestionList query={drop} />
              </View>
            )}

            {/* ── Sender Details ── */}
            <Reanimated.View entering={FadeInDown.delay(160).duration(420).easing(ENTER_EASE)} style={styles.card}>
              <SectionLabel label="Sender Details" icon="upload" iconColor={C.green} />
              <FieldInput
                icon="person"
                placeholder="Sender name *"
                value={senderName}
                onChangeText={setSenderName}
              />
              <FieldInput
                icon="phone"
                placeholder="Sender mobile *"
                value={senderMobile}
                onChangeText={text => setSenderMobile(text.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.chipGroupLabel}>Save Location As *</Text>
              <View style={styles.chipRow}>
                {LOCATION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, selectedLocationType === type && styles.chipActive]}
                    onPress={() => setSelectedLocationType(type)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={getLocationIcon(type)}
                      size={ms(13)}
                      color={selectedLocationType === type ? '#FFFFFF' : C.textSub}
                    />
                    <Text style={[styles.chipText, selectedLocationType === type && styles.chipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedLocationType === 'Other' && (
                <FieldInput
                  icon="edit"
                  placeholder="Custom location name *"
                  value={customLocationName}
                  onChangeText={setCustomLocationName}
                />
              )}
            </Reanimated.View>

            {/* ── Receiver Details ── */}
            <Reanimated.View entering={FadeInDown.delay(220).duration(420).easing(ENTER_EASE)} style={[styles.card, { marginBottom: vs(12) }]}>
              <SectionLabel label="Receiver Details" icon="download" iconColor={C.red} />
              <FieldInput
                icon="person-outline"
                placeholder="Receiver name *"
                value={receiverName}
                onChangeText={setReceiverName}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)}
              />
              <FieldInput
                icon="phone"
                placeholder="Receiver mobile *"
                value={receiverMobile}
                onChangeText={text => setReceiverMobile(text.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
                error={receiverSameAsSender ? 'Sender and receiver number cannot be the same' : undefined}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)}
              />
            </Reanimated.View>
          </ScrollView>
        </Animated.View>

        {/* ── Import shared link modal ── */}
        <Modal
          visible={importModal.visible}
          transparent
          animationType="slide"
          onRequestClose={() => setImportModal(p => ({ ...p, visible: false }))}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => !importLoading && setImportModal(p => ({ ...p, visible: false }))}
          />
          <View style={[styles.importSheet, { paddingBottom: Math.max(insets.bottom, vs(20)) }]}>
            <View style={styles.importSheetHandle} />
            <Text style={styles.importTitle}>
              Import {importModal.field === 'pickup' ? 'Pickup' : 'Drop'} Location
            </Text>
            <Text style={styles.importSub}>
              Paste a Google Maps share link or coordinates (e.g. 20.2961, 85.8245)
            </Text>
            <View style={[styles.importInputWrap, importText.trim().length > 0 && styles.importInputActive]}>
              <MaterialIcons name="link" size={ms(18)} color={importText ? C.accent : C.textMuted} style={{ marginRight: hs(8) }} />
              <TextInput
                style={styles.importInput}
                placeholder="Paste link or coordinates…"
                placeholderTextColor={C.textMuted}
                value={importText}
                onChangeText={setImportText}
                autoCapitalize="none"
                autoCorrect={false}
                multiline={false}
                returnKeyType="done"
                onSubmitEditing={handleImportSubmit}
                editable={!importLoading}
              />
              {importText.length > 0 && (
                <TouchableOpacity onPress={() => setImportText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="close" size={ms(16)} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.importHint}>
              Supports: Google Maps links, maps.app.goo.gl, or plain lat,lon
            </Text>

            <View style={styles.importActions}>
              <TouchableOpacity
                style={styles.importCancelBtn}
                onPress={() => setImportModal(p => ({ ...p, visible: false }))}
                disabled={importLoading}
              >
                <Text style={styles.importCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importConfirmBtn, (!importText.trim() || importLoading) && styles.importConfirmBtnDisabled]}
                onPress={handleImportSubmit}
                disabled={!importText.trim() || importLoading}
                activeOpacity={0.85}
              >
                {importLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="my-location" size={ms(16)} color="#fff" />
                )}
                <Text style={[styles.importConfirmText, (!importText.trim() || importLoading) && styles.importConfirmTextDisabled]}>
                  {importLoading ? 'Resolving…' : 'Use Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Footer — sits above the home indicator using insets.bottom ── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, vs(16)) }]}>
          <TouchableOpacity
            style={[styles.continueBtn, !canProceed && styles.continueBtnDisabled]}
            onPress={navigateToBook}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={[styles.continueBtnText, !canProceed && styles.continueBtnTextDisabled]}>
              Continue
            </Text>
            <Image
              source={require('../../assets/images/arrow.png')}
              style={[styles.arrowIcon, !canProceed && styles.arrowDisabled]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Style constants ──────────────────────────────────────────────────────────
const GUTTER = hs(16);
const DOT_SIZE = ms(11);
const ARROW_SIZE = ms(20);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.surface, // white behind status bar
  },

  // ── Header ────────────────────────────────────────────────────────────────
  // paddingTop intentionally left at 0 — the parent View's paddingTop=insets.top
  // already places us exactly below the status bar on every device.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingTop: vs(14),   // comfortable breathing room below status bar
    paddingBottom: vs(14),
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: hs(10),
  },

  backBtnRound: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: C.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    flexShrink: 0,
  },

  headerTitleLarge: {
    flex: 1,
    fontSize: fs(22),
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  headerBadge: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: C.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },


  // ── Form scroll ──────────────────────────────────────────────────────────
  formScroll: {
    paddingHorizontal: GUTTER,
    paddingTop: vs(14),
    paddingBottom: vs(16),
    gap: vs(10),
    backgroundColor: C.bg,
  },

  // ── Route card ───────────────────────────────────────────────────────────
  routeCard: {
    backgroundColor: C.surface,
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    minHeight: vs(62),
    backgroundColor: C.surface,
  },
  routeRowActive: {
    backgroundColor: C.surface,
  },
  routeIconCol: {
    width: ms(24),
    alignItems: 'center',
    marginRight: hs(12),
    flexShrink: 0,
  },
  dotWrap: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPickup: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: '#DCFCE7',
  },
  dotDrop: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: C.red,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  routeConnector: {
    width: 2,
    height: vs(20),
    backgroundColor: C.border,
    marginTop: vs(3),
    borderRadius: 1,
  },
  routeDivider: {
    height: 1,
    backgroundColor: C.separator,
    marginLeft: hs(50),
  },
  routeTextInput: {
    flex: 1,
    fontSize: fs(13),
    color: '#111111',
    paddingVertical: vs(10),
    paddingHorizontal: hs(4),
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  routeTextDisplay: {
    // Text (not TextInput) — guarantees tail truncation when not focused
    lineHeight: vs(20),
  },
  locateLoader: { marginLeft: hs(8) },
  locateBtn: {
    marginLeft: hs(8),
    padding: hs(4),
  },

  // ── Map / Add stops ───────────────────────────────────────────────────────
  mapStopsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  mapStopsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    paddingVertical: vs(12),
  },
  mapStopsBtnText: {
    fontSize: fs(13),
    fontWeight: '600',
    color: C.text,
  },
  mapStopsDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: vs(10),
  },

  // ── Suggestions ───────────────────────────────────────────────────────────
  suggestionContainer: {
    backgroundColor: C.surface,
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  suggestionBox: { paddingVertical: vs(4) },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: hs(16),
    gap: hs(12),
  },
  suggestionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  suggestionHistoryIcon: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: C.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  suggestionPinIcon: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: C.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  suggestionInfo: { flex: 1 },
  suggestionName: {
    fontSize: fs(14),
    fontWeight: '600',
    color: C.text,
    marginBottom: vs(2),
  },
  suggestionAddress: {
    fontSize: fs(12),
    color: C.textMuted,
    lineHeight: fs(16),
  },
  suggestionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(10),
    paddingVertical: vs(16),
    paddingHorizontal: hs(16),
  },
  suggestionLoadingText: { fontSize: fs(13), color: C.textMuted },
  suggestionEmpty: {
    alignItems: 'center',
    paddingVertical: vs(24),
    gap: vs(4),
  },
  suggestionEmptyText: { fontSize: fs(13), color: C.textSub, fontWeight: '500' },
  suggestionEmptySub: { fontSize: fs(12), color: C.textMuted },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: ms(14),
    padding: ms(14),
    borderWidth: 1,
    borderColor: C.border,
    elevation: 2,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipGroupLabel: {
    fontSize: fs(11),
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: vs(8),
    marginTop: vs(2),
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hs(7),
    marginBottom: vs(10),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(4),
    paddingHorizontal: hs(12),
    paddingVertical: vs(7),
    borderRadius: ms(20),
    backgroundColor: C.pill,
    borderWidth: 1,
    borderColor: C.borderMed,
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: {
    fontSize: fs(12),
    fontWeight: '600',
    color: C.pillText,
  },
  chipTextActive: { color: '#FFFFFF' },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: vs(12),
    // paddingBottom is set inline using insets.bottom for home indicator clearance
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    elevation: 8,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: ms(14),
    paddingVertical: vs(15),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: hs(8),
  },
  continueBtnDisabled: { backgroundColor: C.border },
  continueBtnText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  continueBtnTextDisabled: { color: C.textMuted },
  arrowIcon: { width: ARROW_SIZE, height: ARROW_SIZE, tintColor: '#FFFFFF' },
  arrowDisabled: { tintColor: C.textMuted },

  // ── Import modal ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  importSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: hs(20),
    paddingTop: vs(12),
    gap: vs(12),
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  importSheetHandle: {
    width: ms(36),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: C.borderMed,
    alignSelf: 'center',
    marginBottom: vs(4),
  },
  importTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.2,
  },
  importSub: {
    fontSize: fs(12),
    color: C.textMuted,
    lineHeight: fs(18),
    marginTop: vs(-4),
  },
  importInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: hs(12),
    paddingVertical: vs(2),
  },
  importInputActive: {
    borderColor: C.accent,
    backgroundColor: C.accentLight,
  },
  importInput: {
    flex: 1,
    fontSize: fs(13),
    color: C.text,
    paddingVertical: vs(10),
  },
  importHint: {
    fontSize: fs(11),
    color: C.textMuted,
    marginTop: vs(-4),
  },
  importActions: {
    flexDirection: 'row',
    gap: hs(10),
    marginTop: vs(4),
  },
  importCancelBtn: {
    flex: 1,
    borderRadius: ms(12),
    paddingVertical: vs(13),
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importCancelText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: C.textSub,
  },
  importConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    borderRadius: ms(12),
    paddingVertical: vs(13),
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
  },
  importConfirmBtnDisabled: { backgroundColor: C.border },
  importConfirmText: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#fff',
  },
  importConfirmTextDisabled: { color: C.textMuted },
});

export default PickupDropSelection;