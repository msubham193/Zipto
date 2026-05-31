import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  TextInput,
  Modal,
  Platform,
  InteractionManager,
} from 'react-native';
import LottieView from 'lottie-react-native';
import EnterView from '../components/EnterView';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Switch } from 'react-native';
import { vehicleApi, FareEstimateResponse, Coupon } from '../api/vehicle';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/metrics';
const sp = (n: number) => Math.round(hs(n));
const isSmallScreen = SCREEN_WIDTH <= 360;
const isLargeScreen = SCREEN_WIDTH >= 428;

// ─── Vehicle Image Map ────────────────────────────────────────────────────────
const VEHICLE_IMAGES: Record<string, any> = {
  bike: require('../assets/images/bike_img.png'),
  scooty: require('../assets/images/scooter_img.png'),
  auto: require('../assets/images/auto_img.png'),
  pickup: require('../assets/images/pickup_img.png'),
  mini_truck: require('../assets/images/truck_img.png'),
  tata_ace: require('../assets/images/vehicle3.png'),
  tata_407: require('../assets/images/vehicle3.png'),
};

// ─── Restricted Items List ────────────────────────────────────────────────────
const RESTRICTED_ITEMS = [
  'Pornographic Materials', 'Dry Ice',
  'Human Body Parts', 'Explosives',
  'Fire Arms', 'Flammables',
  'Livestock', 'Pets & Animals',
  'Dangerous Goods', 'Hazardous Goods',
  'Illegal Goods', 'Radioactive Materials',
  'Precious Jewelleries', 'Currencies & Coins',
  'Stones and Gems', 'Gambling Devices',
  'Lottery Tickets', 'Fire Extinguishers',
  'Cigarettes & Alcohols', 'Narcotics and Illegal Drugs',
];

// ─── Read Before Booking notes ────────────────────────────────────────────────
const BOOKING_NOTES = [
  'We deliver trust, not just packages.',
  'Please hand over properly packed items only.',
  'Delivery fare may update if route or stop changes during trip.',
  '15 mins loading/unloading time included for smooth delivery.',
  'Extra waiting time may attract additional charges.',
  'Parking, toll, or entry charges (if any) are customer payable.',
  'Fragile & valuable items should be informed before booking.',
  'Restricted or illegal items are strictly prohibited on Zipto.',
  'COD amount and parcel details must be accurate.',
  'Rider safety & respectful communication are mandatory.',
  'Once rider is assigned, cancellation charges may apply.',
  'Zipto moves your parcel with speed, safety & responsibility.',
];

