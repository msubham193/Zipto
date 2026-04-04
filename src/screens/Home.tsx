import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { notificationApi } from '../api/client';
// import React, {
//   useState,
//   useRef,
//   useEffect,
//   useMemo,
//   useCallback,
// } from 'react';
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
  useColorScheme,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import BottomTabBar from './BottomTabBar';
import Spinner from '../components/Spinner';
import { useAuthStore } from '../store/useAuthStore';

// ─── Responsive Utilities ────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms = (size: number, factor = 0.45) =>
  size + (scaleW(size) - size) * factor;
const nf = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(ms(size)));
const sp = (size: number) => Math.round(scaleW(size));

const isSmallScreen = SCREEN_WIDTH <= 360;
const isLargeScreen = SCREEN_WIDTH >= 428;

// ─── Night mode map style (applied after 7 PM, before 6 AM) ─────────────────
const NIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
];

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 6; // 7 PM to 6 AM
}

// ─── Component ───────────────────────────────────────────────────────────────

const Home = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();

  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isServicesVisible, setIsServicesVisible] = useState(true);
  const [_locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);

  const { token, isAuthenticated } = useAuthStore();
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {return;}
    notificationApi.getNotifications()
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setUnreadCount(list.filter((n: any) => !n.read).length);
      })
      .catch(() => {});
  }, [isAuthenticated, isFocused]);
  const defaultCenter: [number, number] = [85.8245, 20.2961];

  // Use night style only when it's actually night time (not just device dark mode)
  const mapStyle = useMemo(() => (isNightTime() ? NIGHT_MAP_STYLE : []), []);

  const watchIdRef = useRef<number | null>(null);

  const startLocationTracking = useCallback(() => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const newLocation: [number, number] = [longitude, latitude];
        setUserLocation(newLocation);
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000,
          );
        }
      },
      error => console.log('Location error:', error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );

    // 100m distance filter — Home screen doesn't need fine-grained updates
    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]);
      },
      error => console.log('Error watching location:', error),
      { enableHighAccuracy: false, distanceFilter: 100 },
    );
    watchIdRef.current = watchId;
  }, []);

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
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startLocationTracking]);

  const services = useMemo(
    () => [
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
    ],
    [],
  );

  return (
    <View style={styles.container}>
      {/* ── Google Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation ? userLocation[1] : defaultCenter[1],
          longitude: userLocation ? userLocation[0] : defaultCenter[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onMapReady={() => setIsMapLoading(false)}
        showsUserLocation={false}
        toolbarEnabled={false}
        customMapStyle={mapStyle}
        userInterfaceStyle="light"
      >
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation[1],
              longitude: userLocation[0],
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.customMarker}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ── Main Content Overlay ── */}
      <SafeAreaView style={styles.mainOverlay} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.ziptoText}>Zipto</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Wallet')}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="account-balance-wallet" size={sp(isSmallScreen ? 22 : 26)} color="#3B82F6" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setUnreadCount(0);
                navigation.navigate('Notifications');
              }}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="notifications" size={sp(isSmallScreen ? 22 : 26)} color="#3B82F6" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        
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
    fontSize: nf(isSmallScreen ? 20 : 22), 
    // fontWeight: 'bold',
    fontFamily: 'Cocon-Regular',
    color: '#3B82F6',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  headerIconBtn: {
    width: sp(38),
    height: sp(38),
    borderRadius: sp(19),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
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

  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: sp(12),
    paddingVertical: sp(6),
    borderRadius: sp(20),
    gap: sp(4),
  },
  walletText: {
    fontSize: nf(13),
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
    fontWeight: '600',
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
