import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { useBookingStore } from '../store/useBookingStore';
import { vehicleApi } from '../api/vehicle';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string; icon: string; pulse: boolean }
> = {
  pending:         { color: '#F59E0B', bg: '#FFFBEB', label: 'Finding your driver…',   icon: 'search',          pulse: true  },
  searching:       { color: '#F59E0B', bg: '#FFFBEB', label: 'Finding your driver…',   icon: 'search',          pulse: true  },
  accepted:        { color: '#2563EB', bg: '#EFF6FF', label: 'Driver assigned',         icon: 'directions-car',  pulse: false },
  driver_assigned: { color: '#2563EB', bg: '#EFF6FF', label: 'Driver assigned',         icon: 'directions-car',  pulse: false },
  arriving:        { color: '#059669', bg: '#ECFDF5', label: 'Driver is on the way',    icon: 'near-me',         pulse: true  },
  ongoing:         { color: '#7C3AED', bg: '#F5F3FF', label: 'Delivery in progress',    icon: 'local-shipping',  pulse: false },
  in_progress:     { color: '#7C3AED', bg: '#F5F3FF', label: 'Delivery in progress',    icon: 'local-shipping',  pulse: false },
};

const VEHICLE_ICONS: Record<string, string> = {
  bike:          'two-wheeler',
  auto:          'electric-rickshaw',
  mini_truck:    'local-shipping',
  tata_ace:      'local-shipping',
  pickup_truck:  'local-shipping',
  tempo:         'local-shipping',
};

const TERMINAL = ['completed', 'cancelled', 'expired'];
const POLL_INTERVAL = 8000;

// ─── Truncate address to first meaningful segment ─────────────────────────────
function shortAddress(addr: string): string {
  if (!addr) return '';
  const parts = addr.split(',');
  return parts[0].trim().slice(0, 22) || addr.slice(0, 22);
}

// ─── Component ────────────────────────────────────────────────────────────────
const ActiveBookingBanner: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { activeBooking, updateActiveBookingId, updateActiveBookingStatus, clearActiveBooking } =
    useBookingStore();

  // Animated values
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Slide-in on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Pulse animation (for searching / arriving) ──────────────────────────────
  const cfg = activeBooking
    ? STATUS_CONFIG[activeBooking.status] ?? STATUS_CONFIG.searching
    : STATUS_CONFIG.searching;

  useEffect(() => {
    if (!cfg.pulse) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cfg.pulse]);

  // ── Polling ─────────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!activeBooking) return;
    const { id, status } = activeBooking;
    if (TERMINAL.includes(status)) { clearActiveBooking(); return; }

    try {
      if (status === 'searching' || status === 'pending') {
        const res = await vehicleApi.getOfferStatus(id);
        const data = (res as any)?.data ?? res;
        if (data?.status === 'accepted' && data?.booking_id) {
          updateActiveBookingId(data.booking_id);
          updateActiveBookingStatus('accepted');
        } else if (data?.status === 'expired') {
          clearActiveBooking();
        }
      } else {
        const res = await vehicleApi.getBookingDetails(id);
        const booking = (res as any)?.data ?? res;
        if (!booking?.id) return;
        const s: string = (booking.status ?? '').toLowerCase();
        if (TERMINAL.includes(s)) {
          clearActiveBooking();
        } else {
          updateActiveBookingStatus(s);
        }
      }
    } catch {
      // silent — banner is best-effort
    }
  }, [activeBooking]);

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [poll]);

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!activeBooking || TERMINAL.includes(activeBooking.status)) return null;

  const vehicleIcon = VEHICLE_ICONS[activeBooking.vehicleType] ?? 'local-shipping';
  const fare = activeBooking.estimatedFare;

  const handlePress = () => {
    navigation.navigate('LiveTracking', {
      bookingId:     activeBooking.id,
      pickup:        activeBooking.pickup,
      drop:          activeBooking.drop,
      pickupCoords:  activeBooking.pickupCoords,
      dropCoords:    activeBooking.dropCoords,
      vehicleType:   activeBooking.vehicleType,
      fare:          activeBooking.estimatedFare,
      showBookingSuccess: false,
      paymentMethod: activeBooking.paymentMethod,
    });
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[styles.card, { borderLeftColor: cfg.color }]}
      >
        {/* Left: vehicle icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: cfg.color + '18' }]}>
          <MaterialIcons name={vehicleIcon} size={22} color={cfg.color} />
        </View>

        {/* Middle: status + route */}
        <View style={styles.middle}>
          <View style={styles.statusRow}>
            {cfg.pulse && (
              <Animated.View
                style={[
                  styles.dot,
                  { backgroundColor: cfg.color, transform: [{ scale: pulseAnim }] },
                ]}
              />
            )}
            {!cfg.pulse && (
              <View style={[styles.dot, styles.dotSolid, { backgroundColor: cfg.color }]} />
            )}
            <Text style={[styles.statusText, { color: cfg.color }]} numberOfLines={1}>
              {cfg.label}
            </Text>
          </View>
          <Text style={styles.routeText} numberOfLines={1}>
            {shortAddress(activeBooking.pickupAddress)}
            {'  →  '}
            {shortAddress(activeBooking.dropAddress)}
          </Text>
        </View>

        {/* Right: fare + chevron */}
        <View style={styles.right}>
          {fare > 0 && (
            <Text style={[styles.fare, { color: cfg.color }]}>
              ₹{Math.round(fare)}
            </Text>
          )}
          <MaterialIcons name="chevron-right" size={22} color={cfg.color} />
        </View>
      </TouchableOpacity>

      {/* Animated progress bar at bottom (searching only) */}
      {(activeBooking.status === 'searching' || activeBooking.status === 'pending') && (
        <ProgressBar color={cfg.color} />
      )}
    </Animated.View>
  );
};

// ─── Indeterminate progress bar ───────────────────────────────────────────────
const ProgressBar: React.FC<{ color: string }> = ({ color }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[styles.progressBar, { backgroundColor: color, transform: [{ translateX }] }]}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    gap: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSolid: {
    opacity: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.1,
  },
  routeText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  fare: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
  },
});

export default ActiveBookingBanner;
