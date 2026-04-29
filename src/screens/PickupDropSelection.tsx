import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Image,
  Dimensions,
  PixelRatio,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleMapsApi as mapboxApi } from '../api/googleMaps';
import { useAuthStore } from '../store/useAuthStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const PICKUP_CACHE_KEY          = 'pickup_location_cache';
const CACHE_TTL_MS              = 24 * 60 * 60 * 1000;
const LOCATION_CHANGE_THRESHOLD_M = 200;

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R     = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLon  = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;
const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms     = (size: number, factor = 0.45) => size + (scaleW(size) - size) * factor;
const fs     = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:            '#F0F4FF',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F7F9FF',
  primary:       '#3B82F6',
  primaryDark:   '#1D4ED8',
  primaryLight:  '#EFF6FF',
  primaryMid:    '#DBEAFE',
  green:         '#10B981',
  greenLight:    '#ECFDF5',
  red:           '#EF4444',
  redLight:      '#FEF2F2',
  amber:         '#F59E0B',
  text:          '#0F172A',
  textSub:       '#475569',
  textMuted:     '#94A3B8',
  border:        '#E2E8F0',
  borderFocus:   '#93C5FD',
  shadow:        '#0F172A',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Location = {
  id: string;
  name: string;
  address: string;
  center?: [number, number];
  metadata?: { place_id?: string; feature_type?: string };
};
type CityName    = string;
type LocationType = 'Home' | 'Shop' | 'Office' | 'Other';

const CITIES: CityName[] = [
  'Bhubaneswar', 'Cuttack', 'Puri', 'Berhampur',
  'Sambalpur', 'Rourkela', 'Balasore', 'Baripada',
  'Bhadrak', 'Jharsuguda',
];
const LOCATION_TYPES: LocationType[] = ['Home', 'Shop', 'Office', 'Other'];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Thin horizontal section divider with label */
const SectionLabel = ({ label, icon, iconColor = C.primary }: { label: string; icon: string; iconColor?: string }) => (
  <View style={sub.sectionLabel}>
    <View style={[sub.sectionIconBox, { backgroundColor: iconColor + '18' }]}>
      <MaterialIcons name={icon} size={ms(15)} color={iconColor} />
    </View>
    <Text style={sub.sectionLabelText}>{label}</Text>
  </View>
);

