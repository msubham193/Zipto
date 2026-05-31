import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTabBar from './BottomTabBar';
import { useAuthStore } from '../store/useAuthStore';
import { useLocationStore } from '../store/useLocationStore';
import { notificationApi } from '../api/client';
import { horizontalScale as hs, fontScale as fs, SCREEN_WIDTH } from '../utils/metrics';
import { HomeLocationSkeleton } from '../components/Skeleton';

// WMO weather codes that indicate precipitation (drizzle, rain, snow, showers, thunderstorm)
const RAIN_CODES = new Set([51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
// Re-poll weather on this cadence — weather changes even when the user doesn't move
const WEATHER_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
const WEATHER_FETCH_TIMEOUT_MS = 8000;

const sp = (n: number) => Math.round(hs(n));
const isSmallScreen = SCREEN_WIDTH <= 360;

// ─── Animated card wrapper ────────────────────────────────────────────────────
function ServiceCard({
  service,
  delayMs,
  onPress,
}: {
  service: { id: number; title: string; description: string; image: any };
  delayMs: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delayMs,
      withSpring(1, { damping: 14, stiffness: 120, mass: 0.8 }),
    );
    opacity.value = withDelay(
      delayMs,
      withTiming(1, { duration: 300 }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.serviceCard, animStyle]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[StyleSheet.absoluteFill, { padding: sp(11), justifyContent: 'space-between' }]}>
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
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
const Home = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  const { address, latitude, longitude, loading: locationLoading, hydrated, fetch: fetchLocation, isStale } = useLocationStore();
  const [isRaining, setIsRaining] = useState(false);
  const [showRider, setShowRider] = useState(true); // rides across screen center once on load

  // ── Animation shared values ──────────────────────────────────────────────
  // 1. Header
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-20);

  // 2. Hero banner
  const bannerOpacity = useSharedValue(0);
  const bannerScale = useSharedValue(0.95);

  // 3. Section title
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(15);

  // ── Trigger entrance on mount ────────────────────────────────────────────
  useEffect(() => {
    const ease = Easing.out(Easing.ease);
    const cubic = Easing.out(Easing.cubic);

    // 1. Header — 0ms
    headerOpacity.value = withTiming(1, { duration: 400, easing: ease });
    headerY.value = withTiming(0, { duration: 400, easing: ease });

    // 2. Hero banner — 150ms
    bannerOpacity.value = withDelay(150, withTiming(1, { duration: 450, easing: cubic }));
    bannerScale.value = withDelay(150, withTiming(1, { duration: 450, easing: cubic }));

    // 3. Section title — 280ms
    titleOpacity.value = withDelay(280, withTiming(1, { duration: 350, easing: ease }));
    titleY.value = withDelay(280, withTiming(0, { duration: 350, easing: ease }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animated styles ──────────────────────────────────────────────────────
  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const bannerAnimStyle = useAnimatedStyle(() => ({
    opacity: bannerOpacity.value,
    transform: [{ scale: bannerScale.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  // ── Location ─────────────────────────────────────────────────────────────
  // Wait for AsyncStorage hydration, then fetch only if no cached address or stale
  useEffect(() => {
    if (!hydrated) return;
    if (!address || isStale()) fetchLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Screen focus: silent background refresh only when stale (cached address stays visible)
  useEffect(() => {
    if (isFocused && hydrated && address && isStale()) fetchLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  // ── Weather → rain animation ──────────────────────────────────────────────
  // Driven by the user's real location via Open-Meteo (free, no API key).
  // Re-checks when coordinates change, when the screen refocuses, and on a
  // 10-min interval (weather can change while the user stays put).
  useEffect(() => {
    if (!latitude || !longitude) return;

    let cancelled = false;

    const checkWeather = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), WEATHER_FETCH_TIMEOUT_MS);
      try {
        // Ask for actual measured precipitation (mm) + condition code.
        // We trust the measured rain/showers/snow over the condition class,
        // since a thunderstorm code can be reported with zero precipitation.
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=precipitation,rain,showers,snowfall,weather_code`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (cancelled) return;

        const cur = data?.current ?? {};
        const precip = Number(cur.precipitation ?? 0);
        const rain = Number(cur.rain ?? 0);
        const showers = Number(cur.showers ?? 0);
        const snow = Number(cur.snowfall ?? 0);
        const code: number = cur.weather_code ?? -1;

        // Primary signal: any measurable precipitation right now.
        // Fallback: trust the condition code only if the API omits precip fields.
        const hasPrecipFields =
          cur.precipitation != null || cur.rain != null || cur.showers != null || cur.snowfall != null;
        const measuredWet = precip > 0 || rain > 0 || showers > 0 || snow > 0;
        const raining = hasPrecipFields ? measuredWet : RAIN_CODES.has(code);

        setIsRaining(raining);
      } catch {
        // Network/timeout — leave current state unchanged, next poll retries
      } finally {
        clearTimeout(timer);
      }
    };

    checkWeather(); // immediate check
    const interval = setInterval(checkWeather, WEATHER_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  // Re-subscribe when coordinates change or screen refocuses
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, isFocused]);

  // ── Notifications ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    notificationApi.getNotifications()
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setUnreadCount(list.filter((n: any) => !n.read).length);
      })
      .catch(() => {});
  }, [isAuthenticated, isFocused]);

  // ── Service data ──────────────────────────────────────────────────────────
  const services = useMemo(
    () => [
      {
        id: 1,
        title: 'Send Parcel',
        description: 'Parcels & packages',
        serviceCategory: 'send_packages',
        image: require('../assets/images/send_parcel.png'),
      },
      {
        id: 2,
        title: 'Move Goods',
        description: 'Goods & bulk items',
        serviceCategory: 'transport_goods',
        image: require('../assets/images/move_goods.png'),
      },
      {
        id: 3,
        title: 'Food Pickup',
        description: 'Pick upfrom any restaurant',
        serviceCategory: 'food_delivery',
        image: require('../assets/images/food_restaurant.png'),
      },
      {
        id: 4,
        title: 'Medicine Pickup',
        description: ' From any nearby pharmacy',
        serviceCategory: 'medicine',
        image: require('../assets/images/pharmacy_medicine.png'),
      },
    ],
    [],
  );

  const cardDelays = [360, 440, 520, 600];

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>

        {/* 1. Animated Header */}
        <Animated.View style={[{ paddingHorizontal: sp(16) }, headerAnimStyle]}>
          <View style={[styles.header, { overflow: 'hidden' }]}>
            {/* City skyline background — bottom-aligned to the header base */}
            <LottieView
              source={require('../assets/animations/header-bg.json')}
              style={styles.headerBg}
              autoPlay
              loop
              resizeMode="cover"
            />
            {/* Rain animation overlay — shows when weather API detects precipitation */}
            {isRaining && (
              <LottieView
                source={require('../assets/animations/rain.json')}
                style={StyleSheet.absoluteFillObject}
                autoPlay
                loop
                resizeMode="cover"
              />
            )}
            <View style={styles.headerTop}>
              <Text style={styles.ziptoText}>zipto</Text>
              <View style={styles.headerActions}>
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
              onPress={() => fetchLocation(true)}
              activeOpacity={0.6}
            >
              <MaterialIcons name="location-on" size={sp(20)} color="#1E3A8A" />
              {(!hydrated || (locationLoading && !address))
                ? <HomeLocationSkeleton />
                : <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                    {address || 'Tap to detect location'}
                  </Text>
              }
              <MaterialIcons
                name={locationLoading ? 'sync' : 'keyboard-arrow-down'}
                size={sp(20)}
                color="#1A1A1A"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* 2. Animated Hero Banner */}
          <Animated.View style={[styles.heroBanner, bannerAnimStyle]}>
            <Image
              source={require('../assets/images/banner.png')}
              style={styles.heroBannerImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* 3. Animated Section Title */}
          <Animated.View style={[styles.sectionTitleWrap, titleAnimStyle]}>
            <Text style={styles.servicesTitle}>What do you want us to pick up?</Text>
            <Text style={styles.servicesSubTitle}>We'll pick it up and deliver it to you</Text>
          </Animated.View>

          {/* 4. Staggered animated service cards */}
          <View style={styles.servicesGrid}>
            {services.map((service, i) => (
              <ServiceCard
                key={service.id}
                service={service}
                delayMs={cardDelays[i]}
                onPress={() =>
                  navigation.navigate('PickupDropSelection', {
                    serviceCategory: service.serviceCategory,
                  })
                }
              />
            ))}
          </View>

          {/* Info Banner (no separate animation — rides with scroll content) */}
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

      {/* 5. Fixed Bottom Tab */}
      <BottomTabBar />

      {/* Rider rides across the screen center once on load.
          Wrapped in a pointerEvents="none" View so the overlay never blocks
          taps on the bottom tab bar / content underneath. */}
      {showRider && (
        <View style={styles.riderOverlay} pointerEvents="none">
          <LottieView
            source={require('../assets/animations/rider.json')}
            style={StyleSheet.absoluteFillObject}
            autoPlay
            loop={false}
            resizeMode="contain"
            onAnimationFinish={() => setShowRider(false)}
          />
        </View>
      )}
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
    paddingBottom: sp(100),
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
  // City skyline animation anchored to the header's bottom edge.
  // aspectRatio matches the source (1920x1080) so the skyline sits flush at the
  // bottom; the rest overflows upward and is clipped by the header's overflow:hidden.
  headerBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    aspectRatio: 1920 / 1080,
    opacity: 0.9,
  },
  // Rider ride-across overlay — fills the screen, contain keeps the rider
  // vertically centered as it travels left→right across the middle.
  riderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp(12),
  },
  ziptoText: {
    fontSize: fs(32),
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
    fontSize: fs(14),
    fontFamily: 'Poppins-Medium',
    color: '#1A1A1A',
    maxWidth: sp(220),
  },

  // Hero Banner
  heroBanner: {
    marginBottom: sp(24),
    width: '100%',
    aspectRatio: 16 / 8,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: sp(16),
  },

  // Services
  sectionTitleWrap: {
    marginBottom: sp(16),
  },
  servicesTitle: {
    fontSize: fs(isSmallScreen ? 16 : 17),
    fontWeight: '800',
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: sp(2),
  },
  servicesSubTitle: {
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: sp(12),
    marginBottom: sp(24),
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: sp(16),
    height: sp(124),
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
    width: sp(40),
    height: sp(40),
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
    marginTop: sp(6),
  },
  serviceCardTitle: {
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
    color: '#0F172A',
    marginBottom: sp(1),
  },
  serviceDescription: {
    fontSize: fs(isSmallScreen ? 9 : 10),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    lineHeight: fs(isSmallScreen ? 12 : 14),
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
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
    color: '#1E293B',
  },
  infoDesc: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: sp(2),
  },
});

export default Home;
