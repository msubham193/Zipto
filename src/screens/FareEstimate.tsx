import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  Dimensions,
  PixelRatio,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Switch } from 'react-native';
import { vehicleApi, FareEstimateResponse } from '../api/vehicle';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
// import { WebView } from 'react-native-webview'; // Razorpay disabled — cash only for now

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

// ─── Payment Icon Map ─────────────────────────────────────────────────────────
const PAYMENT_ICONS: Record<'cash' | 'online', any> = {
  cash: require('../assets/images/cash.png'),
  online: require('../assets/images/bhim.png'),
};

// ─── Component ───────────────────────────────────────────────────────────────
const FareEstimate = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'online'>('cash');
  const [paidBy, setPaidBy] = useState<'sender' | 'receiver'>('sender');
  const [estimateData, setEstimateData] = useState<FareEstimateResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zipto Coins
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [useCoins, setUseCoins] = useState(false);

  // Animated value for the "Who Pays?" slider pill (0 = sender, 1 = receiver)
  const sliderAnim = useRef(new Animated.Value(0)).current;
  const [sliderWidth, setSliderWidth] = useState(0);

  const { user } = useAuthStore();
  const { setActiveBooking } = useBookingStore();

  const {
    vehicle, pickup, drop, pickupCoords, dropCoords,
    city, serviceCategory, senderName, senderMobile,
    helperCount, helperCost,
    receiverName, receiverPhone, alternativePhone,
  } = route.params || {};

  const selectedVehicleType = vehicle?.vehicleType || 'bike';

  // ── Who Pays slider handler ─────────────────────────────────────────────────
  const handlePaidByChange = (value: 'sender' | 'receiver') => {
    setPaidBy(value);
    if (value === 'receiver') {
      setSelectedPayment('cash');
    }
    Animated.spring(sliderAnim, {
      toValue: value === 'sender' ? 0 : 1,
      useNativeDriver: false,
      tension: 180,
      friction: 18,
    }).start();
  };

  // ── Fetch fare estimate ─────────────────────────────────────────────────────
  const fetchFareEstimate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!pickupCoords || !dropCoords) throw new Error('Location coordinates are required');
      if (!vehicle?.vehicleType) throw new Error('Vehicle type is required');
      const response = await vehicleApi.estimateFare({
        pickup_location: { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude, address: pickup || '' },
        drop_location: { latitude: dropCoords.latitude, longitude: dropCoords.longitude, address: drop || '' },
        vehicle_type: selectedVehicleType,
        number_of_helpers: helperCount || 0,
      });
      if (response.success && response.data) {
        setEstimateData(response.data);
      } else {
        throw new Error('Failed to get fare estimate');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to calculate fare. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pickupCoords, dropCoords, vehicle?.vehicleType, helperCount, pickup, drop, selectedVehicleType]);

  useEffect(() => {
    fetchFareEstimate();
    vehicleApi.getCoinsBalance()
      .then(res => setCoinsBalance(res?.coins ?? 0))
      .catch(() => {});
  }, [fetchFareEstimate]);

  // ── Navigation helper ───────────────────────────────────────────────────────
  const navigateToTracking = (
    bookingId: string,
    showBookingSuccess = false,
    paymentMethod: 'cash' | 'online' = selectedPayment,
  ) => {
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Home' },
        {
          name: 'LiveTracking',
          params: {
            bookingId, pickup: pickup || '', drop: drop || '',
            pickupCoords, dropCoords, vehicleType: selectedVehicleType,
            fare: (estimateData?.estimated_fare || 0) + (helperCost || 0),
            showBookingSuccess, paymentMethod, helperCount, helperCost,
          },
        },
      ],
    });
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
        receiver_phone: receiverPhone || undefined,
        alternative_phone: alternativePhone || undefined,
        paid_by: paidBy,
        coins_to_redeem: useCoins ? COINS_PER_REDEMPTION : 0,
      };
      const bookingResponse = await vehicleApi.createBooking(bookingData);
      if (!bookingResponse.success) {
        const raw = bookingResponse.message;
        const msg = Array.isArray(raw) ? raw.join('\n') : (raw || 'Failed to create booking. Please try again.');
        Alert.alert('Booking Failed', msg);
        return;
      }
      const bookingId = bookingResponse.data?.booking_id || bookingResponse.data?.id;
      const amount = totalFare;
      setActiveBooking({
        id: bookingId,
        status: 'searching',
        pickupAddress: pickup || '',
        dropAddress: drop || '',
        vehicleType: selectedVehicleType,
        estimatedFare: amount,
        pickup: pickup || '',
        drop: drop || '',
        pickupCoords,
        dropCoords,
        paymentMethod: selectedPayment,
        paidBy,
      });
      navigateToTracking(bookingId, false, 'cash');
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Calculating best fare...</Text>
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={sp(48)} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFareEstimate} activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Retry Estimation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const breakdown = estimateData?.breakdown;
  const baseFare = Math.round((estimateData?.estimated_fare || 0) + (helperCost || 0));
  // 100 coins = ₹2 discount (fixed unit — always exactly 100 coins per redemption)
  const COINS_PER_REDEMPTION = 100;
  const RUPEES_PER_REDEMPTION = 2;
  const coinDiscount = useCoins ? RUPEES_PER_REDEMPTION : 0;
  const totalFare = Math.max(0, baseFare - coinDiscount);
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

  // Interpolate pill position using measured container width
  const halfWidth = sliderWidth > 0 ? sliderWidth / 2 : 0;
  const pillLeft = sliderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sp(6), sp(6) + halfWidth],
  });

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={sp(24)} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fare Estimate</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Route Card ── */}
        <View style={styles.card}>
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
                <Text style={styles.label}>Pickup</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {pickup || 'Current Location'}
                </Text>
              </View>
              <View style={styles.addressItem}>
                <Text style={styles.label}>Drop-off</Text>
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
        </View>

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
        <Text style={styles.sectionTitle}>Fare Breakdown</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Base Fare</Text>
            <Text style={styles.rowValue}>₹{breakdown?.base_fare || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Distance Charge</Text>
            <Text style={styles.rowValue}>₹{breakdown?.distance_charge || 0}</Text>
          </View>
          {(breakdown?.platform_fee || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Platform Fee (incl. GST)</Text>
              <Text style={styles.rowValue}>
                ₹{((breakdown?.platform_fee || 0) + (breakdown?.platform_fee_gst || 0)).toFixed(0)}
              </Text>
            </View>
          )}
          {hasSurge && (
            <>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Subtotal (before surge)</Text>
                <Text style={styles.rowValue}>₹{breakdown?.subtotal || 0}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, styles.surgeRowLabel]}>
                  Surge ({surgeMultiplier}x · +{Math.round((surgeMultiplier - 1) * 100)}%)
                </Text>
                <Text style={[styles.rowValue, styles.surgeRowValue]}>+₹{surgeExtra}</Text>
              </View>
            </>
          )}
          {(helperCount || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Labour Charge ({helperCount}x)</Text>
              <Text style={styles.rowValue}>₹{helperCost || 0}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>₹{baseFare}</Text>
          </View>
          {useCoins && coinDiscount > 0 && (
            <View style={[styles.row, { marginTop: scaleH(4) }]}>
              <View style={styles.coinDiscountLabel}>
                <Icon name="toll" size={sp(14)} color="#7C3AED" />
                <Text style={styles.coinDiscountText}>Coins Discount (100 coins)</Text>
              </View>
              <Text style={styles.coinDiscountValue}>−₹{coinDiscount.toFixed(2)}</Text>
            </View>
          )}
          {useCoins && coinDiscount > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={[styles.totalValue, { color: '#7C3AED' }]}>₹{totalFare}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Zipto Coins ── */}
        {coinsBalance >= 100 && (
          <>
            <Text style={styles.sectionTitle}>Zipto Coins</Text>
            <View style={styles.coinsCard}>
              <View style={styles.coinsCardLeft}>
                <View style={styles.coinsIconBox}>
                  <Icon name="toll" size={sp(22)} color="#7C3AED" />
                </View>
                <View style={styles.coinsTextBlock}>
                  <Text style={styles.coinsTitle}>
                    You have <Text style={styles.coinsBold}>{coinsBalance} coins</Text>
                  </Text>
                  <Text style={styles.coinsSub}>
                    Use 100 coins → get ₹2 off
                  </Text>
                </View>
              </View>
              <Switch
                value={useCoins}
                onValueChange={setUseCoins}
                trackColor={{ false: '#E5E7EB', true: '#DDD6FE' }}
                thumbColor={useCoins ? '#7C3AED' : '#9CA3AF'}
              />
            </View>
          </>
        )}

        {/* ── Who Pays? (Slider) ── */}
        <Text style={styles.sectionTitle}>Who Pays?</Text>
        <View
          style={styles.whoPaysSlider}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        >
          {sliderWidth > 0 && (
            <Animated.View style={[styles.sliderPill, { left: pillLeft, width: halfWidth - sp(6) }]} />
          )}
          <TouchableOpacity
            style={styles.sliderOption}
            onPress={() => handlePaidByChange('sender')}
            activeOpacity={0.85}
          >
            <View style={[styles.sliderIconBox, paidBy === 'sender' && styles.sliderIconBoxActive]}>
              <Icon
                name="person"
                size={sp(18)}
                color={paidBy === 'sender' ? '#FFFFFF' : '#6B7280'}
              />
            </View>
            <View style={styles.sliderTextBlock}>
              <Text style={[styles.sliderLabel, paidBy === 'sender' && styles.sliderLabelActive]}>
                Sender pays
              </Text>
              <Text style={[styles.sliderSub, paidBy === 'sender' && styles.sliderSubActive]}>
                Collect at pickup
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderOption}
            onPress={() => handlePaidByChange('receiver')}
            activeOpacity={0.85}
          >
            <View style={[styles.sliderIconBox, paidBy === 'receiver' && styles.sliderIconBoxActive]}>
              <Icon
                name="person-outline"
                size={sp(18)}
                color={paidBy === 'receiver' ? '#FFFFFF' : '#6B7280'}
              />
            </View>
            <View style={styles.sliderTextBlock}>
              <Text style={[styles.sliderLabel, paidBy === 'receiver' && styles.sliderLabelActive]}>
                Receiver pays
              </Text>
              <Text style={[styles.sliderSub, paidBy === 'receiver' && styles.sliderSubActive]}>
                Collect at delivery
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Payment Method ── */}
        {paidBy === 'sender' && (
          <>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentContainer}>
    
              {/* Cash */}
              <TouchableOpacity
                style={[styles.paymentOption, selectedPayment === 'cash' && styles.selectedPayment]}
                onPress={() => setSelectedPayment('cash')}
                activeOpacity={0.9}
              >
                <View style={styles.paymentLeft}>
                  {/* ── Cash asset icon ── */}
                  <View style={[styles.iconBox, selectedPayment === 'cash' && styles.selectedIconBox]}>
                    <Image
                      source={PAYMENT_ICONS.cash}
                      style={styles.paymentIconImg}
                      resizeMode="contain"
                    />
                  </View>
                  <View>
                    <Text style={[styles.paymentTitle, selectedPayment === 'cash' && styles.selectedPaymentText]}>
                      Cash
                    </Text>
                    <Text style={styles.paymentSub}>Pay to Rider</Text>
                  </View>
                </View>
                <View style={[styles.radio, selectedPayment === 'cash' && styles.radioSelected]}>
                  {selectedPayment === 'cash' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
    
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.finalPriceLabel}>
            {useCoins && coinDiscount > 0 ? 'Payable (after coins)' : 'Final Amount'}
          </Text>
          {useCoins && coinDiscount > 0 && (
            <Text style={styles.finalPriceStrike}>₹{baseFare}</Text>
          )}
          <Text style={[styles.finalPrice, useCoins && coinDiscount > 0 && { color: '#7C3AED' }]}
            adjustsFontSizeToFit numberOfLines={1}>
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

    </SafeAreaView>
  );
};