/** Styled text input with left icon */
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
      <MaterialIcons name={icon} size={ms(18)} color={focused ? C.primary : C.textMuted} style={sub.fieldIcon} />
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
    flexDirection:  'row',
    alignItems:     'center',
    gap:            scaleW(8),
    marginBottom:   scaleH(14),
    marginTop:      scaleH(4),
  },
  sectionIconBox: {
    width:          ms(28),
    height:         ms(28),
    borderRadius:   ms(8),
    justifyContent: 'center',
    alignItems:     'center',
  },
  sectionLabelText: {
    fontSize:      fs(14),
    fontWeight:    '700',
    color:         C.text,
    letterSpacing: 0.1,
  },
  fieldWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.surfaceAlt,
    borderRadius:      ms(12),
    borderWidth:       1.5,
    borderColor:       C.border,
    paddingHorizontal: scaleW(14),
    marginBottom:      scaleH(10),
  },
  fieldWrapFocused: {
    borderColor:     C.borderFocus,
    backgroundColor: C.primaryLight,
  },
  fieldIcon:  { marginRight: scaleW(10) },
  fieldInput: {
    flex:            1,
    fontSize:        fs(14),
    color:           C.text,
    paddingVertical: scaleH(13),
    fontWeight:      '500',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const PickupDropSelection = () => {
  const navigation    = useNavigation<any>();
  const route         = useRoute<any>();
  const { user }      = useAuthStore();
  const serviceCategory = route.params?.serviceCategory || 'send_packages';

  const [pickup,               setPickup]               = useState('');
  const [drop,                 setDrop]                 = useState('');
  const [activeInput,          setActiveInput]          = useState<'pickup' | 'drop'>('pickup');
  const [selectedCity,         setSelectedCity]         = useState<CityName | ''>('');
  const [filteredLocations,    setFilteredLocations]    = useState<Location[]>([]);
  const [filteredCities,       setFilteredCities]       = useState<CityName[]>(CITIES);
  const [showCitySelection,    setShowCitySelection]    = useState(true);
  const [isSearching,          setIsSearching]          = useState(false);
  const [senderName,           setSenderName]           = useState('');
  const [senderMobile,         setSenderMobile]         = useState('');
  const [receiverName,         setReceiverName]         = useState('');
  const [receiverMobile,       setReceiverMobile]       = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<LocationType | ''>('');
  const [customLocationName,   setCustomLocationName]   = useState('');
  const [pickupCoords,         setPickupCoords]         = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropCoords,           setDropCoords]           = useState<{ latitude: number; longitude: number } | null>(null);
  const [autoFillingPickup,    setAutoFillingPickup]    = useState(false);
  const [locationChanged,      setLocationChanged]      = useState(false);

  const sessionTokenRef  = useRef(`session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchIdRef       = useRef<number | null>(null);
  const fadeAnim         = useRef(new Animated.Value(1)).current;
  const slideAnim        = useRef(new Animated.Value(0)).current;
  const scrollRef        = useRef<ScrollView>(null);

  useEffect(() => { setFilteredLocations([]); }, [selectedCity]);
  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

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
      } catch {}
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
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000, distanceFilter: 50 },
    );
    watchIdRef.current = id;
    return () => { Geolocation.clearWatch(id); watchIdRef.current = null; };
  }, [pickupCoords]);

  const savePickupCache = async (address: string, coords: { latitude: number; longitude: number }) => {
    try {
      await AsyncStorage.setItem(PICKUP_CACHE_KEY, JSON.stringify({ address, coords, cachedAt: Date.now() }));
    } catch {}
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
      if (activeInput === 'pickup') { setPickup(fullAddress);  setPickupCoords(coordinates); }
      else                          { setDrop(fullAddress);    setDropCoords(coordinates);   }
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
        const query   = selectedCity ? `${text}, ${selectedCity}` : text;
        const results = await mapboxApi.searchPlaces(query, undefined, sessionTokenRef.current);
        setFilteredLocations(results);
      } catch { setFilteredLocations([]); }
      finally   { setIsSearching(false); }
    }, 600);
  };

  const validateMobileNumber = (n: string) => n.replace(/\D/g, '').length === 10;

  const navigateToBook = () => {
    if (!senderName.trim())                                              { Alert.alert('Missing Information', 'Please enter sender name');                                            return; }
    if (!validateMobileNumber(senderMobile))                             { Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit sender mobile number');               return; }
    if (!receiverName.trim())                                            { Alert.alert('Missing Information', 'Please enter receiver name');                                          return; }
    if (!validateMobileNumber(receiverMobile))                           { Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit receiver mobile number');             return; }
    if (!selectedLocationType)                                           { Alert.alert('Missing Information', 'Please select location type');                                         return; }
    if (selectedLocationType === 'Other' && !customLocationName.trim()) { Alert.alert('Missing Information', 'Please enter custom location name');                                   return; }
    if (!pickupCoords)                                                   { Alert.alert('Invalid Pickup Location', 'Please select pickup location from the suggestions');              return; }
    if (!dropCoords)                                                     { Alert.alert('Invalid Drop Location', 'Please select drop location from the suggestions');                  return; }
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
      case 'Home':   return 'home';
      case 'Shop':   return 'store';
      case 'Office': return 'business';
      default:       return 'location-on';
    }
  };

  // ── Suggestion List ───────────────────────────────────────────────────────
  const SuggestionList = ({ query }: { query: string }) => (
    <View style={styles.suggestionBox}>
      <View style={styles.suggestionTitleRow}>
        <Text style={styles.suggestionTitle}>Suggestions</Text>
        {isSearching && <ActivityIndicator size="small" color={C.primary} />}
      </View>

      {isSearching && filteredLocations.length === 0 && (
        <View style={styles.suggestionLoading}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.suggestionLoadingText}>Searching locations…</Text>
        </View>
      )}

      {!isSearching && filteredLocations.length > 0 &&
        filteredLocations.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.suggestionRow, idx === filteredLocations.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => handleLocationSelect(item)}
            activeOpacity={0.7}
          >
            <View style={styles.suggestionIconBox}>
              <MaterialIcons name="place" size={ms(16)} color={C.primary} />
            </View>
            <View style={styles.suggestionInfo}>
              <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address}</Text>
            </View>
            <MaterialIcons name="north-west" size={ms(14)} color={C.textMuted} />
          </TouchableOpacity>
        ))
      }

      {!isSearching && filteredLocations.length === 0 && query.trim().length > 2 && (
        <View style={styles.suggestionEmpty}>
          <MaterialIcons name="search-off" size={ms(36)} color={C.textMuted} />
          <Text style={styles.suggestionEmptyText}>No results for "{query}"</Text>
          <Text style={styles.suggestionEmptySub}>Try a different search term</Text>
        </View>
      )}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
        >
          <MaterialIcons name="arrow-back" size={ms(20)} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Select Location</Text>
          <Text style={styles.headerSub}>Fill details to book your delivery</Text>
        </View>
      </View>

      <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* ══════════════ MAIN FORM ══════════════ */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formScroll}
          >
            {/* ── Route card ── */}
            <View style={styles.card}>
              <SectionLabel label="Pickup & Drop" icon="route" iconColor={C.primary} />

              {/* Pickup row */}
              <View style={[styles.routeInputRow, activeInput === 'pickup' && styles.routeInputRowActive]}>
                <View style={styles.routeDotCol}>
                  <View style={styles.dotPickup} />
                  <View style={styles.routeLine} />
                </View>
                <TextInput
                  style={styles.routeInput}
                  placeholder={autoFillingPickup ? 'Detecting your location…' : 'Pickup location *'}
                  placeholderTextColor={C.textMuted}
                  value={pickup}
                  onChangeText={(text) => {
                    if (pickupCoords) setPickupCoords(null);
                    handleSearchLocation(text);
                  }}
                  onFocus={() => setActiveInput('pickup')}
                />
                {autoFillingPickup ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (!pickup || locationChanged) ? (
                  <TouchableOpacity
                    onPress={detectCurrentLocation}
                    style={styles.locateBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons
                      name="my-location"
                      size={ms(18)}
                      color={locationChanged ? C.red : C.primary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Drop row */}
              <View style={[styles.routeInputRow, styles.routeInputRowDrop, activeInput === 'drop' && styles.routeInputRowActive]}>
                <View style={styles.routeDotCol}>
                  <View style={styles.dotDrop} />
                </View>
                <TextInput
                  style={styles.routeInput}
                  placeholder="Drop location *"
                  placeholderTextColor={C.textMuted}
                  value={drop}
                  onChangeText={handleSearchLocation}
                  onFocus={() => setActiveInput('drop')}
                />
              </View>

              {/* Suggestions */}
              {activeInput === 'pickup' && pickup.trim().length > 1 && (
                <SuggestionList query={pickup} />
              )}
              {activeInput === 'drop' && drop.trim().length > 1 && (
                <SuggestionList query={drop} />
              )}
            </View>

            {/* ── Sender card ── */}
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

              {/* Location type */}
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
                      size={ms(14)}
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

            {/* ── Receiver card ── */}
            <View style={[styles.card, { marginBottom: scaleH(8) }]}>
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

      {/* ── Footer ── */}
        <View style={styles.footer}>
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
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

// ─── Derived sizes ────────────────────────────────────────────────────────────
const BACK_SIZE   = ms(40);
const ARROW_SIZE  = ms(20);
const DOT_SIZE    = ms(10);
const GUTTER      = scaleW(16);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Header ──
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: GUTTER,
    paddingTop:        Platform.OS === 'ios' ? scaleH(6) : scaleH(14),
    paddingBottom:     scaleH(14),
    backgroundColor:   C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap:               scaleW(12),
  },
  backBtn: {
    width:           BACK_SIZE,
    height:          BACK_SIZE,
    borderRadius:    ms(12),
    backgroundColor: C.bg,
    justifyContent:  'center',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     C.border,
    flexShrink:      0,
  },
  headerText:  { flex: 1 },
  headerTitle: {
    fontSize:      fs(18),
    fontWeight:    '800',
    color:         C.text,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize:   fs(11),
    color:      C.textMuted,
    marginTop:  scaleH(1),
    fontWeight: '500',
  },

  body: { flex: 1 },

  // ── City screen ──
  cityScreen: {
    flex:              1,
    paddingHorizontal: GUTTER,
    paddingTop:        scaleH(24),
  },
  screenHeading: {
    fontSize:      fs(22),
    fontWeight:    '800',
    color:         C.text,
    letterSpacing: -0.4,
    marginBottom:  scaleH(4),
  },
  screenSubHeading: {
    fontSize:     fs(13),
    color:        C.textMuted,
    marginBottom: scaleH(20),
    fontWeight:   '500',
  },
  citySearchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.surface,
    borderRadius:      ms(12),
    paddingHorizontal: scaleW(14),
    marginBottom:      scaleH(14),
    borderWidth:       1.5,
    borderColor:       C.border,
    gap:               scaleW(10),
    elevation:         1,
    shadowColor:       C.shadow,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.04,
    shadowRadius:      4,
  },
  citySearchInput: {
    flex:            1,
    fontSize:        fs(14),
    color:           C.text,
    paddingVertical: scaleH(12),
    fontWeight:      '500',
  },
  cityRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.surface,
    borderRadius:    ms(14),
    paddingVertical: scaleH(14),
    paddingHorizontal: scaleW(14),
    marginBottom:    scaleH(8),
    borderWidth:     1,
    borderColor:     C.border,
    elevation:       1,
    shadowColor:     C.shadow,
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.04,
    shadowRadius:    4,
  },
  cityRowIcon: {
    width:           ms(40),
    height:          ms(40),
    borderRadius:    ms(10),
    backgroundColor: C.primaryLight,
    justifyContent:  'center',
    alignItems:      'center',
    marginRight:     scaleW(12),
    flexShrink:      0,
  },
  cityRowName: {
    flex:       1,
    fontSize:   fs(15),
    fontWeight: '600',
    color:      C.text,
  },
  cityRowChevron: {
    width:           ms(28),
    height:          ms(28),
    borderRadius:    ms(8),
    backgroundColor: C.bg,
    justifyContent:  'center',
    alignItems:      'center',
  },

  // ── Form ──
  formScroll: {
    paddingHorizontal: GUTTER,
    paddingTop:        scaleH(14),
    paddingBottom:     scaleH(16),
    gap:               scaleH(12),
  },

  cityPillRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   scaleH(2),
  },
  cityPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               scaleW(5),
    backgroundColor:   C.primaryLight,
    borderRadius:      ms(20),
    paddingHorizontal: scaleW(12),
    paddingVertical:   scaleH(5),
    borderWidth:       1,
    borderColor:       C.primaryMid,
  },
  cityPillText: {
    fontSize:   fs(12),
    fontWeight: '700',
    color:      C.primary,
  },
  changeCityBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               scaleW(4),
    paddingHorizontal: scaleW(10),
    paddingVertical:   scaleH(5),
    borderRadius:      ms(8),
    backgroundColor:   C.primaryLight,
    borderWidth:       1,
    borderColor:       C.primaryMid,
  },
  changeCityText: {
    fontSize:   fs(12),
    fontWeight: '700',
    color:      C.primary,
  },

  // ── Card ──
  card: {
    backgroundColor: C.surface,
    borderRadius:    ms(16),
    padding:         ms(16),
    borderWidth:     1,
    borderColor:     C.border,
    elevation:       2,
    shadowColor:     C.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
  },

  // ── Route inputs ──
  routeInputRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: scaleH(4),
  },
  routeInputRowDrop: { paddingTop: scaleH(2) },
  routeInputRowActive: {},
  routeDotCol: {
    alignItems:  'center',
    width:       ms(24),
    marginRight: scaleW(10),
    flexShrink:  0,
  },
  dotPickup: {
    width:           DOT_SIZE,
    height:          DOT_SIZE,
    borderRadius:    DOT_SIZE / 2,
    backgroundColor: C.green,
    borderWidth:     2,
    borderColor:     C.greenLight,
  },
  dotDrop: {
    width:           DOT_SIZE,
    height:          DOT_SIZE,
    borderRadius:    DOT_SIZE / 2,
    backgroundColor: C.red,
    borderWidth:     2,
    borderColor:     C.redLight,
  },
  routeLine: {
    width:           2,
    height:          scaleH(28),
    backgroundColor: C.border,
    marginTop:       scaleH(3),
  },
  routeInput: {
    flex:            1,
    fontSize:        fs(13),
    color:           C.text,
    paddingVertical: scaleH(12),
    paddingHorizontal: scaleW(10),
    backgroundColor: C.surfaceAlt,
    borderRadius:    ms(10),
    borderWidth:     1.5,
    borderColor:     C.border,
    fontWeight:      '500',
  },
  locateBtn: {
    marginLeft:      scaleW(8),
    width:           ms(34),
    height:          ms(34),
    borderRadius:    ms(9),
    backgroundColor: C.primaryLight,
    justifyContent:  'center',
    alignItems:      'center',
    flexShrink:      0,
  },

  // ── Suggestions ──
  suggestionBox: {
    marginTop:       scaleH(10),
    borderTopWidth:  1,
    borderTopColor:  C.border,
    paddingTop:      scaleH(10),
  },
  suggestionTitleRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   scaleH(8),
  },
  suggestionTitle: {
    fontSize:   fs(11),
    fontWeight: '700',
    color:      C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  suggestionRow: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: scaleH(10),
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
    gap:             scaleW(10),
  },
  suggestionIconBox: {
    width:           ms(30),
    height:          ms(30),
    borderRadius:    ms(8),
    backgroundColor: C.primaryLight,
    justifyContent:  'center',
    alignItems:      'center',
    flexShrink:      0,
  },
  suggestionInfo:   { flex: 1 },
  suggestionName: {
    fontSize:   fs(13),
    fontWeight: '600',
    color:      C.text,
    marginBottom: scaleH(1),
  },
  suggestionAddress: { fontSize: fs(11), color: C.textMuted },
  suggestionLoading: {
    alignItems:    'center',
    paddingVertical: scaleH(24),
    gap:           scaleH(8),
  },
  suggestionLoadingText: { fontSize: fs(12), color: C.textMuted },
  suggestionEmpty: {
    alignItems:    'center',
    paddingVertical: scaleH(24),
    gap:           scaleH(4),
  },
  suggestionEmptyText: { fontSize: fs(13), color: C.textSub, fontWeight: '500' },
  suggestionEmptySub:  { fontSize: fs(12), color: C.textMuted },

  // ── Form fields ──
  chipGroupLabel: {
    fontSize:     fs(12),
    fontWeight:   '700',
    color:        C.textSub,
    marginBottom: scaleH(10),
    marginTop:    scaleH(4),
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           scaleW(8),
    marginBottom:  scaleH(12),
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               scaleW(5),
    paddingHorizontal: scaleW(13),
    paddingVertical:   scaleH(8),
    borderRadius:      ms(20),
    backgroundColor:   C.surfaceAlt,
    borderWidth:       1.5,
    borderColor:       C.border,
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor:     C.primaryDark,
  },
  chipText: {
    fontSize:   fs(12),
    fontWeight: '700',
    color:      C.textSub,
  },
  chipTextActive: { color: '#FFFFFF' },

  // ── Footer ──
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop:        scaleH(12),
    paddingBottom:     Platform.OS === 'ios' ? scaleH(28) : scaleH(18),
    backgroundColor:   C.surface,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    elevation:         8,
    shadowColor:       C.shadow,
    shadowOffset:      { width: 0, height: -3 },
    shadowOpacity:     0.08,
    shadowRadius:      8,
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius:    ms(14),
    paddingVertical: scaleH(15),
    flexDirection:   'row',
    justifyContent:  'center',
    alignItems:      'center',
    gap:             scaleW(8),
    elevation:       2,
    shadowColor:     C.primaryDark,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.25,
    shadowRadius:    6,
  },
  continueBtnDisabled: {
    backgroundColor: C.border,
    elevation:       0,
    shadowOpacity:   0,
  },
  continueBtnText: {
    fontSize:      fs(15),
    fontWeight:    '700',
    color:         '#FFFFFF',
    letterSpacing: 0.2,
  },
  continueBtnTextDisabled: { color: C.textMuted },
  arrowIcon:    { width: ARROW_SIZE, height: ARROW_SIZE, tintColor: '#FFFFFF' },
  arrowDisabled:{ tintColor: C.textMuted },
});

export default PickupDropSelection;