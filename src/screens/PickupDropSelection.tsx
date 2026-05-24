import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Image,
  Dimensions,
  PixelRatio,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleMapsApi as mapboxApi } from '../api/googleMaps';
import { useAuthStore } from '../store/useAuthStore';

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
      const response = await fetch(text, { method: 'GET', redirect: 'follow' });
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

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms = (size: number, factor = 0.45) => size + (scaleW(size) - size) * factor;
const fs = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));

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
type CityName = string;
type LocationType = 'Home' | 'Shop' | 'Office' | 'Other';

const CITIES: CityName[] = [
  'Bhubaneswar', 'Cuttack', 'Puri', 'Berhampur',
  'Sambalpur', 'Rourkela', 'Balasore', 'Baripada',
  'Bhadrak', 'Jharsuguda',
];
const LOCATION_TYPES: LocationType[] = ['Home', 'Shop', 'Office', 'Other'];

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  icon, placeholder, value, onChangeText, keyboardType, maxLength, rightNode, onFocus: onFocusProp,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  maxLength?: number;
  rightNode?: React.ReactNode;
  onFocus?: () => void;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[sub.fieldWrap, focused && sub.fieldWrapFocused]}>
      <MaterialIcons name={icon} size={ms(17)} color={focused ? C.accent : C.textMuted} style={sub.fieldIcon} />
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
  );
};

