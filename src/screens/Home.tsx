import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';
import BottomTabBar from './BottomTabBar';
import Spinner from '../components/Spinner';
import { useAuthStore } from '../store/useAuthStore';
import {MAPBOX_PUBLIC_TOKEN} from '../config/mapboxToken';

const { width, height } = Dimensions.get('window');

// Initialize Mapbox OUTSIDE the component
Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);

const Home = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();

  const cameraRef = useRef<Mapbox.Camera>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isServicesVisible, setIsServicesVisible] = useState(true);
  const [_locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);

  // Get auth token from store
  const { token, isAuthenticated } = useAuthStore();

  // Default center (Bhubaneswar)
  const defaultCenter: [number, number] = [85.8245, 20.2961];

  // Log token on home screen
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🏠 Home Screen - Bearer Token:', token);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message:
                'Zipto needs access to your location to show your position on the map.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setLocationPermissionGranted(true);
            startLocationTracking();
          } else {
            console.log('Location permission denied');
          }
        } else {
          setLocationPermissionGranted(true);
          startLocationTracking();
        }
      } catch (err) {
        console.warn('Permission error:', err);
      }
    };

    requestLocationPermission();
  }, []);

  const startLocationTracking = () => {
    console.log('📍 Starting location tracking...');

    // Use low accuracy first - it's faster and more reliable
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Location obtained:', { latitude, longitude });
        const newLocation: [number, number] = [longitude, latitude];
        setUserLocation(newLocation);

        // Move camera to user's location
        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: newLocation,
            zoomLevel: 15,
            animationDuration: 1000,
          });
        }
      },
      error => {
        console.log('Location error:', error);
        // Silently fail - map will show default location
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );

    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]);
      },
      error => console.log('Error watching location:', error),
      { enableHighAccuracy: false, distanceFilter: 10 },
    );

    return () => Geolocation.clearWatch(watchId);
  };

  const services = [
    {
      id: 1,
      title: 'Send Packages',
      icon: 'local-shipping',
      gradient: ['#3B82F6', '#2563EB'],
      description: 'Quick delivery',
      serviceCategory: 'send_packages',
    },
    {
      id: 2,
      title: 'Transport Goods',
      icon: 'fire-truck',
      gradient: ['#10B981', '#059669'],
      description: 'Heavy items',
      serviceCategory: 'transport_goods',
    },
    {
      id: 3,
      title: 'Food Delivery',
      icon: 'restaurant',
      gradient: ['#F59E0B', '#D97706'],
      description: 'Hot & fresh',
      serviceCategory: 'food_delivery',
    },
    {
      id: 4,
      title: 'Medicine',
      icon: 'local-pharmacy',
      gradient: ['#EF4444', '#DC2626'],
      description: 'Emergency delivery',
      serviceCategory: 'medicine',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Mapbox Map */}
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={() => setIsMapLoading(false)}
        onDidFailLoadingMap={() => setIsMapLoading(false)}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={15}
          centerCoordinate={userLocation || defaultCenter}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Custom User Location Marker using ShapeSource + SymbolLayer or PointAnnotation */}
        {userLocation && (
          <Mapbox.MarkerView
            id="userLocationMarker"
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.customMarker}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
            </View>
          </Mapbox.MarkerView>
        )}
      </Mapbox.MapView>

      {/* Main Content Overlay */}
      <SafeAreaView style={styles.mainOverlay} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          {/* Left Side - Logo and Zipto Text */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/logo_zipto.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.ziptoText}>Zipto</Text>
          </View>

          {/* Right Side - Wallet Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Wallet')}
            style={styles.walletButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="account-balance-wallet"
              size={24}
              color="#3B82F6"
            />
            <Text style={styles.walletText}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Content Container */}
        <View style={styles.bottomContainer}>
          {/* Services Grid - Conditional Rendering */}
          {isServicesVisible && (
            <View style={styles.servicesContainer}>
              <Text style={styles.servicesTitle}>Our Services</Text>
              <View style={styles.servicesGrid}>
                {services.map(service => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceCard}
                    onPress={() => navigation.navigate('PickupDropSelection', { serviceCategory: service.serviceCategory })}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.serviceIconContainer,
                        { backgroundColor: service.gradient[0] },
                      ]}
                    >
                      <MaterialIcons
                        name={service.icon}
                        size={32}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>
                      {service.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Bottom Navigation Bar */}
      <BottomTabBar />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsServicesVisible(!isServicesVisible)}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={isServicesVisible ? 'close' : 'menu'}
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* Loading Spinner */}
      <Spinner
        visible={isFocused && isMapLoading}
        overlay={true}
        size="large"
        color="#3B82F6"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    width,
    height,
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  mainOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  ziptoText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  walletText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },
  bottomContainer: {
    marginBottom: 80,
  },
  servicesContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default Home;
