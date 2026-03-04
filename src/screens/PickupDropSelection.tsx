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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { mapboxApi } from '../api/mapbox';
import { useAuthStore } from '../store/useAuthStore';

// Type definitions
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
  'Bhubaneswar',
  'Cuttack',
  'Puri',
  'Berhampur',
  'Sambalpur',
  'Rourkela',
  'Balasore',
  'Baripada',
  'Bhadrak',
  'Jharsuguda',
];

const LOCATION_TYPES: LocationType[] = ['Home', 'Shop', 'Office', 'Other'];

const PickupDropSelection = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const serviceCategory = route.params?.serviceCategory || 'send_packages';
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop'>('pickup');
  const [selectedCity, setSelectedCity] = useState<CityName | ''>('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [filteredCities, setFilteredCities] = useState<CityName[]>(CITIES);
  const [showCitySelection, setShowCitySelection] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // New states for sender details
  const [senderName, setSenderName] = useState('');
  const [senderMobile, setSenderMobile] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<
    LocationType | ''
  >('');
  const [customLocationName, setCustomLocationName] = useState('');

  // Coordinates for pickup and drop locations
  const [pickupCoords, setPickupCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [dropCoords, setDropCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Session token for Mapbox analytics
  const sessionTokenRef = useRef(
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );

  // Search debounce timer
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Determine proximity based on selected city if needed,
    // or just clear locations when city changes
    setFilteredLocations([]);
  }, [selectedCity]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user?.name && !senderName.trim()) {
      setSenderName(user.name);
    }

    if (user?.phone && !senderMobile.trim()) {
      const mobile = user.phone.replace(/\D/g, '').slice(-10);
      setSenderMobile(mobile);
    }
  }, [user, senderName, senderMobile]);

  const handleCitySelect = (city: CityName) => {
    setSelectedCity(city);
    setShowCitySelection(false);
  };

  const handleLocationSelect = async (location: Location) => {
    try {
      // Check if we have a mapbox_id to retrieve details
      if (!location.metadata?.mapbox_id) {
        Alert.alert(
          'Error',
          'Invalid location data. Please try selecting again.',
        );
        return;
      }

      // Call retrieve API to get full location details including coordinates
      const fullLocationData = await mapboxApi.retrievePlace(
        location.metadata.mapbox_id,
        sessionTokenRef.current,
      );

      if (!fullLocationData || !fullLocationData.center) {
        Alert.alert(
          'Error',
          'Could not get location coordinates. Please try again.',
        );
        return;
      }

      const fullAddress =
        fullLocationData.name + ', ' + fullLocationData.address;
      const coordinates = {
        latitude: fullLocationData.center[1], // Mapbox format is [lng, lat]
        longitude: fullLocationData.center[0],
      };

      console.log(
        `📍 ${activeInput === 'pickup' ? 'Pickup' : 'Drop'} Selected:`,
        coordinates,
      );

      if (activeInput === 'pickup') {
        setPickup(fullAddress);
        setPickupCoords(coordinates);
      } else {
        setDrop(fullAddress);
        setDropCoords(coordinates);
      }

      // Clear suggestions and reset active input to close suggestion cards
      setFilteredLocations([]);
      setActiveInput('' as 'pickup' | 'drop');
    } catch (error) {
      console.error('Error retrieving location:', error);
      Alert.alert('Error', 'Failed to select location. Please try again.');
    }
  };

  const handleSearchCity = (text: string) => {
    if (text.trim() === '') {
      setFilteredCities(CITIES);
    } else {
      const filtered = CITIES.filter(city =>
        city.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredCities(filtered);
    }
  };

  const handleSearchLocation = async (text: string) => {
    // Update input state immediately
    if (activeInput === 'pickup') {
      setPickup(text);
    } else {
      setDrop(text);
    }

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If text is too short, clear suggestions
    if (text.trim().length < 2) {
      setFilteredLocations([]);
      setIsSearching(false);
      return;
    }

    // Set loading state immediately
    setIsSearching(true);

    // Debounce search - wait 400ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Add city context to query if selected
        const query = selectedCity ? `${text}, ${selectedCity}` : text;

        // Search with session token for analytics
        const results = await mapboxApi.searchPlaces(
          query,
          undefined,
          sessionTokenRef.current,
        );

        setFilteredLocations(results);
      } catch (error) {
        console.error('Search error:', error);
        setFilteredLocations([]);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce delay
  };

  const validateMobileNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const navigateToBook = () => {
    if (!senderName.trim()) {
      Alert.alert('Missing Information', 'Please enter sender name');
      return;
    }

    if (!validateMobileNumber(senderMobile)) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number',
      );
      return;
    }

    if (!selectedLocationType) {
      Alert.alert('Missing Information', 'Please select location type');
      return;
    }

    if (selectedLocationType === 'Other' && !customLocationName.trim()) {
      Alert.alert('Missing Information', 'Please enter custom location name');
      return;
    }

    // Validate coordinates are available
    if (!pickupCoords) {
      Alert.alert(
        'Invalid Pickup Location',
        'Please select pickup location from the suggestions',
      );
      return;
    }

    if (!dropCoords) {
      Alert.alert(
        'Invalid Drop Location',
        'Please select drop location from the suggestions',
      );
      return;
    }

    if (pickup && drop) {
      navigation.navigate('VehicleSelection', {
        pickup,
        drop,
        pickupCoords,
        dropCoords,
        currentLocationCoords: null,
        senderName,
        senderMobile,
        city: selectedCity,
        serviceCategory,
        locationType:
          selectedLocationType === 'Other'
            ? customLocationName
            : selectedLocationType,
      });
    }
  };

  const canProceed =
    pickup.trim() !== '' &&
    drop.trim() !== '' &&
    senderName.trim() !== '' &&
    validateMobileNumber(senderMobile) &&
    selectedLocationType !== '' &&
    (selectedLocationType !== 'Other' || customLocationName.trim() !== '');

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'Home':
        return 'home';
      case 'Shop':
        return 'store';
      case 'Office':
        return 'business';
      case 'Other':
        return 'location-on';
      default:
        return 'location-on';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* City Selection */}
        {showCitySelection && !selectedCity && (
          <View style={styles.citySelectionContainer}>
            <Text style={styles.sectionTitle}>Select City</Text>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#64748B" />
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
                    <MaterialIcons
                      name="location-city"
                      size={24}
                      color="#3B82F6"
                    />
                  </View>
                  <Text style={styles.cityName}>{item}</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#64748B"
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Location Inputs */}
        {selectedCity && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Selected City:{' '}
                <Text style={styles.cityBadge}>{selectedCity}</Text>
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

            {/* Pickup & Drop Section - RESTRUCTURED */}
            <View style={styles.locationsSection}>
              <Text style={styles.sectionTitle}>Pickup & Drop Locations</Text>

              {/* Pickup Input */}
              <View style={styles.locationInputContainer}>
                <View style={styles.inputIcon}>
                  <View style={styles.pickupDot} />
                </View>
                <TextInput
                  style={[
                    styles.locationInput,
                    activeInput === 'pickup' && styles.activeInput,
                  ]}
                  placeholder="Enter pickup location *"
                  placeholderTextColor="#94A3B8"
                  value={pickup}
                  onChangeText={handleSearchLocation}
                  onFocus={() => setActiveInput('pickup')}
                />
              </View>

              {/* Pickup Suggestions - Appears immediately below pickup input */}
              {activeInput === 'pickup' && pickup.trim().length > 1 && (
                <View style={styles.suggestionsSection}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.subSectionTitle}>
                      Suggested Locations
                    </Text>
                    {isSearching && (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    )}
                  </View>

                  {/* Show loading indicator while searching */}
                  {isSearching && filteredLocations.length === 0 && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={styles.loadingText}>Searching...</Text>
                    </View>
                  )}

                  {/* Show suggestions */}
                  {!isSearching && filteredLocations.length > 0 && (
                    <>
                      {filteredLocations.map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.locationCard}
                          onPress={() => handleLocationSelect(item)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.locationIconContainer}>
                            <MaterialIcons
                              name="location-on"
                              size={18}
                              color="#3B82F6"
                            />
                          </View>
                          <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{item.name}</Text>
                            <Text
                              style={styles.locationAddress}
                              numberOfLines={2}
                            >
                              {item.address}
                            </Text>
                          </View>
                          <MaterialIcons
                            name="north-west"
                            size={16}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* Show no results message */}
                  {!isSearching &&
                    filteredLocations.length === 0 &&
                    pickup.trim().length > 2 && (
                      <View style={styles.emptyContainer}>
                        <MaterialIcons
                          name="search-off"
                          size={40}
                          color="#94A3B8"
                        />
                        <Text style={styles.emptyText}>
                          No locations found for "{pickup}"
                        </Text>
                        <Text style={styles.emptySubText}>
                          Try a different search term
                        </Text>
                      </View>
                    )}
                </View>
              )}

              {/* Drop Input */}
              <View style={[styles.locationInputContainer, { marginTop: 12 }]}>
                <View style={styles.inputIcon}>
                  <View style={styles.dropDot} />
                </View>
                <TextInput
                  style={[
                    styles.locationInput,
                    activeInput === 'drop' && styles.activeInput,
                  ]}
                  placeholder="Enter drop location *"
                  placeholderTextColor="#94A3B8"
                  value={drop}
                  onChangeText={handleSearchLocation}
                  onFocus={() => setActiveInput('drop')}
                />
              </View>

              {/* Drop Suggestions - Appears immediately below drop input */}
              {activeInput === 'drop' && drop.trim().length > 1 && (
                <View style={styles.suggestionsSection}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.subSectionTitle}>
                      Suggested Locations
                    </Text>
                    {isSearching && (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    )}
                  </View>

                  {/* Show loading indicator while searching */}
                  {isSearching && filteredLocations.length === 0 && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={styles.loadingText}>Searching...</Text>
                    </View>
                  )}

                  {/* Show suggestions */}
                  {!isSearching && filteredLocations.length > 0 && (
                    <>
                      {filteredLocations.map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.locationCard}
                          onPress={() => handleLocationSelect(item)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.locationIconContainer}>
                            <MaterialIcons
                              name="location-on"
                              size={18}
                              color="#3B82F6"
                            />
                          </View>
                          <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{item.name}</Text>
                            <Text
                              style={styles.locationAddress}
                              numberOfLines={2}
                            >
                              {item.address}
                            </Text>
                          </View>
                          <MaterialIcons
                            name="north-west"
                            size={16}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* Show no results message */}
                  {!isSearching &&
                    filteredLocations.length === 0 &&
                    drop.trim().length > 2 && (
                      <View style={styles.emptyContainer}>
                        <MaterialIcons
                          name="search-off"
                          size={40}
                          color="#94A3B8"
                        />
                        <Text style={styles.emptyText}>
                          No locations found for "{drop}"
                        </Text>
                        <Text style={styles.emptySubText}>
                          Try a different search term
                        </Text>
                      </View>
                    )}
                </View>
              )}
            </View>

            {/* Sender Details Section - MOVED BELOW */}
            <View style={styles.senderDetailsSection}>
              <Text style={styles.sectionTitle}>Sender Details</Text>

              {/* Sender Name */}
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color="#64748B"
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Sender Name *"
                  placeholderTextColor="#94A3B8"
                  value={senderName}
                  onChangeText={setSenderName}
                />
              </View>

              {/* Sender Mobile */}
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="phone"
                  size={20}
                  color="#64748B"
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Mobile Number *"
                  placeholderTextColor="#94A3B8"
                  value={senderMobile}
                  onChangeText={text =>
                    setSenderMobile(text.replace(/\D/g, '').slice(0, 10))
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Location Type */}
              <Text style={styles.subSectionTitle}>Save Location As *</Text>
              <View style={styles.locationTypeContainer}>
                {LOCATION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.locationTypeChip,
                      selectedLocationType === type &&
                        styles.locationTypeChipActive,
                    ]}
                    onPress={() => setSelectedLocationType(type)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={getLocationIcon(type)}
                      size={18}
                      color={
                        selectedLocationType === type ? '#FFFFFF' : '#64748B'
                      }
                    />
                    <Text
                      style={[
                        styles.locationTypeText,
                        selectedLocationType === type &&
                          styles.locationTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Location Name for "Other" */}
              {selectedLocationType === 'Other' && (
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="edit"
                    size={20}
                    color="#64748B"
                    style={styles.inputIconLeft}
                  />
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
          </ScrollView>
        )}
      </Animated.View>

      {/* Footer */}
      {selectedCity && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !canProceed && styles.continueButtonDisabled,
            ]}
            onPress={navigateToBook}
            disabled={!canProceed}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.continueButtonText,
                !canProceed && styles.continueButtonTextDisabled,
              ]}
            >
              Continue
            </Text>
            <Text style={[styles.arrow, !canProceed && styles.arrowDisabled]}>
              →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  citySelectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 14,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 12,
    marginLeft: 12,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  cityBadge: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  changeCityButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  changeCityText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  senderDetailsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIconLeft: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 12,
  },
  locationTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  locationTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  locationTypeChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  locationTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  locationTypeTextActive: {
    color: '#FFFFFF',
  },
  locationsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  inputsWrapper: {
    gap: 12,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  dropDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 14,
  },
  activeInput: {
    color: '#1E293B',
  },
  suggestionsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
  },
  locationAddress: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 12,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
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
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  continueButtonTextDisabled: {
    color: '#94A3B8',
  },
  arrow: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  arrowDisabled: {
    color: '#94A3B8',
  },
});

export default PickupDropSelection;