const sub = StyleSheet.create({
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(8),
    marginBottom: scaleH(12),
    marginTop: scaleH(2),
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
    paddingHorizontal: scaleW(12),
    marginBottom: scaleH(8),
  },
  fieldWrapFocused: {
    borderColor: C.accent,
    backgroundColor: C.accentLight,
  },
  fieldIcon: { marginRight: scaleW(8) },
  fieldInput: {
    flex: 1,
    fontSize: fs(13),
    color: C.text,
    paddingVertical: scaleH(10),
    fontWeight: '400',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const PickupDropSelection = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const serviceCategory = route.params?.serviceCategory || 'send_packages';

  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop'>('pickup');
  const [selectedCity, setSelectedCity] = useState<CityName | ''>('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [filteredCities, setFilteredCities] = useState<CityName[]>(CITIES);
  const [showCitySelection, setShowCitySelection] = useState(true);
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

  useEffect(() => { setFilteredLocations([]); }, [selectedCity]);
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
        if (!raw) return;
        const cached = JSON.parse(raw) as {
          address: string;
          coords: { latitude: number; longitude: number };
          cachedAt: number;
        };
        if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
          setPickup(cached.address);
          setPickupCoords(cached.coords);
          setActiveInput('drop');
        }
      } catch { }
    })();
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

  const detectCurrentLocation = () => {
    setAutoFillingPickup(true);
    Geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          const address = await mapboxApi.reverseGeocode(latitude, longitude);
          if (address) {
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
      },
      error => { console.log('GPS error:', error); setAutoFillingPickup(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    if (!selectedCity) return;
    if (pickup) return;
    detectCurrentLocation();
  }, [selectedCity]);

  useEffect(() => {
    if (user?.name && !senderName.trim()) setSenderName(user.name);
    if (user?.phone && !senderMobile.trim()) setSenderMobile(user.phone.replace(/\D/g, '').slice(-10));
  }, [user, senderName, senderMobile]);

  const handleCitySelect = (city: CityName) => {
    setSelectedCity(city);
    setShowCitySelection(false);
  };

  const handleLocationSelect = async (location: Location) => {
    try {
      if (!location.metadata?.place_id) {
        Alert.alert('Error', 'Invalid location data. Please try selecting again.');
        return;
      }
      const fullLocationData = await mapboxApi.retrievePlace(location.metadata.place_id!, sessionTokenRef.current);
      if (!fullLocationData || !fullLocationData.center) {
        Alert.alert('Error', 'Could not get location coordinates. Please try again.');
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
      Alert.alert('Error', 'Failed to select location. Please try again.');
    }
  };

  const handleSearchCity = (text: string) => {
    setFilteredCities(
      text.trim() === '' ? CITIES : CITIES.filter(c => c.toLowerCase().includes(text.toLowerCase())),
    );
  };

  const handleSearchLocation = async (text: string) => {
    if (activeInput === 'pickup') setPickup(text);
    else setDrop(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.trim().length < 2) { setFilteredLocations([]); setIsSearching(false); return; }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = selectedCity ? `${text}, ${selectedCity}` : text;
        const results = await mapboxApi.searchPlaces(query, undefined, sessionTokenRef.current);
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
        Alert.alert('Could not read location', 'Make sure you pasted a valid Google Maps link or coordinates like "20.2961, 85.8245".');
        return;
      }
      const address = await mapboxApi.reverseGeocode(coords.lat, coords.lon);
      if (!address) {
        Alert.alert('Error', 'Could not resolve address for those coordinates.');
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
    if (!senderName.trim()) { Alert.alert('Missing Information', 'Please enter sender name'); return; }
    if (!validateMobileNumber(senderMobile)) { Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit sender mobile number'); return; }
    if (!receiverName.trim()) { Alert.alert('Missing Information', 'Please enter receiver name'); return; }
    if (!validateMobileNumber(receiverMobile)) { Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit receiver mobile number'); return; }
    if (!selectedLocationType) { Alert.alert('Missing Information', 'Please select location type'); return; }
    if (selectedLocationType === 'Other' && !customLocationName.trim()) { Alert.alert('Missing Information', 'Please enter custom location name'); return; }
    if (!pickupCoords) { Alert.alert('Invalid Pickup Location', 'Please select pickup location from the suggestions'); return; }
    if (!dropCoords) { Alert.alert('Invalid Drop Location', 'Please select drop location from the suggestions'); return; }
    if (pickup && drop) {
      navigation.navigate('VehicleSelection', {
        pickup, drop, pickupCoords, dropCoords,
        currentLocationCoords: null,
        senderName, senderMobile,
        receiverName, receiverMobile,
        city: selectedCity,
        serviceCategory,
        locationType: selectedLocationType === 'Other' ? customLocationName : selectedLocationType,
      });
    }
  };

  const canProceed =
    pickup.trim() !== '' && drop.trim() !== '' &&
    senderName.trim() !== '' && validateMobileNumber(senderMobile) &&
    receiverName.trim() !== '' && validateMobileNumber(receiverMobile) &&
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
          <TouchableOpacity
            key={item.id}
            style={[
              styles.suggestionRow,
              idx < filteredLocations.length - 1 && styles.suggestionRowBorder,
            ]}
            onPress={() => handleLocationSelect(item)}
            activeOpacity={0.65}
          >
            <View style={styles.suggestionHistoryIcon}>
              <MaterialIcons name="history" size={ms(18)} color={C.textMuted} />
            </View>
            <View style={styles.suggestionInfo}>
              <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address}</Text>
            </View>
            <MaterialIcons name="favorite-border" size={ms(18)} color={C.heart} />
          </TouchableOpacity>
        ))
      }

      {!isSearching && filteredLocations.length === 0 && query.trim().length > 2 && (
        <View style={styles.suggestionEmpty}>
          <MaterialIcons name="search-off" size={ms(32)} color={C.textMuted} />
          <Text style={styles.suggestionEmptyText}>No results for "{query}"</Text>
          <Text style={styles.suggestionEmptySub}>Try a different search term</Text>
        </View>
      )}
    </View>
  );

  // ── City Selection Screen ─────────────────────────────────────────────────
  if (showCitySelection) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} translucent />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={styles.backBtnRound}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.6}
          >
            <MaterialIcons name="arrow-back" size={ms(20)} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitleLarge}>Select City</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.cityScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.cityHeading}>Where are you sending from?</Text>
          <Text style={styles.citySubHeading}>We'll find the best delivery options near you</Text>

          <View style={styles.citySearchBar}>
            <MaterialIcons name="search" size={ms(18)} color={C.textMuted} />
            <TextInput
              style={styles.citySearchInput}
              placeholder="Search city…"
              placeholderTextColor={C.textMuted}
              onChangeText={handleSearchCity}
            />
          </View>

          {filteredCities.map(city => (
            <TouchableOpacity
              key={city}
              style={styles.cityRow}
              onPress={() => handleCitySelect(city)}
              activeOpacity={0.7}
            >
              <View style={styles.cityRowIcon}>
                <MaterialIcons name="location-city" size={ms(18)} color={C.accent} />
              </View>
              <Text style={styles.cityRowName}>{city}</Text>
              <View style={styles.cityRowChevron}>
                <MaterialIcons name="chevron-right" size={ms(18)} color={C.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

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
            <View style={styles.routeCard}>
              {/* Pickup row */}
              <View style={[styles.routeRow, activeInput === 'pickup' && styles.routeRowActive]}>
                <View style={styles.routeIconCol}>
                  <View style={styles.dotPickup} />
                  <View style={styles.routeConnector} />
                </View>
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
                  <View style={styles.dotDrop} />
                </View>
                <TextInput
                  style={styles.routeTextInput}
                  placeholder="Drop location"
                  placeholderTextColor={C.textMuted}
                  value={drop}
                  onChangeText={handleSearchLocation}
                  onFocus={() => setActiveInput('drop')}
                />
              </View>
            </View>

            {/* ── Location action buttons ── */}
            <View style={styles.mapStopsRow}>
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
            </View>

            {/* Suggestion lists */}
            {activeInput === 'pickup' && pickup.trim().length > 1 && (
              <View style={styles.suggestionContainer}>
                <SuggestionList query={pickup} />
              </View>
            )}
            {activeInput === 'drop' && drop.trim().length > 1 && (
              <View style={styles.suggestionContainer}>
                <SuggestionList query={drop} />
              </View>
            )}

            {/* ── Sender Details ── */}
            <View style={styles.card}>
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
            </View>

            {/* ── Receiver Details ── */}
            <View style={[styles.card, { marginBottom: scaleH(12) }]}>
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
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)}
              />
            </View>
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
          <View style={[styles.importSheet, { paddingBottom: Math.max(insets.bottom, scaleH(20)) }]}>
            <View style={styles.importSheetHandle} />
            <Text style={styles.importTitle}>
              Import {importModal.field === 'pickup' ? 'Pickup' : 'Drop'} Location
            </Text>
            <Text style={styles.importSub}>
              Paste a Google Maps share link or coordinates (e.g. 20.2961, 85.8245)
            </Text>
            <View style={[styles.importInputWrap, importText.trim().length > 0 && styles.importInputActive]}>
              <MaterialIcons name="link" size={ms(18)} color={importText ? C.accent : C.textMuted} style={{ marginRight: scaleW(8) }} />
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
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleH(16)) }]}>
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
              source={require('../assets/images/arrow.png')}
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
const GUTTER = scaleW(16);
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
    paddingTop: scaleH(14),   // comfortable breathing room below status bar
    paddingBottom: scaleH(14),
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: scaleW(10),
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


  // ── Form scroll ──────────────────────────────────────────────────────────
  formScroll: {
    paddingHorizontal: GUTTER,
    paddingTop: scaleH(14),
    paddingBottom: scaleH(16),
    gap: scaleH(10),
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
    paddingHorizontal: scaleW(14),
    paddingVertical: scaleH(6),
    minHeight: scaleH(62),
    backgroundColor: C.surface,
  },
  routeRowActive: {
    backgroundColor: '#F0F7FF',   // very faint blue tint when focused
  },
  routeIconCol: {
    width: ms(24),
    alignItems: 'center',
    marginRight: scaleW(12),
    flexShrink: 0,
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
    height: scaleH(20),
    backgroundColor: C.border,
    marginTop: scaleH(3),
    borderRadius: 1,
  },
  routeDivider: {
    height: 1,
    backgroundColor: C.separator,
    marginLeft: scaleW(50),
  },
  routeTextInput: {
    flex: 1,
    fontSize: fs(13),
    color: '#111111',   // explicit dark — never inherits a faded colour
    paddingVertical: scaleH(10),
    paddingHorizontal: scaleW(4),
    fontWeight: '400',
    includeFontPadding: false,      // Android: removes extra gap that clips ascenders
    textAlignVertical: 'center',
  },
  locateLoader: { marginLeft: scaleW(8) },
  locateBtn: {
    marginLeft: scaleW(8),
    padding: scaleW(4),
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
    gap: scaleW(6),
    paddingVertical: scaleH(12),
  },
  mapStopsBtnText: {
    fontSize: fs(13),
    fontWeight: '600',
    color: C.text,
  },
  mapStopsDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: scaleH(10),
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
  suggestionBox: { paddingVertical: scaleH(4) },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleH(14),
    paddingHorizontal: scaleW(16),
    gap: scaleW(12),
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
  suggestionInfo: { flex: 1 },
  suggestionName: {
    fontSize: fs(14),
    fontWeight: '600',
    color: C.text,
    marginBottom: scaleH(2),
  },
  suggestionAddress: {
    fontSize: fs(12),
    color: C.textMuted,
    lineHeight: fs(16),
  },
  suggestionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(10),
    paddingVertical: scaleH(16),
    paddingHorizontal: scaleW(16),
  },
  suggestionLoadingText: { fontSize: fs(13), color: C.textMuted },
  suggestionEmpty: {
    alignItems: 'center',
    paddingVertical: scaleH(24),
    gap: scaleH(4),
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
    marginBottom: scaleH(8),
    marginTop: scaleH(2),
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleW(7),
    marginBottom: scaleH(10),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(4),
    paddingHorizontal: scaleW(12),
    paddingVertical: scaleH(7),
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

  // ── City screen ───────────────────────────────────────────────────────────
  cityScrollContent: {
    paddingHorizontal: GUTTER,
    paddingTop: scaleH(20),
    paddingBottom: scaleH(32),
    backgroundColor: C.bg,
  },
  cityHeading: {
    fontSize: fs(20),
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
    marginBottom: scaleH(4),
  },
  citySubHeading: {
    fontSize: fs(13),
    color: C.textMuted,
    marginBottom: scaleH(18),
    fontWeight: '400',
  },
  citySearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: ms(12),
    paddingHorizontal: scaleW(14),
    marginBottom: scaleH(12),
    borderWidth: 1,
    borderColor: C.border,
    gap: scaleW(8),
    elevation: 1,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  citySearchInput: {
    flex: 1,
    fontSize: fs(14),
    color: C.text,
    paddingVertical: scaleH(12),
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: ms(12),
    paddingVertical: scaleH(13),
    paddingHorizontal: scaleW(14),
    marginBottom: scaleH(8),
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cityRowIcon: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(9),
    backgroundColor: C.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(12),
    flexShrink: 0,
  },
  cityRowName: {
    flex: 1,
    fontSize: fs(14),
    fontWeight: '600',
    color: C.text,
  },
  cityRowChevron: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(7),
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: scaleH(12),
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
    paddingVertical: scaleH(15),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleW(8),
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
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(12),
    gap: scaleH(12),
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
    marginBottom: scaleH(4),
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
    marginTop: scaleH(-4),
  },
  importInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: scaleW(12),
    paddingVertical: scaleH(2),
  },
  importInputActive: {
    borderColor: C.accent,
    backgroundColor: C.accentLight,
  },
  importInput: {
    flex: 1,
    fontSize: fs(13),
    color: C.text,
    paddingVertical: scaleH(10),
  },
  importHint: {
    fontSize: fs(11),
    color: C.textMuted,
    marginTop: scaleH(-4),
  },
  importActions: {
    flexDirection: 'row',
    gap: scaleW(10),
    marginTop: scaleH(4),
  },
  importCancelBtn: {
    flex: 1,
    borderRadius: ms(12),
    paddingVertical: scaleH(13),
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
    paddingVertical: scaleH(13),
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleW(6),
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