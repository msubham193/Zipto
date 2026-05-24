import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Image,
  PixelRatio,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { googleMapsApi as mapboxApi } from '../api/googleMaps';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTabBar from './BottomTabBar';
import { useAuthStore } from '../store/useAuthStore';
import { notificationApi } from '../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;
const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms = (size: number, factor = 0.45) => size + (scaleW(size) - size) * factor;
const nf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));
const sp = (size: number) => Math.round(scaleW(size));

const isSmallScreen = SCREEN_WIDTH <= 360;

const Home = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState('Locating...');

  const fetchLocation = async () => {
    setCurrentLocation('Locating...');
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Zipto needs access to your location to show accurate services.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setCurrentLocation('Location permission denied');
          return;
        }
      }
      
      Geolocation.getCurrentPosition(
        async position => {
          try {
            const { latitude, longitude } = position.coords;
            const address = await mapboxApi.reverseGeocode(latitude, longitude);
            
            // Check if address is the lat/lng fallback from googleMapsApi
            const isFallbackCoords = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(address?.trim());
            
            if (address && !isFallbackCoords) {
              const shortAddress = address.split(',').slice(0, 2).join(', ');
              setCurrentLocation(shortAddress);
            } else {
              setCurrentLocation('Current Location');
            }
          } catch (error) {
            console.log('Reverse geocode error:', error);
            setCurrentLocation('Current Location');
          }
        },
        error => {
          console.log('Geolocation error:', error);
          setCurrentLocation('Current Location');
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.warn(err);
      setCurrentLocation('Current Location');
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationApi.getNotifications()
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setUnreadCount(list.filter((n: any) => !n.read).length);
      })
      .catch(() => {});
  }, [isAuthenticated, isFocused]);

  const services = useMemo(
    () => [
      {
        id: 1,
        title: 'From Restaurant',
        description: 'Food from any restaurant',
        serviceCategory: 'food_delivery',
        image: require('../assets/images/food_restaurant.png'),
        bgColor: '#FFF5F0',
      },
      {
        id: 2,
        title: 'From Pharmacy',
        description: 'Medicines from any pharmacy',
        serviceCategory: 'medicine',
        image: require('../assets/images/pharmacy_medicine.png'),
        bgColor: '#F0FFF8',
      },
      {
        id: 3,
        title: 'Send Parcel',
        description: 'Parcels & packages',
        serviceCategory: 'send_packages',
        image: require('../assets/images/send_parcel.png'),
        bgColor: '#F3F4F6',
      },
      {
        id: 4,
        title: 'Move Goods',
        description: 'Goods & bulk items',
        serviceCategory: 'transport_goods',
        image: require('../assets/images/move_goods.png'),
        bgColor: '#EFF6FF',
      },
    ],
    [],
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
        {/* Sticky Header */}
        <View style={{ paddingHorizontal: sp(16) }}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.ziptoText}>zipto</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={styles.headerIconBtn} activeOpacity={0.7}>
                  <MaterialIcons name="account-balance-wallet" size={sp(isSmallScreen ? 20 : 22)} color="#1E3A8A" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setUnreadCount(0);
                    navigation.navigate('Notifications');
                  }}
                  style={styles.headerIconBtn}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="notifications" size={sp(isSmallScreen ? 20 : 22)} color="#1E3A8A" />
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
            <TouchableOpacity 
              style={styles.headerLocation} 
              onPress={fetchLocation}
              activeOpacity={0.6}
            >
              <MaterialIcons name="location-on" size={sp(20)} color="#1E3A8A" />
              <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                {currentLocation}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={sp(20)} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <Image 
              source={require('../assets/images/banner.png')} 
              style={styles.heroBannerImage} 
              resizeMode="contain" 
            />
          </View>

          {/* Services */}
          <View style={styles.servicesContainer}>
            <Text style={styles.servicesTitle}>What do you want us to pick up?</Text>
            <Text style={styles.servicesSubTitle}>We'll pick it up and deliver it to you</Text>
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
                  <View style={styles.serviceCardTop}>
                    <View style={styles.serviceImageContainer}>
                      <Image source={service.image} style={styles.serviceImage} resizeMode="contain" />
                    </View>
                    <View style={styles.serviceArrow}>
                      <MaterialIcons name="arrow-forward" size={sp(14)} color="#1A1A1A" />
                    </View>
                  </View>
                  <View style={styles.serviceCardBottom}>
                    <Text style={styles.serviceCardTitle} numberOfLines={1}>{service.title}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons name="verified-user" size={sp(18)} color="#1E3A8A" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>We only handle pickup & delivery.</Text>
              <Text style={styles.infoDesc}>Product quality is managed by the seller.</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Navigation */}
      <BottomTabBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: sp(16),
    paddingBottom: sp(100), // padding for bottom tab bar
  },
  
  // Header
  header: {
    marginTop: sp(10),
    marginBottom: sp(16),
    backgroundColor: '#FFFFFF',
    borderRadius: sp(12),
    padding: sp(12),
    borderWidth: 1,
    borderColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp(12),
  },
  ziptoText: {
    fontSize: nf(32),
    fontFamily: 'Cocon-Regular',
    color: '#0047C3', 
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  headerIconBtn: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  locationText: {
    fontSize: nf(14),
    fontFamily: 'Poppins-Medium',
    color: '#1A1A1A',
    maxWidth: sp(220),
  },

  // Hero Banner
  heroBanner: {
    marginBottom: sp(24),
    width: '100%',
    aspectRatio: 16 / 8, // Typical banner aspect ratio (2:1)
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: sp(16),
  },

  // Services
  servicesContainer: {
    marginBottom: sp(24),
  },
  servicesTitle: {
    fontSize: nf(isSmallScreen ? 18 : 20),
    fontWeight: '800',
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: sp(2),
  },
  servicesSubTitle: {
    fontSize: nf(isSmallScreen ? 13 : 14),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginBottom: sp(16),
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: sp(12),
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: sp(14),
    borderRadius: sp(16),
    height: sp(150),
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceImageContainer: {
    width: sp(48),
    height: sp(48),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: sp(12),
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceArrow: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(12),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCardBottom: {
    marginTop: sp(10),
  },
  serviceCardTitle: {
    fontSize: nf(isSmallScreen ? 13 : 14),
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
    color: '#0F172A',
    marginBottom: sp(2),
  },
  serviceDescription: {
    fontSize: nf(isSmallScreen ? 10 : 11),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    lineHeight: nf(isSmallScreen ? 14 : 16),
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8ECF0',
    borderRadius: sp(12),
    padding: sp(16),
    marginBottom: sp(24),
  },
  infoIconContainer: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(12),
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: nf(isSmallScreen ? 12 : 13),
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
    color: '#1E293B',
  },
  infoDesc: {
    fontSize: nf(isSmallScreen ? 11 : 12),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: sp(2),
  },
});

export default Home;