// ─── Responsive Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: sp(isSmallScreen ? 10 : 12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: nf(isSmallScreen ? 16 : 18),
    fontWeight: '700',
    color: '#1F2937',
  },
  headerButton: {
    padding: sp(8),
    borderRadius: sp(8),
    minWidth: sp(40),
    alignItems: 'center',
  },
  // ── Scroll content ───────────────────────────────────────────────────────────
  content: {
    padding: sp(16),
    paddingBottom: sp(100),
  },
  // ── Card ─────────────────────────────────────────────────────────────────────
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
    fontSize: nf(isSmallScreen ? 14 : 16),
    fontWeight: '600',
    color: '#374151',
    marginTop: sp(24),
    marginBottom: sp(12),
    marginLeft: sp(4),
  },
  // ── Vehicle row ──────────────────────────────────────────────────────────────
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
  vehicleTextWrapper: {
    flex: 1,
  },
  vehicleName: {
    fontSize: nf(isSmallScreen ? 14 : 16),
    fontWeight: '600',
    color: '#1F2937',
  },
  vehicleCapacity: {
    fontSize: nf(isSmallScreen ? 11 : 12),
    color: '#6B7280',
    marginTop: sp(2),
  },
  // ── Route timeline ───────────────────────────────────────────────────────────
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
  pickupDot: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  dropDot: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
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
    fontSize: nf(isSmallScreen ? 10 : 12),
    color: '#6B7280',
    marginBottom: sp(2),
  },
  addressText: {
    fontSize: nf(isSmallScreen ? 13 : 15),
    fontWeight: '500',
    color: '#111827',
    lineHeight: nf(isSmallScreen ? 18 : 20),
  },
  // ── Stats row ────────────────────────────────────────────────────────────────
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
    fontSize: nf(isSmallScreen ? 12 : 14),
    fontWeight: '500',
    color: '#4B5563',
  },
  statDivider: {
    width: 1,
    height: sp(20),
    backgroundColor: '#D1D5DB',
  },
  // ── Breakdown rows ───────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sp(10),
    flexWrap: 'nowrap',
    gap: sp(8),
  },
  rowLabel: {
    fontSize: nf(isSmallScreen ? 12 : 14),
    color: '#6B7280',
    flex: 1,
    flexShrink: 1,
  },
  rowValue: {
    fontSize: nf(isSmallScreen ? 12 : 14),
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
    fontSize: nf(isSmallScreen ? 14 : 16),
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  totalValue: {
    fontSize: nf(isSmallScreen ? 18 : 20),
    fontWeight: '700',
    color: '#2563EB',
    flexShrink: 0,
  },
  // ── Surge banner ─────────────────────────────────────────────────────────────
  surgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    borderRadius: sp(12),
    paddingVertical: sp(10),
    paddingHorizontal: sp(14),
    marginBottom: sp(12),
    gap: sp(10),
  },
  surgeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    flex: 1,
  },
  surgeBannerText: {
    flex: 1,
    gap: sp(2),
  },
  surgeBannerTitle: {
    fontSize: nf(isSmallScreen ? 12 : 13),
    fontWeight: '700',
    color: '#B91C1C',
  },
  surgeBannerReason: {
    fontSize: nf(isSmallScreen ? 10 : 11),
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
    fontSize: nf(isSmallScreen ? 12 : 13),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  surgeRowLabel: {
    color: '#B91C1C',
    fontWeight: '500',
  },
  surgeRowValue: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  // ── Who Pays Slider ──────────────────────────────────────────────────────────
  whoPaysSlider: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: sp(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: sp(6),
    position: 'relative',
    overflow: 'hidden',
  },
  sliderPill: {
    position: 'absolute',
    top: sp(6),
    bottom: sp(6),
    backgroundColor: '#2563EB',
    borderRadius: sp(10),
  },
  sliderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    paddingVertical: sp(isSmallScreen ? 10 : 13),
    paddingHorizontal: sp(isSmallScreen ? 10 : 14),
    zIndex: 1,
  },
  sliderIconBox: {
    width: sp(isSmallScreen ? 32 : 36),
    height: sp(isSmallScreen ? 32 : 36),
    borderRadius: sp(isSmallScreen ? 16 : 18),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sliderIconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  sliderTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  sliderLabel: {
    fontSize: nf(isSmallScreen ? 13 : 14),
    fontWeight: '500',
    color: '#374151',
  },
  sliderLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sliderSub: {
    fontSize: nf(isSmallScreen ? 10 : 11),
    color: '#9CA3AF',
    marginTop: sp(1),
  },
  sliderSubActive: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  // ── Payment method options ───────────────────────────────────────────────────
  paymentContainer: {
    gap: sp(12),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: sp(isSmallScreen ? 12 : 16),
    borderRadius: sp(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedPayment: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    flex: 1,
  },
  iconBox: {
    width: sp(isSmallScreen ? 36 : 40),
    height: sp(isSmallScreen ? 36 : 40),
    borderRadius: sp(isSmallScreen ? 10 : 12),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  selectedIconBox: {
    backgroundColor: '#DBEAFE',
  },
  // ── Asset icon inside payment iconBox ────────────────────────────────────────
  paymentIconImg: {
    width: sp(isSmallScreen ? 22 : 26),
    height: sp(isSmallScreen ? 22 : 26),
  },
  paymentTitle: {
    fontSize: nf(isSmallScreen ? 14 : 16),
    fontWeight: '500',
    color: '#374151',
  },
  selectedPaymentText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  paymentSub: {
    fontSize: nf(isSmallScreen ? 11 : 12),
    color: '#9CA3AF',
    marginTop: sp(1),
  },
  radio: {
    width: sp(20),
    height: sp(20),
    borderRadius: sp(10),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: sp(10),
    height: sp(10),
    borderRadius: sp(5),
    backgroundColor: '#2563EB',
  },
  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: sp(16),
    paddingVertical: sp(isSmallScreen ? 10 : 14),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    paddingBottom: sp(isSmallScreen ? 10 : 14),
  },
  priceContainer: {
    flex: 1,
    minWidth: 0,
  },
  finalPriceLabel: {
    fontSize: nf(isSmallScreen ? 11 : 12),
    color: '#6B7280',
  },
  finalPrice: {
    fontSize: nf(isSmallScreen ? 20 : 24),
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
    fontSize: nf(isSmallScreen ? 14 : 16),
    fontWeight: '600',
  },
  // ── Loading / Error ──────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: sp(16),
    fontSize: nf(16),
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
    fontSize: nf(16),
    color: '#374151',
    textAlign: 'center',
    marginBottom: sp(24),
    lineHeight: nf(24),
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
    fontSize: nf(15),
  },
  // ── Payment modal ────────────────────────────────────────────────────────────
  paymentModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: sp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentModalTitle: {
    fontSize: nf(isSmallScreen ? 16 : 18),
    fontWeight: '600',
    color: '#111827',
  },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  // ── Coin discount row ────────────────────────────────────────────────────────
  coinDiscountLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  coinDiscountText: {
    fontSize: nf(13),
    color: '#7C3AED',
    fontWeight: '500',
  },
  coinDiscountValue: {
    fontSize: nf(13),
    color: '#7C3AED',
    fontWeight: '600',
  },

  // ── Coins card ───────────────────────────────────────────────────────────────
  coinsCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingHorizontal: sp(14),
    paddingVertical: scaleH(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleH(8),
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
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinsTextBlock: {
    flex: 1,
  },
  coinsTitle: {
    fontSize: nf(13),
    color: '#374151',
    fontWeight: '500',
  },
  coinsBold: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  coinsSub: {
    fontSize: nf(11),
    color: '#6B7280',
    marginTop: scaleH(2),
  },

  // ── Footer strikethrough price ───────────────────────────────────────────────
  finalPriceStrike: {
    fontSize: nf(12),
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: scaleH(1),
  },
});

export default FareEstimate;