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
  PixelRatio,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import BottomTabBar from './BottomTabBar';
import Spinner from '../components/Spinner';
import { useAuthStore } from '../store/useAuthStore';
import { MAPBOX_PUBLIC_TOKEN } from '../config/mapboxToken';

// ─── Responsive Utilities ────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms = (size: number, factor = 0.45) => size + (scaleW(size) - size) * factor;
const nf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));
const sp = (size: number) => Math.round(scaleW(size));

const isSmallScreen = SCREEN_WIDTH <= 360;
const isLargeScreen = SCREEN_WIDTH >= 428;

// ─── Mapbox Init ─────────────────────────────────────────────────────────────

Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);

// ─── Component ───────────────────────────────────────────────────────────────

const Home = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();

  const cameraRef = useRef<Mapbox.Camera>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isServicesVisible, setIsServicesVisible] = useState(true);
  const [_locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const { token, isAuthenticated } = useAuthStore();
  const defaultCenter: [number, number] = [85.8245, 20.2961];

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
              message: 'Zipto needs access to your location to show your position on the map.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setLocationPermissionGranted(true);
            startLocationTracking();
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
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const newLocation: [number, number] = [longitude, latitude];
        setUserLocation(newLocation);
        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: newLocation,
            zoomLevel: 15,
            animationDuration: 1000,
          });
        }
      },
      error => console.log('Location error:', error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
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
    { id: 1, title: 'Send Packages',   icon: 'local-shipping',  gradient: ['#3B82F6', '#2563EB'], description: 'Quick delivery',      serviceCategory: 'send_packages'   },
    { id: 2, title: 'Transport Goods', icon: 'fire-truck',       gradient: ['#10B981', '#059669'], description: 'Heavy items',         serviceCategory: 'transport_goods'  },
    { id: 3, title: 'Food Delivery',   icon: 'restaurant',       gradient: ['#F59E0B', '#D97706'], description: 'Hot & fresh',         serviceCategory: 'food_delivery'    },
    { id: 4, title: 'Medicine',        icon: 'local-pharmacy',   gradient: ['#EF4444', '#DC2626'], description: 'Emergency delivery',  serviceCategory: 'medicine'         },
  ];

  return (
    <View style={styles.container}>
      {/* ── Mapbox Map ── */}
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

      {/* ── Main Content Overlay ── */}
      <SafeAreaView style={styles.mainOverlay} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
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

          <TouchableOpacity
            onPress={() => navigation.navigate('Wallet')}
            style={styles.walletButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-balance-wallet" size={sp(isSmallScreen ? 20 : 24)} color="#3B82F6" />
            <Text style={styles.walletText}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Content */}
        <View style={styles.bottomContainer}>
          {isServicesVisible && (
            <View style={styles.servicesContainer}>
              <Text style={styles.servicesTitle}>Our Services</Text>
              <View style={styles.servicesGrid}>
                {services.map(service => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceCard}
                    onPress={() =>
                      navigation.navigate('PickupDropSelection', {
                        serviceCategory: service.serviceCategory,
                      })
                    }
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
                        size={sp(isSmallScreen ? 26 : isLargeScreen ? 36 : 32)}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── Bottom Navigation ── */}
      <BottomTabBar />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsServicesVisible(!isServicesVisible)}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={isServicesVisible ? 'close' : 'menu'}
          size={sp(28)}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* ── Loading Spinner ── */}
      <Spinner
        visible={isFocused && isMapLoading}
        overlay={true}
        size="large"
        color="#3B82F6"
      />
    </View>
  );
};

// ─── Responsive Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Map ──────────────────────────────────────────────────────────────────────
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    ...StyleSheet.absoluteFillObject,
  },

  // ── User location marker ─────────────────────────────────────────────────────
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: sp(40),
    height: sp(40),
  },
  userLocationPulse: {
    position: 'absolute',
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  userLocationDot: {
    width: sp(16),
    height: sp(16),
    borderRadius: sp(8),
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },

  // ── Overlay ──────────────────────────────────────────────────────────────────
  mainOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: sp(16),
    paddingBottom: 0,
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: sp(isSmallScreen ? 10 : 12),
    paddingHorizontal: sp(isSmallScreen ? 12 : 16),
    borderRadius: sp(12),
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
    gap: sp(8),
    flex: 1,
  },
  logoContainer: {
    width: sp(isSmallScreen ? 34 : 40),
    height: sp(isSmallScreen ? 34 : 40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  ziptoText: {
    fontSize: nf(isSmallScreen ? 16 : 18),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: sp(isSmallScreen ? 10 : 14),
    paddingVertical: sp(isSmallScreen ? 6 : 8),
    borderRadius: sp(20),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexShrink: 0,
  },
  walletText: {
    fontSize: nf(isSmallScreen ? 12 : 14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },

  // ── Bottom container ─────────────────────────────────────────────────────────
  bottomContainer: {
    marginBottom: sp(80),
  },

  // ── Services panel ───────────────────────────────────────────────────────────
  servicesContainer: {
    backgroundColor: '#FFFFFF',
    padding: sp(isSmallScreen ? 12 : 16),
    borderRadius: sp(16),
    marginBottom: sp(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  servicesTitle: {
    fontSize: nf(isSmallScreen ? 15 : 18),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: sp(12),
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: sp(isSmallScreen ? 8 : 0),
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: sp(isSmallScreen ? 10 : 12),
    borderRadius: sp(12),
    marginBottom: sp(isSmallScreen ? 8 : 12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceIconContainer: {
    width: sp(isSmallScreen ? 46 : isLargeScreen ? 64 : 56),
    height: sp(isSmallScreen ? 46 : isLargeScreen ? 64 : 56),
    borderRadius: sp(isSmallScreen ? 23 : isLargeScreen ? 32 : 28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sp(8),
  },
  serviceTitle: {
    fontSize: nf(isSmallScreen ? 11 : 13),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: sp(3),
  },
  serviceDescription: {
    fontSize: nf(isSmallScreen ? 10 : 11),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
  },

  // ── FAB ──────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: sp(100),
    right: sp(20),
    width: sp(isSmallScreen ? 50 : 56),
    height: sp(isSmallScreen ? 50 : 56),
    borderRadius: sp(isSmallScreen ? 25 : 28),
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