// ─── Component ───────────────────────────────────────────────────────────────
const FareEstimate = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const paidBy = 'sender';
  const [estimateData, setEstimateData] = useState<FareEstimateResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driversAvailable, setDriversAvailable] = useState<boolean>(true);

  // Zipto Coins
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<LottieView>(null);

  const handleCoinsToggle = (value: boolean) => {
    setUseCoins(value);
    if (value) {
      setShowConfetti(true);
      confettiRef.current?.play();
    }
  };

  // Coupon
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; title: string; discount_amount: number;
  } | null>(null);
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  // GSTIN
  const [showGstInput, setShowGstInput] = useState(false);
  const [gstinNumber, setGstinNumber] = useState('');
  const [confirmedGstin, setConfirmedGstin] = useState('');

  // Restricted items modal
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);

  const { user } = useAuthStore();
  const { setActiveBooking } = useBookingStore();

  const {
    vehicle, pickup, drop, pickupCoords, dropCoords,
    city, serviceCategory, senderName, senderMobile,
    helperCount, helperCost,
    receiverName, receiverMobile, alternativePhone,
  } = route.params || {};

  const selectedVehicleType = vehicle?.vehicleType || 'bike';

  // ── Fetch fare estimate ─────────────────────────────────────────────────────
  const fetchFareEstimate = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!pickupCoords || !dropCoords) {
      setError('Location coordinates are required');
      setLoading(false);
      return;
    }
    if (!vehicle?.vehicleType) {
      setError('Vehicle type is required');
      setLoading(false);
      return;
    }

    const MAX_ATTEMPTS = 3;
    let lastError = 'Failed to calculate fare. Please try again.';

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise<void>(r => setTimeout(() => r(), 1500 * attempt));
      }
      try {
        const response = await vehicleApi.estimateFare({
          pickup_location: { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude, address: pickup || '' },
          drop_location: { latitude: dropCoords.latitude, longitude: dropCoords.longitude, address: drop || '' },
          vehicle_type: selectedVehicleType,
          number_of_helpers: helperCount || 0,
        });
        if (response.success && response.data) {
          setEstimateData(response.data);
          setDriversAvailable(response.data.drivers_available !== false);
          setLoading(false);
          return;
        }
        // API returned success:false — server-side logic error, no point retrying
        lastError = (response as any)?.message || 'Failed to get fare estimate';
        break;
      } catch (err: any) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        if (serverMsg) lastError = serverMsg;
        // If the server replied (4xx/5xx) it's not a transient network issue — stop
        if (err.response) break;
        // Otherwise it's a timeout / connection error — retry silently
      }
    }

    setError(lastError);
    setLoading(false);
  }, [pickupCoords, dropCoords, vehicle?.vehicleType, helperCount, pickup, drop, selectedVehicleType]);

  // Defer the network work until the screen-transition animation has finished.
  // The `loading` gate keeps the loader on screen meanwhile, so the page is
  // fully presented (and the transition stays smooth on low-end devices)
  // before we start estimating.
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchFareEstimate();
      vehicleApi.getCoinsBalance()
        .then(res => setCoinsBalance(res?.coins ?? 0))
        .catch(() => { });
    });
    return () => task.cancel();
  }, [fetchFareEstimate]);

  // ── Coupons ───────────────────────────────────────────────────────────────
  // Apply a coupon by code (validated against the live fare).
  const applyCoupon = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || !estimateData) return;
    try {
      setApplyingCode(code);
      const result = await vehicleApi.validateCoupon({
        code,
        order_value: estimateData.estimated_fare,
        vehicle_type: selectedVehicleType,
      });
      setAppliedCoupon({
        code: result.code,
        title: result.title,
        discount_amount: result.discount_amount,
      });
      setShowCouponSheet(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Invalid coupon';
      Alert.alert('Coupon Error', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setApplyingCode(null);
    }
  };

  const removeCoupon = () => setAppliedCoupon(null);

  // Open the "All Coupons" sheet and fetch the admin-managed list.
  const openCouponSheet = async () => {
    setShowCouponSheet(true);
    setCouponsLoading(true);
    try {
      const list = await vehicleApi.getCoupons(selectedVehicleType);
      setCoupons(list);
    } catch {
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  // Helpers for displaying a coupon
  const couponIconFor = (type: Coupon['type']): string =>
    type === 'free_delivery' ? 'local-shipping' : type === 'percentage' ? 'percent' : 'sell';

  const couponValueLabel = (c: Coupon): string => {
    if (c.type === 'free_delivery') return 'FREE';
    if (c.type === 'percentage') return `${Number(c.value)}%`;
    return `₹${Number(c.value)}`;
  };

  // ── Navigation helper ───────────────────────────────────────────────────────
  const navigateToTracking = (bookingId: string, showBookingSuccess = false) => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'LiveTracking',
          params: {
            bookingId, pickup: pickup || '', drop: drop || '',
            pickupCoords, dropCoords, vehicleType: selectedVehicleType,
            fare: Math.round((estimateData?.estimated_fare || 0) + (helperCost || 0)),
            showBookingSuccess, paidBy, helperCount, helperCost,
          },
        },
      ],
    });
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  // ── Confirm booking ─────────────────────────────────────────────────────────
  const handleConfirmBooking = async () => {
    try {
      setBookingLoading(true);
      const bookingData = {
        name: senderName || user?.name || '',
        mobile_number: senderMobile || user?.phone || '',
        city: city || 'Bhubaneswar',
        service_category: serviceCategory || 'send_packages',
        pickup_location: { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude, address: pickup || '' },
        drop_location: { latitude: dropCoords.latitude, longitude: dropCoords.longitude, address: drop || '' },
        vehicle_type: selectedVehicleType,
        booking_type: 'instant' as const,
        number_of_helpers: helperCount || 0,
        receiver_name: receiverName || undefined,
        receiver_phone: receiverMobile || undefined,
        alternative_phone: alternativePhone || undefined,
        paid_by: paidBy as 'sender' | 'receiver',
        coins_to_redeem: useCoins ? COINS_PER_REDEMPTION : 0,
        coupon_code: appliedCoupon?.code || undefined,
      };
      console.log('📦 [FareEstimate] Booking payload:', JSON.stringify({
        receiver_name: bookingData.receiver_name,
        receiver_phone: bookingData.receiver_phone,
        mobile_number: bookingData.mobile_number,
        receiverMobile_raw: receiverMobile,
      }));
      const bookingResponse = await vehicleApi.createBooking(bookingData as any);
      if (!bookingResponse.success) {
        const raw = bookingResponse.message;
        const msg = Array.isArray(raw) ? raw.join('\n') : (raw || 'Failed to create booking. Please try again.');
        Alert.alert('Booking Failed', msg);
        return;
      }
      const bookingId = bookingResponse.data?.booking_id || bookingResponse.data?.id;
      setActiveBooking({
        id: bookingId,
        status: 'searching',
        pickupAddress: pickup || '',
        dropAddress: drop || '',
        vehicleType: selectedVehicleType,
        estimatedFare: totalFare,
        pickup: pickup || '',
        drop: drop || '',
        pickupCoords,
        dropCoords,
        paidBy,
      });
      navigateToTracking(bookingId, false);
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.';
      const msg = Array.isArray(raw) ? raw.join('\n') : String(raw);
      Alert.alert('Error', msg);
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Calculating best fare...</Text>
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
        <Icon name="error-outline" size={sp(48)} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFareEstimate} activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Retry Estimation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── No Drivers Available state ───────────────────────────────────────────────
  if (!driversAvailable && estimateData) {
    return (
      <View style={[styles.noDriversRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

        {/* Back button */}
        <TouchableOpacity
          style={styles.noDriversBack}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={sp(20)} color="#111827" />
        </TouchableOpacity>

        {/* Hero image */}
        <View style={styles.noDriversHeroWrap}>
          <Image
            source={require('../assets/images/rider.png')}
            style={styles.noDriversHeroImg}
            resizeMode="cover"
          />
        </View>

        {/* Title */}
        <Text style={styles.noDriversTitle}>
          {'Oops! '}
          <Text style={styles.noDriversTitleAccent}>No Riders </Text>
          {'Available Right Now'}
        </Text>

        {/* Subtitle */}
        <Text style={styles.noDriversSub}>
          No active ZIPTO riders near your pickup right now. Try again or change your location.
        </Text>

        {/* Tip cards */}
        <View style={styles.noDriversTipCard}>
          <View style={styles.noDriversTipRow}>
            <View style={styles.noDriversTipIconBox}>
              <Icon name="access-time" size={sp(17)} color="#2563EB" />
            </View>
            <View style={styles.noDriversTipTextCol}>
              <Text style={styles.noDriversTipTitle}>Riders come online throughout the day.</Text>
              <Text style={styles.noDriversTipBody}>Please check again in a few minutes.</Text>
            </View>
          </View>
          <View style={styles.noDriversTipDivider} />
          <View style={styles.noDriversTipRow}>
            <View style={styles.noDriversTipIconBox}>
              <Icon name="location-on" size={sp(17)} color="#2563EB" />
            </View>
            <View style={styles.noDriversTipTextCol}>
              <Text style={styles.noDriversTipTitle}>Changing your pickup location</Text>
              <Text style={styles.noDriversTipBody}>may help you find a rider faster.</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.noDriversActions}>
          <TouchableOpacity style={styles.noDriversRetryBtn} onPress={fetchFareEstimate} activeOpacity={0.85}>
            <Icon name="refresh" size={sp(17)} color="#FFFFFF" />
            <Text style={styles.noDriversRetryText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.noDriversChangeBtn}
            onPress={() => navigation.navigate('PickupDropSelection', { serviceCategory })}
            activeOpacity={0.85}
          >
            <Icon name="location-on" size={sp(17)} color="#2563EB" />
            <Text style={styles.noDriversChangeText}>Change Location</Text>
          </TouchableOpacity>

        </View>
      </View>
    );
  }

  const breakdown = estimateData?.breakdown;
  const baseFare = Math.round((estimateData?.estimated_fare || 0) + (helperCost || 0));
  const COINS_PER_REDEMPTION = 100;
  const RUPEES_PER_REDEMPTION = 2;
  const coinDiscount = useCoins ? RUPEES_PER_REDEMPTION : 0;
  const couponDiscount = appliedCoupon?.discount_amount ?? 0;
  const totalFare = Math.max(0, baseFare - coinDiscount - couponDiscount);
  const surgeMultiplier = breakdown?.surge_multiplier || 1;
  const hasSurge = surgeMultiplier > 1;
  const surgeExtra = hasSurge && breakdown?.subtotal
    ? Math.round((estimateData?.estimated_fare || 0) - breakdown.subtotal)
    : 0;

  const getSurgeLabel = (multiplier: number): string => {
    if (multiplier >= 1.6) return 'Peak Hour Surge';
    if (multiplier >= 1.4) return 'High Demand Surge';
    if (multiplier >= 1.3) return 'Moderate Surge';
    return 'Light Surge';
  };

  const getSurgeReason = (multiplier: number): string => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 10) return 'Morning rush hour (8–10 AM)';
    if (hour >= 18 && hour < 21) return 'Evening rush hour (6–9 PM)';
    if (multiplier >= 1.4) return 'Very high booking demand';
    return 'Higher than usual demand';
  };

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backBtnRound}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
        >
          <Icon name="arrow-back" size={sp(20)} color="#111111" />
        </TouchableOpacity>
        <Text style={styles.headerTitleLarge}>Fare Estimate</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Route Card ── */}
        <EnterView delay={40} style={styles.card}>
          <View style={styles.vehicleInfoRow}>
            <Image
              source={
                vehicle?.vehicleType
                  ? VEHICLE_IMAGES[vehicle.vehicleType.toLowerCase()]
                  : VEHICLE_IMAGES.bike
              }
              style={styles.vehicleImage}
              resizeMode="contain"
            />
            <View style={styles.vehicleTextWrapper}>
              <Text style={styles.vehicleName} numberOfLines={1}>
                {vehicle?.name || 'Vehicle'}
              </Text>
              <Text style={styles.vehicleCapacity} numberOfLines={1}>
                {vehicle?.capacity}
              </Text>
            </View>
          </View>
          <View style={styles.routeContainer}>
            <View style={styles.timelineContainer}>
              <View style={[styles.dot, styles.pickupDot]} />
              <View style={styles.line} />
              <View style={[styles.dot, styles.dropDot]} />
            </View>
            <View style={styles.addressContainer}>
              <View style={styles.addressItem}>
                <View style={styles.addressLabelRow}>
                  <Icon name="trip-origin" size={sp(10)} color="#2563EB" />
                  <Text style={styles.label}>Pickup</Text>
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {pickup || 'Current Location'}
                </Text>
              </View>
              <View style={styles.addressItem}>
                <View style={styles.addressLabelRow}>
                  <Icon name="place" size={sp(10)} color="#059669" />
                  <Text style={styles.label}>Drop-off</Text>
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {drop || 'Select Destination'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="schedule" size={sp(16)} color="#6B7280" />
              <Text style={styles.statText}>
                {estimateData?.duration ? Math.round(estimateData.duration) : 0} mins
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="place" size={sp(16)} color="#6B7280" />
              <Text style={styles.statText}>
                {estimateData?.distance ? estimateData.distance.toFixed(2) : 0} km
              </Text>
            </View>
          </View>
        </EnterView>

        {/* ── Surge Banner ── */}
        {hasSurge && (
          <View style={styles.surgeBanner}>
            <View style={styles.surgeBannerLeft}>
              <Icon name="bolt" size={sp(16)} color="#B91C1C" />
              <View style={styles.surgeBannerText}>
                <Text style={styles.surgeBannerTitle}>{getSurgeLabel(surgeMultiplier)}</Text>
                <Text style={styles.surgeBannerReason}>{getSurgeReason(surgeMultiplier)}</Text>
              </View>
            </View>
            <View style={styles.surgeBadge}>
              <Text style={styles.surgeBadgeText}>{surgeMultiplier}x</Text>
            </View>
          </View>
        )}

        {/* ── Fare Breakdown Card ── */}
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: '#2563EB' }]}>
            <Icon name="receipt-long" size={sp(13)} color="#FFFFFF" />
          </View>
          <Text style={styles.sectionTitle}>Fare Breakdown</Text>
        </View>
        <EnterView delay={120} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <View style={[styles.rowIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="home" size={sp(13)} color="#2563EB" />
              </View>
              <Text style={styles.rowLabel}>Base Fare</Text>
            </View>
            <Text style={styles.rowValue}>₹{breakdown?.base_fare || 0}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <View style={[styles.rowIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="route" size={sp(13)} color="#059669" />
              </View>
              <Text style={styles.rowLabel}>Distance Charge</Text>
            </View>
            <Text style={styles.rowValue}>₹{breakdown?.distance_charge || 0}</Text>
          </View>
          {(breakdown?.platform_fee || 0) > 0 && (
            <View style={styles.row}>
              <View style={styles.rowLabelWrap}>
                <View style={[styles.rowIconBox, { backgroundColor: '#F5F3FF' }]}>
                  <Icon name="verified-user" size={sp(13)} color="#7C3AED" />
                </View>
                <Text style={styles.rowLabel}>Platform Fee</Text>
              </View>
              <Text style={styles.rowValue}>
                ₹{((breakdown?.platform_fee || 0) + (breakdown?.platform_fee_gst || 0)).toFixed(0)}
              </Text>
            </View>
          )}
          {hasSurge && (
            <>
              <View style={styles.row}>
                <View style={styles.rowLabelWrap}>
                  <View style={[styles.rowIconBox, { backgroundColor: '#F9FAFB' }]}>
                    <Icon name="calculate" size={sp(13)} color="#6B7280" />
                  </View>
                  <Text style={styles.rowLabel}>Subtotal (before surge)</Text>
                </View>
                <Text style={styles.rowValue}>₹{breakdown?.subtotal || 0}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.rowLabelWrap}>
                  <View style={[styles.rowIconBox, { backgroundColor: '#FFF1F2' }]}>
                    <Icon name="bolt" size={sp(13)} color="#DC2626" />
                  </View>
                  <Text style={[styles.rowLabel, styles.surgeRowLabel]}>
                    Surge ({surgeMultiplier}x · +{Math.round((surgeMultiplier - 1) * 100)}%)
                  </Text>
                </View>
                <Text style={[styles.rowValue, styles.surgeRowValue]}>+₹{surgeExtra}</Text>
              </View>
            </>
          )}
          {(helperCount || 0) > 0 && (
            <View style={styles.row}>
              <View style={styles.rowLabelWrap}>
                <View style={[styles.rowIconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Icon name="people" size={sp(13)} color="#EA580C" />
                </View>
                <Text style={styles.rowLabel}>Labour Charge ({helperCount}x)</Text>
              </View>
              <Text style={styles.rowValue}>₹{helperCost || 0}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <View style={styles.rowLabelWrap}>
              <View style={[styles.rowIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="payments" size={sp(13)} color="#16A34A" />
              </View>
              <Text style={styles.totalLabel}>Subtotal</Text>
            </View>
            <Text style={styles.totalValue}>₹{baseFare}</Text>
          </View>
          {useCoins && coinDiscount > 0 && (
            <View style={[styles.row, { marginTop: vs(4) }]}>
              <View style={styles.coinDiscountLabel}>
                <Icon name="toll" size={sp(14)} color="#D97706" />
                <Text style={styles.coinDiscountText}>Coins Discount (100 coins)</Text>
              </View>
              <Text style={styles.coinDiscountValue}>−₹{coinDiscount.toFixed(2)}</Text>
            </View>
          )}
          {appliedCoupon && couponDiscount > 0 && (
            <View style={[styles.row, { marginTop: vs(4) }]}>
              <View style={styles.coinDiscountLabel}>
                <Icon name="local-offer" size={sp(14)} color="#16A34A" />
                <Text style={[styles.coinDiscountText, { color: '#16A34A' }]}>
                  Coupon ({appliedCoupon.code})
                </Text>
              </View>
              <Text style={[styles.coinDiscountValue, { color: '#16A34A' }]}>
                −₹{couponDiscount}
              </Text>
            </View>
          )}
          {((useCoins && coinDiscount > 0) || (appliedCoupon && couponDiscount > 0)) && (
            <>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <View style={styles.rowLabelWrap}>
                  <View style={[styles.rowIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Icon name="account-balance-wallet" size={sp(13)} color="#16A34A" />
                  </View>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                </View>
                <Text style={[styles.totalValue, { color: '#16A34A' }]}>₹{totalFare}</Text>
              </View>
            </>
          )}
        </EnterView>

        {/* ── Zipto Coins ── */}
        {coinsBalance >= 100 && (
          <>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#F59E0B' }]}>
                <Icon name="toll" size={sp(13)} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Zipto Coins</Text>
            </View>
            <View style={styles.coinsCard}>
              <View style={styles.coinsCardLeft}>
                <View style={styles.coinsIconBox}>
                  <Icon name="toll" size={sp(22)} color="#D97706" />
                </View>
                <View style={styles.coinsTextBlock}>
                  <Text style={styles.coinsTitle}>
                    You have <Text style={styles.coinsBold}>{coinsBalance} coins</Text>
                  </Text>
                  <Text style={styles.coinsSub}>Use 100 coins → get ₹2 off</Text>
                </View>
              </View>
              <Switch
                value={useCoins}
                onValueChange={handleCoinsToggle}
                trackColor={{ false: '#E5E7EB', true: '#FDE68A' }}
                thumbColor={useCoins ? '#F59E0B' : '#9CA3AF'}
              />
            </View>
          </>
        )}

        {/* ── Coupons ── */}
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: '#16A34A' }]}>
            <Icon name="local-offer" size={sp(13)} color="#FFFFFF" />
          </View>
          <Text style={styles.sectionTitle}>Coupons</Text>
        </View>
        {appliedCoupon ? (
          <View style={styles.couponApplied}>
            <View style={styles.couponAppliedLeft}>
              <View style={styles.couponAppliedTicket}>
                <Icon name="confirmation-number" size={sp(18)} color="#16A34A" />
              </View>
              <View style={{ marginLeft: sp(10), flex: 1 }}>
                <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                <Text style={styles.couponAppliedTitle} numberOfLines={1}>{appliedCoupon.title}</Text>
              </View>
            </View>
            <View style={styles.couponAppliedRight}>
              <Text style={styles.couponAppliedSaving}>−₹{appliedCoupon.discount_amount}</Text>
              <TouchableOpacity
                onPress={removeCoupon}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={sp(18)} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.viewCouponsBtn} onPress={openCouponSheet} activeOpacity={0.8}>
            <View style={styles.viewCouponsLeft}>
              <View style={styles.viewCouponsIcon}>
                <Icon name="local-offer" size={sp(18)} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.viewCouponsTitle}>View All Coupons</Text>
                <Text style={styles.viewCouponsSub}>Tap to see offers & save instantly</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={sp(22)} color="#16A34A" />
          </TouchableOpacity>
        )}

        {/* ── GSTIN ── */}
        <View style={styles.gstCard}>
          <View style={styles.gstRow}>
            <View style={styles.gstLabelWrap}>
              <Icon name="receipt" size={sp(16)} color="#2563EB" />
              <Text style={styles.gstLabel}>Have a GST number?</Text>
            </View>
            {!confirmedGstin && (
              <TouchableOpacity
                style={[styles.gstBtn, showGstInput && styles.gstBtnActive]}
                onPress={() => {
                  setShowGstInput(prev => !prev);
                  if (showGstInput) setGstinNumber('');
                }}
                activeOpacity={0.75}
              >
                <Icon
                  name={showGstInput ? 'close' : 'add'}
                  size={sp(14)}
                  color={showGstInput ? '#6B7280' : '#2563EB'}
                />
                <Text style={[styles.gstBtnText, showGstInput && styles.gstBtnTextActive]}>
                  {showGstInput ? 'Remove' : 'Add GSTIN'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Input row — shown when not yet confirmed */}
          {showGstInput && !confirmedGstin && (
            <View style={styles.gstInputWrap}>
              <View style={styles.gstInputRow}>
                <TextInput
                  style={styles.gstInput}
                  placeholder="Enter GSTIN (e.g. 22AAAAA0000A1Z5)"
                  placeholderTextColor="#9CA3AF"
                  value={gstinNumber}
                  onChangeText={t => setGstinNumber(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  autoCapitalize="characters"
                  maxLength={15}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.gstConfirmBtn,
                    gstinNumber.length !== 15 && styles.gstConfirmBtnDisabled,
                  ]}
                  activeOpacity={gstinNumber.length === 15 ? 0.8 : 1}
                  disabled={gstinNumber.length !== 15}
                  onPress={() => {
                    setConfirmedGstin(gstinNumber);
                    setShowGstInput(false);
                  }}
                >
                  <Text style={styles.gstConfirmBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
              {gstinNumber.length > 0 && gstinNumber.length < 15 && (
                <Text style={styles.gstHint}>{15 - gstinNumber.length} characters remaining</Text>
              )}
            </View>
          )}

          {/* Confirmed state */}
          {confirmedGstin ? (
            <View style={styles.gstConfirmedRow}>
              <Icon name="check-circle" size={sp(16)} color="#16A34A" />
              <Text style={styles.gstConfirmedText} numberOfLines={1}>
                {confirmedGstin}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setConfirmedGstin('');
                  setGstinNumber('');
                  setShowGstInput(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={sp(16)} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* ── NEW: Do Not Send Restricted Items highlight card ── */}
        <TouchableOpacity
          style={styles.restrictedHighlight}
          onPress={() => setShowRestrictedModal(true)}
          activeOpacity={0.82}
        >
          <View style={styles.restrictedHighlightLeft}>
            <View style={styles.restrictedHighlightIconBox}>
              <Icon name="do-not-disturb" size={sp(22)} color="#DC2626" />
            </View>
            <View style={styles.restrictedHighlightTextBlock}>
              <Text style={styles.restrictedHighlightTitle}>Do Not Send Restricted Items</Text>
              <Text style={styles.restrictedHighlightSub}>Tap to view prohibited items list</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={sp(20)} color="#DC2626" />
        </TouchableOpacity>

        {/* ── Read Before Booking ── */}
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: '#EA580C' }]}>
            <Icon name="menu-book" size={sp(13)} color="#FFFFFF" />
          </View>
          <Text style={styles.sectionTitle}>Read Before Booking</Text>
        </View>
        <View style={styles.notesCard}>
          {BOOKING_NOTES.map((note, idx) => (
            <View key={idx} style={styles.noteRow}>
              <Icon name="check-circle" size={sp(14)} color="#10B981" style={styles.noteIcon} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, vs(14)) }]}>
        <View style={styles.priceContainer}>
          <Text style={styles.finalPriceLabel}>
            {(coinDiscount > 0 || couponDiscount > 0) ? 'Payable (after discounts)' : 'Total Fare'}
          </Text>
          {(coinDiscount > 0 || couponDiscount > 0) && (
            <Text style={styles.finalPriceStrike}>₹{baseFare}</Text>
          )}
          <Text
            style={[
              styles.finalPrice,
              (coinDiscount > 0 || couponDiscount > 0) && { color: '#16A34A' },
            ]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            ₹{totalFare}
          </Text>
        </View>
        <Button
          title="Book Now"
          onPress={handleConfirmBooking}
          style={styles.bookButton}
          textStyle={styles.bookButtonText}
          loading={bookingLoading}
        />
      </View>

      {/* ── Confetti overlay — fires when coins are enabled ── */}
      {showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LottieView
            ref={confettiRef}
            source={require('../assets/animations/confetti.json')}
            style={StyleSheet.absoluteFill}
            autoPlay
            loop={false}
            renderMode="HARDWARE"
            cacheComposition
            resizeMode="cover"
            onAnimationFinish={() => setShowConfetti(false)}
          />
        </View>
      )}

      {/* ── Restricted Items Bottom Sheet Modal ── */}
      <Modal
        visible={showRestrictedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRestrictedModal(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRestrictedModal(false)}
        >
          <TouchableOpacity
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, vs(20)) },
            ]}
            activeOpacity={1}
            onPress={() => { }}
          >
            {/* Drag handle */}
            <View style={styles.modalHandle} />

            {/* Header row */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Restricted Items</Text>
              <TouchableOpacity
                onPress={() => setShowRestrictedModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={sp(20)} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Warning banner */}
            <View style={styles.modalWarningBanner}>
              <View style={styles.modalWarningTextWrap}>
                <Text style={styles.modalWarningText}>
                  Your order should not contain any of these restricted items
                </Text>
              </View>
              <View style={styles.modalWarningIcon}>
                <Icon name="inventory-2" size={sp(40)} color="#D97706" />
                <View style={styles.modalWarningBadge}>
                  <Icon name="do-not-disturb" size={sp(18)} color="#DC2626" />
                </View>
              </View>
            </View>

            {/* Items grid — two columns */}
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.restrictedGrid}>
                {Array.from({ length: Math.ceil(RESTRICTED_ITEMS.length / 2) }, (_, i) => (
                  <View key={i} style={styles.restrictedGridRow}>
                    <View style={styles.restrictedGridCol}>
                      <View style={styles.restrictedBullet} />
                      <Text style={styles.restrictedItem}>{RESTRICTED_ITEMS[i * 2]}</Text>
                    </View>
                    {RESTRICTED_ITEMS[i * 2 + 1] && (
                      <View style={styles.restrictedGridCol}>
                        <View style={styles.restrictedBullet} />
                        <Text style={styles.restrictedItem}>{RESTRICTED_ITEMS[i * 2 + 1]}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* CTA */}
            <TouchableOpacity
              style={styles.modalOkBtn}
              onPress={() => setShowRestrictedModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalOkBtnText}>Okay, Understood</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── All Coupons Bottom Sheet ── */}
      <Modal
        visible={showCouponSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCouponSheet(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCouponSheet(false)}
        >
          <TouchableOpacity
            style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, vs(20)) }]}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Coupons</Text>
              <TouchableOpacity
                onPress={() => setShowCouponSheet(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={sp(20)} color="#374151" />
              </TouchableOpacity>
            </View>

            {couponsLoading ? (
              <View style={styles.couponSheetLoading}>
                <ActivityIndicator size="large" color="#16A34A" />
                <Text style={styles.couponSheetLoadingText}>Loading coupons…</Text>
              </View>
            ) : !Array.isArray(coupons) || coupons.length === 0 ? (
              <View style={styles.couponSheetEmpty}>
                <Icon name="local-offer" size={sp(44)} color="#D1D5DB" />
                <Text style={styles.couponSheetEmptyText}>No coupons available right now</Text>
                <Text style={styles.couponSheetEmptySub}>Check back soon for new offers</Text>
              </View>
            ) : (
              <ScrollView style={styles.couponSheetScroll} showsVerticalScrollIndicator={false}>
                {coupons.map(c => {
                  const applying = applyingCode === c.code;
                  const belowMin = !!estimateData && estimateData.estimated_fare < Number(c.min_order_value);
                  const eligible = !belowMin;
                  return (
                    <View key={c.id} style={[styles.couponCard, !eligible && styles.couponCardDisabled]}>
                      {/* Left value stub */}
                      <View style={[styles.couponStub, !eligible && styles.couponStubDisabled]}>
                        <Icon name={couponIconFor(c.type)} size={sp(20)} color={eligible ? '#16A34A' : '#9CA3AF'} />
                        <Text style={[styles.couponStubValue, !eligible && styles.couponTextMuted]}>{couponValueLabel(c)}</Text>
                        <Text style={[styles.couponStubOff, !eligible && styles.couponTextMuted]}>OFF</Text>
                      </View>

                      {/* Perforation */}
                      <View style={styles.couponPerforation}>
                        <View style={styles.couponNotchTop} />
                        <View style={styles.couponDashes} />
                        <View style={styles.couponNotchBottom} />
                      </View>

                      {/* Details */}
                      <View style={styles.couponBody}>
                        <View style={styles.couponBodyText}>
                          <View style={styles.couponCodeRow}>
                            <View style={[styles.couponCodePill, !eligible && styles.couponCodePillDisabled]}>
                              <Text style={[styles.couponCodePillText, !eligible && styles.couponTextMuted]}>{c.code}</Text>
                            </View>
                            <Text style={[styles.couponCardTitle, !eligible && styles.couponTextMuted]} numberOfLines={1}>{c.title}</Text>
                          </View>
                          {!!c.description && (
                            <Text style={styles.couponCardDesc} numberOfLines={1}>{c.description}</Text>
                          )}
                          {!eligible ? (
                            <Text style={styles.couponIneligibleText}>
                              Add ₹{Math.ceil(Number(c.min_order_value) - (estimateData?.estimated_fare ?? 0))} more to use this
                            </Text>
                          ) : Number(c.min_order_value) > 0 ? (
                            <Text style={styles.couponMinText}>Min. order ₹{Number(c.min_order_value)}</Text>
                          ) : null}
                        </View>

                        <TouchableOpacity
                          style={[styles.couponApplyPill, (!eligible || applying) && styles.couponApplyPillDisabled]}
                          onPress={() => applyCoupon(c.code)}
                          disabled={!eligible || applying}
                          activeOpacity={0.85}
                        >
                          {applying ? (
                            <ActivityIndicator size="small" color="#16A34A" />
                          ) : (
                            <Text style={[styles.couponApplyPillText, !eligible && styles.couponApplyPillTextDisabled]}>
                              APPLY
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const GUTTER = hs(16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingTop: vs(14),
    paddingBottom: vs(14),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    gap: hs(10),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtnRound: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    flexShrink: 0,
  },
  headerTitleLarge: {
    flex: 1,
    fontSize: fs(isSmallScreen ? 18 : 20),
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.3,
  },
  headerRightSpacer: {
    width: sp(36),
    flexShrink: 0,
  },

  // ── Scroll content ──
  content: {
    padding: GUTTER,
    paddingBottom: sp(100),
    backgroundColor: '#F9FAFB',
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sp(16),
    padding: sp(isSmallScreen ? 12 : 16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: fs(isSmallScreen ? 14 : 15),
    fontWeight: '700',
    color: '#111827',
  },

  // ── Vehicle row ──
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sp(16),
    paddingBottom: sp(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vehicleImage: {
    width: sp(isSmallScreen ? 50 : isLargeScreen ? 72 : 60),
    height: sp(isSmallScreen ? 34 : isLargeScreen ? 48 : 40),
    marginRight: sp(12),
    flexShrink: 0,
  },
  vehicleTextWrapper: { flex: 1 },
  vehicleName: {
    fontSize: fs(isSmallScreen ? 14 : 16),
    fontWeight: '600',
    color: '#1F2937',
  },
  vehicleCapacity: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    color: '#6B7280',
    marginTop: sp(2),
  },

  // ── Route timeline ──
  routeContainer: {
    flexDirection: 'row',
    marginBottom: sp(14),
  },
  timelineContainer: {
    alignItems: 'center',
    marginRight: sp(12),
    paddingVertical: sp(4),
    width: sp(14),
  },
  dot: {
    width: sp(12),
    height: sp(12),
    borderRadius: sp(6),
    borderWidth: 2,
  },
  pickupDot: { borderColor: '#2563EB', backgroundColor: '#FFFFFF' },
  dropDot: { borderColor: '#059669', backgroundColor: '#059669' },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: sp(4),
    minHeight: sp(24),
  },
  addressContainer: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: sp(80),
  },
  addressItem: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: sp(2),
  },
  label: {
    fontSize: fs(isSmallScreen ? 10 : 12),
    color: '#6B7280',
  },
  addressText: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    fontWeight: '400',
    color: '#374151',
    lineHeight: fs(isSmallScreen ? 15 : 17),
  },

  // ── Stats row ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: sp(8),
    padding: sp(isSmallScreen ? 10 : 12),
    marginTop: sp(6),
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(6),
  },
  statText: {
    fontSize: fs(isSmallScreen ? 12 : 14),
    fontWeight: '500',
    color: '#4B5563',
  },
  statDivider: {
    width: 1,
    height: sp(20),
    backgroundColor: '#D1D5DB',
  },

  // ── Breakdown rows ──
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sp(10),
    flexWrap: 'nowrap',
    gap: sp(8),
  },
  rowLabel: {
    fontSize: fs(isSmallScreen ? 12 : 14),
    color: '#6B7280',
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  rowValue: {
    fontSize: fs(isSmallScreen ? 12 : 14),
    fontWeight: '500',
    color: '#111827',
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: sp(10),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: sp(8),
  },
  totalLabel: {
    fontSize: fs(isSmallScreen ? 14 : 16),
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: fs(isSmallScreen ? 18 : 20),
    fontWeight: '700',
    color: '#2563EB',
    flexShrink: 0,
  },

  // ── Surge banner ──
  surgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    borderRadius: sp(12),
    paddingVertical: sp(10),
    paddingHorizontal: sp(14),
    marginTop: sp(12),
    marginBottom: sp(4),
    gap: sp(10),
  },
  surgeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    flex: 1,
  },
  surgeBannerText: { flex: 1, gap: sp(2) },
  surgeBannerTitle: {
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontWeight: '700',
    color: '#B91C1C',
  },
  surgeBannerReason: {
    fontSize: fs(isSmallScreen ? 10 : 11),
    color: '#6B7280',
  },
  surgeBadge: {
    backgroundColor: '#B91C1C',
    borderRadius: sp(6),
    paddingHorizontal: sp(8),
    paddingVertical: sp(3),
    flexShrink: 0,
  },
  surgeBadgeText: {
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  surgeRowLabel: { color: '#B91C1C', fontWeight: '500' },
  surgeRowValue: { color: '#B91C1C', fontWeight: '700' },

  // ── Coin discount ──
  coinDiscountLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  coinDiscountText: {
    fontSize: fs(13),
    color: '#D97706',
    fontWeight: '500',
  },
  coinDiscountValue: {
    fontSize: fs(13),
    color: '#D97706',
    fontWeight: '600',
  },

  // ── Coins card ──
  coinsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    paddingHorizontal: sp(14),
    paddingVertical: vs(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(8),
  },
  coinsCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: sp(10),
  },
  coinsIconBox: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(10),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinsTextBlock: { flex: 1 },
  coinsTitle: {
    fontSize: fs(13),
    color: '#374151',
    fontWeight: '500',
  },
  coinsBold: { color: '#D97706', fontWeight: '700' },
  coinsSub: {
    fontSize: fs(11),
    color: '#6B7280',
    marginTop: vs(2),
  },

  // ── Coupon ──
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: vs(12),
  },
  couponInput: {
    flex: 1,
    height: vs(46),
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: ms(10),
    paddingHorizontal: sp(14),
    fontSize: fs(14),
    color: '#111827',
    backgroundColor: '#F9FAFB',
    letterSpacing: 1,
  },
  couponApplyBtn: {
    height: vs(46),
    paddingHorizontal: sp(18),
    backgroundColor: '#2563EB',
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponApplyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fs(13),
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    paddingHorizontal: sp(14),
    paddingVertical: vs(12),
    marginBottom: vs(12),
  },
  couponAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponAppliedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  couponAppliedCode: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#15803D',
  },
  couponAppliedTitle: {
    fontSize: fs(11),
    color: '#4B5563',
    marginTop: vs(2),
  },
  couponAppliedSaving: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#16A34A',
  },
  couponAppliedTicket: {
    width: sp(34),
    height: sp(34),
    borderRadius: sp(9),
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── View All Coupons entry button ──
  viewCouponsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
    paddingHorizontal: sp(14),
    paddingVertical: vs(13),
    marginBottom: vs(12),
  },
  viewCouponsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    flex: 1,
  },
  viewCouponsIcon: {
    width: sp(38),
    height: sp(38),
    borderRadius: sp(10),
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCouponsTitle: {
    fontSize: fs(isSmallScreen ? 13 : 14),
    fontWeight: '700',
    color: '#15803D',
  },
  viewCouponsSub: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    color: '#16A34A',
    marginTop: vs(2),
  },

  // ── Coupon sheet ──
  couponSheetScroll: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  couponSheetLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(48),
    gap: vs(12),
  },
  couponSheetLoadingText: { fontSize: fs(13), color: '#6B7280' },
  couponSheetEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(48),
    gap: vs(6),
  },
  couponSheetEmptyText: { fontSize: fs(14), fontWeight: '600', color: '#374151' },
  couponSheetEmptySub: { fontSize: fs(12), color: '#9CA3AF' },

  // ── Coupon card (ticket style) ──
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: vs(12),
    overflow: 'hidden',
  },
  couponStub: {
    width: sp(70),
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(8),
    gap: vs(1),
  },
  couponStubValue: {
    fontSize: fs(isSmallScreen ? 14 : 16),
    fontWeight: '800',
    color: '#15803D',
  },
  couponStubOff: {
    fontSize: fs(9),
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 1,
  },
  couponPerforation: {
    width: sp(12),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponNotchTop: {
    width: sp(12),
    height: sp(6),
    borderBottomLeftRadius: sp(6),
    borderBottomRightRadius: sp(6),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    marginTop: -1,
  },
  couponDashes: {
    flex: 1,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    marginVertical: vs(2),
  },
  couponNotchBottom: {
    width: sp(12),
    height: sp(6),
    borderTopLeftRadius: sp(6),
    borderTopRightRadius: sp(6),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    marginBottom: -1,
  },
  couponBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: vs(8),
    gap: sp(10),
  },
  couponBodyText: {
    flex: 1,
    gap: vs(2),
  },
  couponCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  couponCodePill: {
    backgroundColor: '#ECFDF5',
    borderRadius: sp(5),
    paddingHorizontal: sp(7),
    paddingVertical: vs(1),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexShrink: 0,
  },
  couponCodePillText: {
    fontSize: fs(10),
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.4,
  },
  couponCardTitle: {
    flex: 1,
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontWeight: '700',
    color: '#111827',
  },
  couponCardDesc: {
    fontSize: fs(11),
    color: '#6B7280',
    lineHeight: fs(14),
  },
  couponMinText: {
    fontSize: fs(10),
    color: '#9CA3AF',
  },
  couponApplyPill: {
    backgroundColor: '#16A34A',
    borderRadius: sp(8),
    paddingHorizontal: sp(14),
    paddingVertical: vs(7),
    minWidth: sp(64),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  couponApplyPillDisabled: {
    backgroundColor: '#F3F4F6',
  },
  couponApplyPillText: {
    fontSize: fs(12),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  couponApplyPillTextDisabled: {
    color: '#9CA3AF',
    letterSpacing: 0,
  },
  // ── Ineligible (disabled) coupon states ──
  couponCardDisabled: {
    backgroundColor: '#FAFAFA',
    borderColor: '#EEEEEE',
  },
  couponStubDisabled: {
    backgroundColor: '#F3F4F6',
  },
  couponCodePillDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  couponTextMuted: {
    color: '#9CA3AF',
  },
  couponIneligibleText: {
    fontSize: fs(10),
    color: '#EF4444',
    fontWeight: '600',
  },

  // ── NEW: Restricted items highlight card ──────────────────────────────────
  restrictedHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF1F2',
    borderRadius: sp(12),
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    paddingHorizontal: sp(14),
    paddingVertical: vs(13),
    marginTop: sp(20),
    gap: sp(10),
  },
  restrictedHighlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: sp(12),
  },
  restrictedHighlightIconBox: {
    width: sp(38),
    height: sp(38),
    borderRadius: sp(10),
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  restrictedHighlightTextBlock: { flex: 1 },
  restrictedHighlightTitle: {
    fontSize: fs(isSmallScreen ? 13 : 14),
    fontWeight: '700',
    color: '#991B1B',
  },
  restrictedHighlightSub: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    color: '#DC2626',
    marginTop: vs(2),
    fontWeight: '400',
  },

  // ── Read before Booking notes ──
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sp(14),
    padding: sp(14),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: vs(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: vs(8),
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp(8),
  },
  noteText: {
    fontSize: fs(isSmallScreen ? 12 : 13),
    color: '#4B5563',
    lineHeight: fs(isSmallScreen ? 17 : 19),
    flex: 1,
  },

  // ── Footer ──
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: GUTTER,
    paddingTop: sp(isSmallScreen ? 10 : 14),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  priceContainer: { flex: 1, minWidth: 0 },
  finalPriceLabel: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    color: '#6B7280',
  },
  finalPriceStrike: {
    fontSize: fs(12),
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: vs(1),
  },
  finalPrice: {
    fontSize: fs(isSmallScreen ? 20 : 24),
    fontWeight: '700',
    color: '#111827',
  },
  bookButton: {
    flex: isSmallScreen ? 1.6 : 2,
    backgroundColor: '#2563EB',
    borderRadius: sp(12),
    height: sp(isSmallScreen ? 44 : 50),
  },
  bookButtonText: {
    fontSize: fs(isSmallScreen ? 14 : 16),
    fontWeight: '600',
  },

  // ── Icon-enhanced section titles ──
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginTop: sp(20),
    marginBottom: sp(10),
    marginLeft: sp(2),
  },
  sectionIconBadge: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(7),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  // ── Icon-enhanced fare rows ──
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    flex: 1,
    flexShrink: 1,
  },
  rowIconBox: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(6),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  // ── Address label row ──
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    marginBottom: sp(2),
  },

  // ── GSTIN ──
  gstCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sp(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: sp(14),
    paddingVertical: vs(13),
    marginBottom: vs(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  gstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gstLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    flex: 1,
  },
  gstLabel: {
    fontSize: fs(isSmallScreen ? 13 : 14),
    fontWeight: '500',
    color: '#374151',
  },
  gstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    backgroundColor: '#EFF6FF',
    borderRadius: sp(8),
    paddingHorizontal: sp(12),
    paddingVertical: sp(7),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gstBtnActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  gstBtnText: {
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontWeight: '600',
    color: '#2563EB',
  },
  gstBtnTextActive: {
    color: '#6B7280',
  },
  gstInputWrap: {
    marginTop: vs(12),
  },
  gstInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  gstInput: {
    flex: 1,
    height: vs(46),
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: sp(10),
    paddingHorizontal: sp(14),
    fontSize: fs(isSmallScreen ? 13 : 14),
    color: '#111827',
    backgroundColor: '#F8FAFF',
    letterSpacing: 1,
  },
  gstConfirmBtn: {
    height: vs(46),
    paddingHorizontal: sp(16),
    backgroundColor: '#2563EB',
    borderRadius: sp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  gstConfirmBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  gstConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fs(13),
  },
  gstHint: {
    fontSize: fs(11),
    color: '#9CA3AF',
    marginTop: vs(5),
  },
  gstConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginTop: vs(12),
    backgroundColor: '#F0FDF4',
    borderRadius: sp(10),
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: sp(12),
    paddingVertical: vs(10),
  },
  gstConfirmedText: {
    flex: 1,
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontWeight: '600',
    color: '#15803D',
    letterSpacing: 1,
  },

  // ── Note check icon ──
  noteIcon: {
    marginTop: vs(1),
    flexShrink: 0,
  },

  // ── Loading / Error ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: sp(16),
    fontSize: fs(16),
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(24),
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    marginTop: sp(16),
    fontSize: fs(16),
    color: '#374151',
    textAlign: 'center',
    marginBottom: sp(24),
    lineHeight: fs(24),
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: sp(24),
    paddingVertical: sp(12),
    borderRadius: sp(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: fs(15),
  },

  // ── Restricted Items Bottom Sheet Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sp(24),
    borderTopRightRadius: sp(24),
    paddingTop: vs(12),
    paddingHorizontal: GUTTER,
    maxHeight: SCREEN_HEIGHT * 0.82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHandle: {
    width: sp(40),
    height: vs(4),
    borderRadius: sp(2),
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: vs(16),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(14),
  },
  modalTitle: {
    fontSize: fs(isSmallScreen ? 17 : 19),
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: sp(34),
    height: sp(34),
    borderRadius: sp(17),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: sp(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: sp(14),
    paddingVertical: vs(14),
    marginBottom: vs(16),
    gap: sp(12),
  },
  modalWarningTextWrap: { flex: 1 },
  modalWarningText: {
    fontSize: fs(isSmallScreen ? 13 : 14),
    fontWeight: '600',
    color: '#78350F',
    lineHeight: fs(20),
  },
  modalWarningIcon: {
    width: sp(56),
    height: sp(56),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalWarningBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  modalScroll: {
    flexGrow: 0,
    marginBottom: vs(16),
  },
  restrictedGrid: {
    gap: vs(4),
  },
  restrictedGridRow: {
    flexDirection: 'row',
    gap: hs(8),
  },
  restrictedGridCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp(6),
    paddingVertical: vs(5),
  },
  restrictedBullet: {
    width: sp(5),
    height: sp(5),
    borderRadius: sp(3),
    backgroundColor: '#6B7280',
    marginTop: vs(6),
    flexShrink: 0,
  },
  restrictedItem: {
    flex: 1,
    fontSize: fs(isSmallScreen ? 12 : 13),
    color: '#374151',
    lineHeight: fs(18),
    fontWeight: '400',
  },
  modalOkBtn: {
    backgroundColor: '#2563EB',
    borderRadius: sp(14),
    paddingVertical: vs(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(4),
  },
  modalOkBtnText: {
    fontSize: fs(isSmallScreen ? 14 : 16),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── No Drivers Available ──
  noDriversRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hs(20),
  },
  noDriversBack: {
    alignSelf: 'flex-start',
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(8),
  },
  noDriversHeroWrap: {
    width: sp(200),
    height: sp(200),
    borderRadius: sp(100),
    backgroundColor: '#EEF2FF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDriversHeroImg: {
    width: sp(185),
    height: sp(185),
  },
  noDriversTitle: {
    fontSize: fs(isSmallScreen ? 17 : 19),
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: fs(isSmallScreen ? 24 : 27),
    fontFamily: 'Poppins-Bold',
  },
  noDriversTitleAccent: {
    color: '#2563EB',
  },
  noDriversSub: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: fs(isSmallScreen ? 16 : 18),
    paddingHorizontal: hs(4),
    fontFamily: 'Poppins-Regular',
  },
  noDriversTipCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: sp(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  noDriversTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(12),
    paddingHorizontal: hs(14),
    paddingVertical: vs(10),
  },
  noDriversTipIconBox: {
    width: sp(34),
    height: sp(34),
    borderRadius: sp(17),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  noDriversTipTextCol: {
    flex: 1,
  },
  noDriversTipTitle: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: vs(1),
  },
  noDriversTipBody: {
    fontSize: fs(isSmallScreen ? 10 : 11),
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  noDriversTipDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: hs(14),
  },
  noDriversActions: {
    width: '100%',
    gap: vs(8),
    paddingBottom: vs(4),
  },
  noDriversRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    backgroundColor: '#2563EB',
    borderRadius: sp(12),
    paddingVertical: vs(12),
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  noDriversRetryText: {
    fontSize: fs(isSmallScreen ? 13 : 14),
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  noDriversChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    backgroundColor: '#FFFFFF',
    borderRadius: sp(12),
    paddingVertical: vs(11),
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  noDriversChangeText: {
    fontSize: fs(isSmallScreen ? 12 : 13),
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Poppins-SemiBold',
  },
  noDriversNotifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    backgroundColor: '#F9FAFB',
    borderRadius: sp(12),
    paddingVertical: vs(11),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noDriversNotifyText: {
    fontSize: fs(isSmallScreen ? 11 : 12),
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default FareEstimate;