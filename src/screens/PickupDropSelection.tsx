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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mapboxApi } from '../api/mapbox';
import { useAuthStore } from '../store/useAuthStore';

const PICKUP_CACHE_KEY = 'pickup_location_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOCATION_CHANGE_THRESHOLD_M = 200; // metres

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

const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

const ms = (size: number, factor = 0.45) =>
  size + (scaleW(size) - size) * factor;

const fs = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(ms(size)));
// ─────────────────────────────────────────────────────────────────────────────

type Location = {
  id: string;
  name: string;
  address: string;
  center?: [number, number];
  metadata?: {
    mapbox_id?: string;
    feature_type?: string;
  };
};

type CityName = string;
type LocationType = 'Home' | 'Shop' | 'Office' | 'Other';

const CITIES: CityName[] = [
  'Bhubaneswar', 'Cuttack', 'Puri', 'Berhampur',
  'Sambalpur', 'Rourkela', 'Balasore', 'Baripada',
  'Bhadrak', 'Jharsuguda',
];

const LOCATION_TYPES: LocationType[] = ['Home', 'Shop', 'Office', 'Other'];

const PickupDropSelection = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
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

  const [autoFillingPickup, setAutoFillingPickup] = useState(false);
  const [locationChanged,   setLocationChanged]   = useState(false);

  const sessionTokenRef  = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchIdRef       = useRef<number | null>(null);
  const fadeAnim         = useRef(new Animated.Value(1)).current;
  const slideAnim        = useRef(new Animated.Value(0)).current;

  useEffect(() => { setFilteredLocations([]); }, [selectedCity]);

  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

  // Load cached pickup on mount
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

  // Watch GPS to detect if user has moved away from the cached pickup location
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
        const dist = haversineDistance(
          latitude, longitude,
          pickupCoords.latitude, pickupCoords.longitude,
        );
        setLocationChanged(dist > LOCATION_CHANGE_THRESHOLD_M);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000, distanceFilter: 50 },
    );
    watchIdRef.current = id;
    return () => {
      Geolocation.clearWatch(id);
      watchIdRef.current = null;
    };
  }, [pickupCoords]);

  const savePickupCache = async (
    address: string,
    coords: { latitude: number; longitude: number },
  ) => {
    try {
      await AsyncStorage.setItem(
        PICKUP_CACHE_KEY,
        JSON.stringify({ address, coords, cachedAt: Date.now() }),
      );
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
      error => {
        console.log('GPS error:', error);
        setAutoFillingPickup(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  // Auto-fill pickup location from current GPS position (only when city selected and pickup empty)
  useEffect(() => {
    if (!selectedCity) return;
    // Only auto-fill if pickup is still empty (user hasn't typed anything / no cache hit)
    if (pickup) return;
    detectCurrentLocation();
  }, [selectedCity]);

  useEffect(() => {
    if (user?.name && !senderName.trim()) setSenderName(user.name);
    if (user?.phone && !senderMobile.trim()) {
      setSenderMobile(user.phone.replace(/\D/g, '').slice(-10));
    }
  }, [user, senderName, senderMobile]);

  const handleCitySelect = (city: CityName) => {
    setSelectedCity(city);
    setShowCitySelection(false);
  };

  const handleLocationSelect = async (location: Location) => {
    try {
      if (!location.metadata?.mapbox_id) {
        Alert.alert('Error', 'Invalid location data. Please try selecting again.');
        return;
      }
      const fullLocationData = await mapboxApi.retrievePlace(
        location.metadata.mapbox_id,
        sessionTokenRef.current,
      );
      if (!fullLocationData || !fullLocationData.center) {
        Alert.alert('Error', 'Could not get location coordinates. Please try again.');
        return;
      }
      const fullAddress  = fullLocationData.name + ', ' + fullLocationData.address;
      const coordinates  = {
        latitude:  fullLocationData.center[1],
        longitude: fullLocationData.center[0],
      };
      if (activeInput === 'pickup') { setPickup(fullAddress);  setPickupCoords(coordinates); }
      else                          { setDrop(fullAddress);    setDropCoords(coordinates);   }
      setFilteredLocations([]);
      setActiveInput('' as 'pickup' | 'drop');
    } catch (error) {
      Alert.alert('Error', 'Failed to select location. Please try again.');
    }
  };

  const handleSearchCity = (text: string) => {
    setFilteredCities(
      text.trim() === ''
        ? CITIES
        : CITIES.filter(c => c.toLowerCase().includes(text.toLowerCase())),
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
    }, 400);
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
    pickup.trim() !== '' &&
    drop.trim() !== '' &&
    senderName.trim() !== '' &&
    validateMobileNumber(senderMobile) &&
    receiverName.trim() !== '' &&
    validateMobileNumber(receiverMobile) &&
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

  const SuggestionList = ({ query }: { query: string }) => (
    <View style={styles.suggestionsSection}>
      <View style={styles.suggestionHeader}>
        <Text style={styles.subSectionTitle}>Suggested Locations</Text>
        {isSearching && <ActivityIndicator size="small" color="#3B82F6" />}
      </View>

      {isSearching && filteredLocations.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!isSearching && filteredLocations.length > 0 &&
        filteredLocations.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.locationCard}
            onPress={() => handleLocationSelect(item)}
            activeOpacity={0.7}
          >
            <View style={styles.locationIconContainer}>
              <MaterialIcons name="location-on" size={ms(18)} color="#3B82F6" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.name}</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>{item.address}</Text>
            </View>
            <MaterialIcons name="north-west" size={ms(16)} color="#64748B" />
          </TouchableOpacity>
        ))
      }

      {!isSearching && filteredLocations.length === 0 && query.trim().length > 2 && (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={ms(40)} color="#94A3B8" />
          <Text style={styles.emptyText}>No locations found for "{query}"</Text>
          <Text style={styles.emptySubText}>Try a different search term</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
        >
          <MaterialIcons name="arrow-back" size={ms(24)} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* ── City Selection ── */}
        {showCitySelection && !selectedCity && (
          <View style={styles.citySelectionContainer}>
            <Text style={styles.sectionTitle}>Select City</Text>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={ms(20)} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city..."
                placeholderTextColor="#94A3B8"
                onChangeText={handleSearchCity}
              />
            </View>
            <FlatList
              data={filteredCities}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityCard}
                  onPress={() => handleCitySelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cityIconContainer}>
                    <MaterialIcons name="location-city" size={ms(24)} color="#3B82F6" />
                  </View>
                  <Text style={styles.cityName}>{item}</Text>
                  <MaterialIcons name="chevron-right" size={ms(24)} color="#64748B" />
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Location Inputs (after city selected) ── */}
        {selectedCity && (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* City badge row */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Selected City: <Text style={styles.cityBadge}>{selectedCity}</Text>
              </Text>
              <TouchableOpacity
                style={styles.changeCityButton}
                onPress={() => {
                  setSelectedCity('');
                  setShowCitySelection(true);
                  setPickup('');
                  setDrop('');
                  setFilteredLocations([]);
                }}
              >
                <Text style={styles.changeCityText}>Change City</Text>
              </TouchableOpacity>
            </View>

            {/* Pickup & Drop */}
            <View style={styles.locationsSection}>
              <Text style={styles.sectionTitle}>Pickup & Drop Locations</Text>

              {/* Pickup input */}
              <View style={styles.locationInputContainer}>
                <View style={styles.inputIcon}>
                  <View style={styles.pickupDot} />
                </View>
                <TextInput
                  style={[styles.locationInput, activeInput === 'pickup' && styles.activeInput]}
                  placeholder={autoFillingPickup ? 'Detecting your location...' : 'Enter pickup location *'}
                  placeholderTextColor="#94A3B8"
                  value={pickup}
                  onChangeText={(text) => {
                    // When user edits, clear auto-filled coords so they must pick from suggestions
                    if (pickupCoords) setPickupCoords(null);
                    handleSearchLocation(text);
                  }}
                  onFocus={() => setActiveInput('pickup')}
                />
                {autoFillingPickup && (
                  <ActivityIndicator size="small" color="#3B82F6" style={{ marginLeft: scaleW(8) }} />
                )}
                {!autoFillingPickup && (!pickup || locationChanged) && (
                  <TouchableOpacity
                    onPress={detectCurrentLocation}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons
                      name="my-location"
                      size={ms(20)}
                      color={locationChanged ? '#EF4444' : '#3B82F6'}
                    />
                  </TouchableOpacity>
                )}
              </View>
              {activeInput === 'pickup' && pickup.trim().length > 1 && (
                <SuggestionList query={pickup} />
              )}

              {/* Drop input */}
              <View style={[styles.locationInputContainer, { marginTop: scaleH(12) }]}>
                <View style={styles.inputIcon}>
                  <View style={styles.dropDot} />
                </View>
                <TextInput
                  style={[styles.locationInput, activeInput === 'drop' && styles.activeInput]}
                  placeholder="Enter drop location *"
                  placeholderTextColor="#94A3B8"
                  value={drop}
                  onChangeText={handleSearchLocation}
                  onFocus={() => setActiveInput('drop')}
                />
              </View>
              {activeInput === 'drop' && drop.trim().length > 1 && (
                <SuggestionList query={drop} />
              )}
            </View>

            {/* Sender Details */}
            <View style={styles.senderDetailsSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconContainer}>
                  <MaterialIcons name="upload" size={ms(18)} color="#10B981" />
                </View>
                <Text style={styles.sectionTitle}>Sender Details</Text>
              </View>

              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={ms(20)} color="#64748B" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Sender Name *"
                  placeholderTextColor="#94A3B8"
                  value={senderName}
                  onChangeText={setSenderName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialIcons name="phone" size={ms(20)} color="#64748B" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Sender Mobile Number *"
                  placeholderTextColor="#94A3B8"
                  value={senderMobile}
                  onChangeText={text => setSenderMobile(text.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <Text style={styles.subSectionTitle}>Save Location As *</Text>
              <View style={styles.locationTypeContainer}>
                {LOCATION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.locationTypeChip,
                      selectedLocationType === type && styles.locationTypeChipActive,
                    ]}
                    onPress={() => setSelectedLocationType(type)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={getLocationIcon(type)}
                      size={ms(18)}
                      color={selectedLocationType === type ? '#FFFFFF' : '#64748B'}
                    />
                    <Text style={[
                      styles.locationTypeText,
                      selectedLocationType === type && styles.locationTypeTextActive,
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedLocationType === 'Other' && (
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="edit" size={ms(20)} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter location name (e.g., Gym, Friend's Place) *"
                    placeholderTextColor="#94A3B8"
                    value={customLocationName}
                    onChangeText={setCustomLocationName}
                  />
                </View>
              )}
            </View>

            {/* Receiver Details */}
            <View style={styles.receiverDetailsSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconContainer, styles.receiverIconContainer]}>
                  <MaterialIcons name="download" size={ms(18)} color="#EF4444" />
                </View>
                <Text style={styles.sectionTitle}>Receiver Details</Text>
              </View>

              <View style={styles.inputWrapper}>
                <MaterialIcons name="person-outline" size={ms(20)} color="#64748B" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Receiver Name *"
                  placeholderTextColor="#94A3B8"
                  value={receiverName}
                  onChangeText={setReceiverName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialIcons name="phone" size={ms(20)} color="#64748B" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Receiver Mobile Number *"
                  placeholderTextColor="#94A3B8"
                  value={receiverMobile}
                  onChangeText={text => setReceiverMobile(text.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* Footer */}
      {selectedCity && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !canProceed && styles.continueButtonDisabled]}
            onPress={navigateToBook}
            disabled={!canProceed}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueButtonText, !canProceed && styles.continueButtonTextDisabled]}>
              Continue
            </Text>
            <Image
              source={require('../assets/images/arrow.png')}
              style={[styles.arrowIcon, !canProceed && styles.arrowIconDisabled]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize      = ms(40);
const cityIconContSize = ms(48);
const locIconContSize  = ms(32);
const dotSize          = ms(12);
const inputIconWidth   = ms(24);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleW(16),
    paddingTop: scaleH(20),
    paddingBottom: scaleH(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: scaleW(16),
    width: backBtnSize,
    height: backBtnSize,
    borderRadius: backBtnSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: 'bold',
    color: '#1E293B',
  },

  content: { flex: 1 },

  citySelectionContainer: {
    flex: 1,
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(20),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: scaleH(14),
  },
  subSectionTitle: {
    fontSize: fs(13),
    fontWeight: '600',
    color: '#475569',
    marginBottom: scaleH(10),
    marginTop: scaleH(4),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleH(14),
    gap: scaleW(10),
  },
  sectionIconContainer: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiverIconContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    paddingHorizontal: scaleW(16),
    marginBottom: scaleH(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: fs(14),
    color: '#1E293B',
    paddingVertical: scaleH(12),
    marginLeft: scaleW(12),
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(14),
    marginBottom: scaleH(10),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cityIconContainer: {
    width: cityIconContSize,
    height: cityIconContSize,
    borderRadius: cityIconContSize / 2,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(16),
    flexShrink: 0,
  },
  cityName: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '600',
    color: '#1E293B',
  },

  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleW(20),
    paddingVertical: scaleH(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  inputLabel:  { fontSize: fs(14), color: '#64748B' },
  cityBadge:   { color: '#3B82F6', fontWeight: 'bold' },
  changeCityButton: {
    paddingVertical: scaleH(6),
    paddingHorizontal: scaleW(12),
    borderRadius: ms(6),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  changeCityText: { fontSize: fs(13), color: '#3B82F6', fontWeight: '600' },

  locationsSection: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(20),
    paddingBottom: scaleH(16),
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    paddingHorizontal: scaleW(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    width: inputIconWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(12),
    flexShrink: 0,
  },
  pickupDot: {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: '#10B981',
  },
  dropDot: {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: '#EF4444',
  },
  locationInput: {
    flex: 1,
    fontSize: fs(14),
    color: '#1E293B',
    paddingVertical: scaleH(14),
  },
  activeInput: { color: '#1E293B' },

  suggestionsSection: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(16),
    paddingBottom: scaleH(100),
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleH(10),
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ms(12),
    marginBottom: scaleH(8),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  locationIconContainer: {
    width: locIconContSize,
    height: locIconContSize,
    borderRadius: locIconContSize / 2,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(10),
    flexShrink: 0,
  },
  locationInfo:    { flex: 1 },
  locationName: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: scaleH(3),
  },
  locationAddress: { fontSize: fs(12), color: '#64748B' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleH(50),
  },
  emptyText: {
    fontSize: fs(14),
    color: '#64748B',
    marginTop: scaleH(12),
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: fs(12),
    color: '#94A3B8',
    marginTop: scaleH(6),
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleH(40),
  },
  loadingText: {
    fontSize: fs(13),
    color: '#64748B',
    marginTop: scaleH(12),
  },

  senderDetailsSection: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(20),
    paddingBottom: scaleH(16),
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  receiverDetailsSection: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(20),
    paddingBottom: scaleH(16),
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    paddingHorizontal: scaleW(16),
    marginBottom: scaleH(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIconLeft: { marginRight: scaleW(12) },
  textInput: {
    flex: 1,
    fontSize: fs(14),
    color: '#1E293B',
    paddingVertical: scaleH(12),
  },
  locationTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleW(10),
    marginBottom: scaleH(12),
  },
  locationTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleW(14),
    paddingVertical: scaleH(10),
    borderRadius: ms(20),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scaleW(6),
  },
  locationTypeChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  locationTypeText: {
    fontSize: fs(13),
    fontWeight: '600',
    color: '#64748B',
  },
  locationTypeTextActive: { color: '#FFFFFF' },

  footer: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(16),
    paddingBottom: scaleH(30),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: ms(12),
    paddingVertical: scaleH(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: '#E2E8F0' },
  continueButtonText: {
    fontSize: fs(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: scaleW(8),
  },
  continueButtonTextDisabled: { color: '#94A3B8' },
  arrowIcon: {
    width: ms(20),
    height: ms(20),
    marginLeft: scaleW(8),
    tintColor: '#FFFFFF',
  },
  arrowIconDisabled: { tintColor: '#94A3B8', opacity: 0.5 },
});

export default PickupDropSelection;