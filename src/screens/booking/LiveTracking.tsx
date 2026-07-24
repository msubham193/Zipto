import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
  Animated,
  Easing,
  Vibration,
  TextInput,
  ScrollView,
  PanResponder,
  AppState,
} from 'react-native';
import { showAlert } from '../../components/CustomAlert';
import MapView, { Marker, MarkerAnimated, AnimatedRegion, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { vehicleApi } from '../../api/vehicle';
import { googleMapsApi } from '../../api/googleMaps';
import { useBookingStore } from '../../store/useBookingStore';
import { connectSocket, onDriverLocation } from '../../services/socketService';
import { MAP_STYLE } from '../../utils/mapStyle';
import RatingModal from '../../components/RatingModal';
import { setPendingRating, clearPendingRating } from '../../utils/pendingRating';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../utils/metrics';

type BookingStatus = 'searching' | 'assigned' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';

interface DriverInfo {
  name: string;
  phone: string;
  vehicle_number?: string;
  rating?: number;
  total_trips?: number;
  profile_image?: string | null;
}

/** Money: show decimals only when present (₹59 stays ₹59, ₹59.28 shows fully). */
const money = (n: number) =>
  (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Haversine distance in km — for display only, no API call */
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price',
  'Rider taking too long',
  'Wrong pickup/drop location',
  'Booked by mistake',
];

// Compact, borderless OTP display — small spaced digits inline
const OTPDigits = ({ code, color }: { code: string; color: string }) => (
  <Text style={[styles.otpInline, { color }]}>{code.split('').join(' ')}</Text>
);

const LiveTracking = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  // ── Draggable bottom sheet ────────────────────────────────────────────────
  // translateY 0 = fully expanded; positive = slid down so the map is revealed.
  // We keep a small "peek" (handle + status header) visible while collapsed.
  const SHEET_PEEK = ms(116);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetCurrentYRef = useRef(0);   // live value of sheetTranslateY
  const sheetDragStartRef = useRef(0);  // value when a drag begins
  const sheetCollapseYRef = useRef(0);  // computed from measured sheet height
  const sheetCollapsedRef = useRef(false);

  useEffect(() => {
    const id = sheetTranslateY.addListener(({ value }) => {
      sheetCurrentYRef.current = value;
    });
    return () => sheetTranslateY.removeListener(id);
  }, [sheetTranslateY]);

  const snapSheet = useCallback(
    (to: number) => {
      sheetCollapsedRef.current = to > 0;
      Animated.spring(sheetTranslateY, {
        toValue: to,
        useNativeDriver: true,
        bounciness: 2,
        speed: 16,
      }).start();
    },
    [sheetTranslateY],
  );

  const collapseSheet = useCallback(() => {
    if (sheetCollapseYRef.current > 0) snapSheet(sheetCollapseYRef.current);
  }, [snapSheet]);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, g) =>
        Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation();
        sheetDragStartRef.current = sheetCurrentYRef.current;
      },
      onPanResponderMove: (_evt, g) => {
        const collapseY = sheetCollapseYRef.current || 0;
        let next = sheetDragStartRef.current + g.dy;
        if (next < 0) next = 0;
        if (next > collapseY) next = collapseY;
        sheetTranslateY.setValue(next);
      },
      onPanResponderRelease: (_evt, g) => {
        const collapseY = sheetCollapseYRef.current || 0;
        // Treat a near-stationary press as a tap → toggle expand/collapse.
        if (Math.abs(g.dy) < 6 && Math.abs(g.vy) < 0.3) {
          snapSheet(sheetCollapsedRef.current ? 0 : collapseY);
          return;
        }
        const current = sheetCurrentYRef.current;
        const shouldCollapse =
          g.vy > 0.5 || (g.vy >= -0.5 && current > collapseY / 2);
        snapSheet(shouldCollapse ? collapseY : 0);
      },
    }),
  ).current;

  const {
    bookingId,
    pickup = '',
    drop = '',
    pickupCoords,
    dropCoords,
    vehicleType = 'bike',
    fare = 0,
    showBookingSuccess = false,
    paidBy: paidByParam = 'sender',
    // True when opened from MyOrders — bookingId is a real DB ID, not a Redis offer ID
    isRealBooking = false,
  } = route.params || {};

  const { updateActiveBookingId, updateActiveBookingStatus, clearActiveBooking } = useBookingStore();

  // When re-opening from MyOrders we already have a real booking ID — skip offer polling
  // and start in 'assigned' so the countdown/offer-polling effects don't fire
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(
    isRealBooking ? 'assigned' : 'searching',
  );
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [otp, setOtp] = useState<string | null>(null);
  const [pickupOtp, setPickupOtp] = useState<string | null>(null);
  const [pickupOtpVerified, setPickupOtpVerified] = useState(false);
  const [deliveryOtpVerified, setDeliveryOtpVerified] = useState(false);
  // realBookingId: set immediately if re-opening, else set once driver accepts
  const [realBookingId, setRealBookingId] = useState<string | null>(
    isRealBooking ? bookingId : null,
  );
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  // AnimatedRegion drives smooth gliding of the driver marker between fixes.
  const driverAnim = useRef<AnimatedRegion | null>(null);
  const [mapReady, setMapReady] = useState(false);
  // Rating prompt after delivery (shown once; reset guard so polling can't re-open it)
  const [showRating, setShowRating] = useState(false);
  const ratingHandledRef = useRef(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paidBy, setPaidBy] = useState<string>(paidByParam);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  // Fare retry state
  const [retryModalVisible, setRetryModalVisible] = useState(false);
  const [currentFare, setCurrentFare] = useState<number>(fare);
  const [suggestedFare, setSuggestedFare] = useState<number>(fare + 10);
  const [retryCount, setRetryCount] = useState(0);
  const [retryLoading, setRetryLoading] = useState(false);
  // Live fare (increases mid-search)
  const [liveFare, setLiveFare] = useState<number>(fare);
  const [fareIncreasing, setFareIncreasing] = useState(false);
  const [searchCountdown, setSearchCountdown] = useState(60);
  // Wall-clock anchor for the countdown above — recomputed from this on every
  // tick (and on app-foreground resume) instead of decremented, so a
  // backgrounded app can't freeze the displayed number (see the two effects
  // below, near the other 'searching' effects).
  const searchStartRef = useRef<number>(Date.now());
  const hasShownSuccessRef = useRef(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotate: new Animated.Value(0),
    })),
  ).current;
  const confettiColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#22C55E', '#EAB308', '#14B8A6', '#A855F7'];

  useEffect(() => {
    const fallback = setTimeout(() => {
      setMapReady(true);
    }, 6000);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (!showBookingSuccess || hasShownSuccessRef.current) {
      return;
    }
    hasShownSuccessRef.current = true;

    setSuccessModal(true);
    successScale.setValue(0);
    successOpacity.setValue(0);
    checkScale.setValue(0);
    confettiAnims.forEach(anim => {
      anim.translateY.setValue(0);
      anim.translateX.setValue(0);
      anim.opacity.setValue(0);
      anim.scale.setValue(0);
      anim.rotate.setValue(0);
    });

    Vibration.vibrate([0, 80, 60, 120]);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 6,
          tension: 42,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.parallel(
        confettiAnims.map((anim, i) => {
          const angle = (i / confettiAnims.length) * 2 * Math.PI;
          const radius = 90 + Math.random() * 40;
          return Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: 1,
              duration: 700,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateX, {
              toValue: Math.cos(angle) * radius,
              duration: 760,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.translateY, {
                toValue: Math.sin(angle) * radius - 35,
                duration: 420,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateY, {
                toValue: Math.sin(angle) * radius + 80,
                duration: 460,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
          ]);
        }),
      ),
    ]).start();

    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(successScale, {
          toValue: 0.9,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => setSuccessModal(false));
    }, 2700);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [showBookingSuccess, confettiAnims, checkScale, successOpacity, successScale]);

  // MapBox coordinates [lng, lat]
  const pickupCenter: [number, number] = useMemo(
    () =>
      pickupCoords
        ? [pickupCoords.longitude, pickupCoords.latitude]
        : [85.8245, 20.2961],
    [pickupCoords],
  );

  const dropCenter: [number, number] = useMemo(
    () =>
      dropCoords
        ? [dropCoords.longitude, dropCoords.latitude]
        : [85.8345, 20.3061],
    [dropCoords],
  );

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) return;

    // While searching, poll offer status endpoint (booking not in DB yet)
    if (bookingStatus === 'searching' && !realBookingId) {
      try {
        const offerResponse = await vehicleApi.getOfferStatus(bookingId);
        const offerData = offerResponse?.data ?? (offerResponse as any);
        if (offerData?.status === 'accepted' && offerData?.booking_id) {
          setRealBookingId(offerData.booking_id);
          setBookingStatus('assigned');
          updateActiveBookingId(offerData.booking_id);
          updateActiveBookingStatus('accepted');
        } else if (offerData?.status === 'timed_out') {
          const curFare = offerData.current_fare ?? liveFare;
          setCurrentFare(curFare);
          // Bump by a true +₹10, preserving any decimal (₹73.44 → ₹83.44).
          setSuggestedFare(Math.round((curFare + 10) * 100) / 100);
          setRetryCount(offerData.retry_count ?? 0);
          setLiveFare(curFare);
          setRetryModalVisible(true);
        } else if (offerData?.status === 'expired') {
          setBookingStatus('cancelled');
          clearActiveBooking();
        }
      } catch (err: any) {
        console.log('Offer status poll error:', err?.message);
      }
      return;
    }

    // Use real booking ID once driver has accepted
    const activeBookingId = realBookingId || bookingId;
    try {
      const response = await vehicleApi.getBookingDetails(activeBookingId);
      if (response.success && response.data) {
        const data = response.data;
        const status = data.status?.toLowerCase();

        if (status === 'cancelled') {
          setBookingStatus('cancelled');
          clearActiveBooking();
        } else if (status === 'completed') {
          setBookingStatus('completed');
          clearActiveBooking();
          // Prompt the customer to rate the rider (once), unless already rated.
          if (!ratingHandledRef.current) {
            ratingHandledRef.current = true;
            const rateId = realBookingId || bookingId;
            const rateDriver = data.driver?.name;
            (async () => {
              try {
                const existing: any = await vehicleApi.getRatingByBooking(rateId);
                if (existing?.rating) return; // already rated
              } catch { /* still prompt */ }
              await setPendingRating({ bookingId: rateId, driverName: rateDriver });
              setShowRating(true);
            })();
          }
        } else if (status === 'in_progress' || status === 'picked_up' || status === 'ongoing') {
          // 'ongoing' is the real backend status after pickup OTP is verified
          setBookingStatus('in_progress');
          updateActiveBookingStatus('in_progress');
        } else if (status === 'driver_arriving' || status === 'arriving') {
          setBookingStatus('arriving');
          updateActiveBookingStatus('arriving');
        } else if (data.driver_id || data.driver) {
          setBookingStatus('assigned');
          updateActiveBookingStatus('driver_assigned');
        }

        if (data.driver) {
          setDriver({
            name: data.driver.name || 'Rider',
            phone: data.driver.phone || '',
            vehicle_number: data.driver.vehicle_number,
            rating: (data as any).driver_stats?.average_rating ?? data.driver.rating,
            total_trips: (data as any).driver_stats?.total_trips,
            profile_image:
              (data as any).driver_stats?.profile_image ||
              (data.driver as any).profile_image ||
              null,
          });
        }
        if (data.delivery_otp)        setOtp(data.delivery_otp);
        if (data.pickup_otp)           setPickupOtp(data.pickup_otp);
        if (data.pickup_otp_verified != null)  setPickupOtpVerified(!!data.pickup_otp_verified);
        if (data.delivery_otp_verified != null) setDeliveryOtpVerified(!!data.delivery_otp_verified);
        if (data.driver_location && Number.isFinite(data.driver_location.latitude)) {
          animateDriverTo(data.driver_location.latitude, data.driver_location.longitude);
        }
        if (data.paid_by)              setPaidBy(data.paid_by);
        // Use final_fare (includes toll + waiting) as the payment amount once booking completes
        const finalFare = parseFloat((data as any).final_fare);
        if (finalFare > 0) setLiveFare(finalFare);
        // Mark payment done if any payment record is completed
        if (data.payments?.some((p: any) => p.payment_status === 'completed')) {
          setPaymentDone(true);
        }
      }
    } catch (err: any) {
      console.log('Booking fetch error:', err?.message);
    }
  }, [bookingId, bookingStatus, realBookingId]);

  // Smoothly move the driver marker to a new position. First fix snaps; later
  // fixes glide over ~1s via AnimatedRegion. Always keeps `driverLocation` state
  // in sync so the marker mounts and camera logic still works.
  const animateDriverTo = useCallback((latitude: number, longitude: number) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (!driverAnim.current) {
      driverAnim.current = new AnimatedRegion({ latitude, longitude, latitudeDelta: 0, longitudeDelta: 0 });
    } else {
      driverAnim.current
        .timing({ latitude, longitude, duration: 1000, useNativeDriver: false } as any)
        .start();
    }
    setDriverLocation({ latitude, longitude });
  }, []);

  // ── Real-time driver location via WebSocket (primary), REST poll is fallback ──
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let active = true;
    if (bookingStatus === 'completed' || bookingStatus === 'cancelled') return;

    (async () => {
      await connectSocket();
      if (!active) return;
      unsub = onDriverLocation((loc) => {
        const targetId = realBookingId || bookingId;
        // Only accept updates for the booking we're tracking.
        if (loc.bookingId && targetId && loc.bookingId !== targetId) return;
        animateDriverTo(loc.latitude, loc.longitude);
      });
    })();

    return () => {
      active = false;
      unsub?.();
    };
  }, [bookingStatus, realBookingId, bookingId, animateDriverTo]);

  // Initial fetch + re-fetch when returning from Payment screen
  useEffect(() => {
    fetchBookingDetails();
    const unsub = navigation.addListener('focus', fetchBookingDetails);
    return unsub;
  }, [fetchBookingDetails, navigation]);

  // Smart polling — faster while searching, slower once stable
  useEffect(() => {
    if (bookingStatus === 'completed' || bookingStatus === 'cancelled') return;
    const pollInterval =
      bookingStatus === 'searching' ? 4000 :   // 4s while finding driver
      bookingStatus === 'assigned'  ? 6000 :   // 6s once driver assigned
                                      10000;   // 10s during ride (in_progress/arriving)
    const interval = setInterval(fetchBookingDetails, pollInterval);
    return () => clearInterval(interval);
  }, [bookingStatus, fetchBookingDetails]);

  // After booking completes, keep polling until payment is confirmed.
  // The main poll stops on 'completed', but the receiver may pay via QR after delivery.
  useEffect(() => {
    if (bookingStatus !== 'completed') return;
    if (paymentDone) return;
    const activeBookingId = realBookingId || bookingId;
    if (!activeBookingId) return;

    const pollPayment = async () => {
      try {
        const response = await vehicleApi.getBookingDetails(activeBookingId);
        if (response.success && response.data?.payments?.some((p: any) => p.payment_status === 'completed')) {
          setPaymentDone(true);
        }
      } catch {}
    };

    const interval = setInterval(pollPayment, 5000);
    return () => clearInterval(interval);
  }, [bookingStatus, paymentDone, realBookingId, bookingId]);

  // 60-second countdown while searching. Recomputed from the wall-clock
  // searchStartRef each tick (not decremented from the previous value) —
  // RN timers are throttled/paused while the app is backgrounded, so a naive
  // `prev => prev - 1` chain freezes and then resumes from the wrong number.
  // Recomputing from Date.now() self-corrects the instant a tick fires again.
  useEffect(() => {
    if (bookingStatus !== 'searching') return;
    const recompute = () => {
      const remaining = Math.max(0, 60 - Math.floor((Date.now() - searchStartRef.current) / 1000));
      setSearchCountdown(remaining);
    };
    recompute();
    const interval = setInterval(recompute, 1000);
    return () => clearInterval(interval);
  }, [bookingStatus]);

  // Resync immediately when the app returns to the foreground, instead of
  // waiting for the next 1s tick above (which itself was paused).
  useEffect(() => {
    if (bookingStatus !== 'searching') return;
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        const remaining = Math.max(0, 60 - Math.floor((Date.now() - searchStartRef.current) / 1000));
        setSearchCountdown(remaining);
      }
    });
    return () => subscription.remove();
  }, [bookingStatus]);

  // Fetch road route once — googleMapsApi internally caches for 5 min
  const routeFetchedRef = useRef(false);
  useEffect(() => {
    if (routeFetchedRef.current) return;
    let cancelled = false;
    const fetchRoute = async () => {
      const coords = await googleMapsApi.getDirections(pickupCenter, dropCenter);
      if (!cancelled && coords) {
        setRouteCoordinates(coords);
        routeFetchedRef.current = true;
      }
    };
    fetchRoute();
    return () => { cancelled = true; };
  }, [pickupCenter, dropCenter]);

  // Fit map to show pickup + drop (+ driver when available)
  const lastFitRef = useRef(0);
  useEffect(() => {
    if (!mapRef.current || !mapReady || !pickupCoords || !dropCoords) return;
    const now = Date.now();
    // Always fit immediately on mapReady; otherwise throttle to once per 5s
    if (lastFitRef.current !== 0 && now - lastFitRef.current < 5000) return;
    lastFitRef.current = now;

    const points = [
      { latitude: pickupCenter[1], longitude: pickupCenter[0] },
      { latitude: dropCenter[1], longitude: dropCenter[0] },
    ];
    if (driverLocation) {
      points.push(driverLocation);
    }
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 80, bottom: 320, left: 80 },
      animated: true,
    });
  }, [dropCenter, dropCoords, pickupCenter, pickupCoords, driverLocation, mapReady]);

  const handleCall = () => {
    if (driver?.phone) {
      Linking.openURL(`tel:${driver.phone}`);
    } else {
      showAlert('Unavailable', 'Rider phone number is not available yet.');
    }
  };

  const handleIncreaseFare = async () => {
    // True +₹10 bump, keeping any decimal (₹73.44 → ₹83.44).
    const newFare = Math.round((liveFare + 10) * 100) / 100;
    try {
      setFareIncreasing(true);
      await vehicleApi.updateOfferFare(bookingId, newFare);
      setLiveFare(newFare);
    } catch (err: any) {
      showAlert('Error', err?.response?.data?.message || 'Could not update fare.');
    } finally {
      setFareIncreasing(false);
    }
  };

  const handleRetrySearch = async () => {
    try {
      setRetryLoading(true);
      await vehicleApi.retrySearch(bookingId, suggestedFare);
      setRetryModalVisible(false);
      setCurrentFare(suggestedFare);
      setLiveFare(suggestedFare);
      setRetryCount(prev => prev + 1);
      searchStartRef.current = Date.now();
      setSearchCountdown(60);
    } catch (err: any) {
      showAlert('Error', err?.response?.data?.message || 'Could not retry. Please try again.');
    } finally {
      setRetryLoading(false);
    }
  };

  const handleCancelFromRetry = async () => {
    setRetryModalVisible(false);
    try {
      await vehicleApi.cancelOffer(bookingId);
    } catch {}
    setBookingStatus('cancelled');
    clearActiveBooking();
  };

  const handleOnlinePayment = () => {
    if (!realBookingId) {
      showAlert('Error', 'Booking not found. Please refresh and try again.');
      return;
    }
    const payAmount = Math.round((Number(liveFare) || 0) * 100) / 100; // exact ₹ (online pays exact decimal)
    if (!payAmount || payAmount <= 0) {
      showAlert('Error', 'Invalid payment amount. Please try again.');
      return;
    }
    navigation.navigate('Payment', {
      type: 'booking',
      bookingId: realBookingId,
      amount: payAmount,
    });
  };

  const handleCancel = () => {
    if (!bookingId) {
      showAlert('Unable to Cancel', 'Booking ID not found.');
      return;
    }
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingId) return;
    const reason =
      cancelReason === 'custom' ? customCancelReason.trim() : cancelReason;
    if (!reason) return;

    // Use real booking ID if available, otherwise cancel the offer
    const cancelId = realBookingId || bookingId;
    try {
      setCancelling(true);
      const response = await vehicleApi.cancelBooking(cancelId, reason);
      setCancelling(false);
      setCancelModalVisible(false);
      setCancelReason('');
      setCustomCancelReason('');

      if (response.success === false) {
        showAlert(
          'Cancel Failed',
          response.message || 'Could not cancel booking. Please try again.',
        );
        return;
      }

      setBookingStatus('cancelled');
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err: any) {
      setCancelling(false);
      showAlert(
        'Cancel Failed',
        err?.response?.data?.message ||
          err?.message ||
          'Could not cancel booking. Please try again.',
      );
    }
  };

  const getStatusConfig = () => {
    switch (bookingStatus) {
      case 'searching':
        return {
          color: '#F59E0B',
          bg: '#FFFBEB',
          border: '#FDE68A',
          icon: 'search',
          title: `Finding rider... ${searchCountdown}s`,
          subtitle: 'Please wait while we find the best rider for you',
        };
      case 'assigned':
        return {
          color: '#2563EB',
          bg: '#EFF6FF',
          border: '#BFDBFE',
          icon: 'person-pin',
          title: 'Rider assigned!',
          subtitle: 'Your rider is preparing to pick up',
        };
      case 'arriving':
        return {
          color: '#059669',
          bg: '#F0FDF4',
          border: '#BBF7D0',
          icon: 'directions-car',
          title: 'Rider on the way',
          subtitle: 'Your rider is heading to the pickup point',
        };
      case 'in_progress':
        return {
          color: '#7C3AED',
          bg: '#F5F3FF',
          border: '#DDD6FE',
          icon: 'local-shipping',
          title: 'Ride in progress',
          subtitle: 'You are on your way to the destination',
        };
      case 'completed':
        return {
          color: '#059669',
          bg: '#F0FDF4',
          border: '#BBF7D0',
          icon: 'check-circle',
          title: 'Ride completed',
          subtitle: 'Thank you for riding with Bookfleet!',
        };
      case 'cancelled':
        return {
          color: '#DC2626',
          bg: '#FEF2F2',
          border: '#FECACA',
          icon: 'cancel',
          title: 'Booking cancelled',
          subtitle: 'This booking has been cancelled',
        };
      default:
        return {
          color: '#6B7280',
          bg: '#F9FAFB',
          border: '#E5E7EB',
          icon: 'info',
          title: 'Loading...',
          subtitle: '',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Distance from driver to pickup (km) — only when driver location is known
  const driverToPickupKm = useMemo(() => {
    if (!driverLocation || !pickupCoords) return null;
    return haversineKm(
      driverLocation.latitude, driverLocation.longitude,
      pickupCoords.latitude, pickupCoords.longitude,
    );
  }, [driverLocation, pickupCoords]);

  // Convert [lng, lat][] route to {latitude, longitude}[] for react-native-maps
  const polylineCoords = useMemo(() => {
    const coords = routeCoordinates || [pickupCenter, dropCenter];
    return coords.map(c => ({ latitude: c[1], longitude: c[0] }));
  }, [routeCoordinates, pickupCenter, dropCenter]);

  // Pick vehicle icon name based on vehicle type
  const getVehicleIcon = () => {
    switch (vehicleType) {
      case 'bike':
        return 'two-wheeler';
      case 'auto':
        return 'electric-rickshaw';
      case 'mini_truck':
      case 'truck':
        return 'local-shipping';
      case 'cab':
      case 'car':
        return 'directions-car';
      default:
        return 'two-wheeler';
    }
  };

  return (
    <View style={styles.container}>
      {/* Google Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: pickupCenter[1],
          longitude: pickupCenter[0],
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={() => setMapReady(true)}
        onPress={collapseSheet}
        showsUserLocation={false}
        toolbarEnabled={false}
        userInterfaceStyle="light"
        customMapStyle={MAP_STYLE}
      >
        {/* Route line between pickup and drop */}
        <Polyline
          coordinates={polylineCoords}
          strokeColor="#2563EB"
          strokeWidth={4}
        />

        {/* Pickup Marker — blue location pin */}
        <Marker
          coordinate={{ latitude: pickupCenter[1], longitude: pickupCenter[0] }}
          title="Pickup"
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.markerBubble, styles.pickupBubble]}>
              <Icon name="location-on" size={20} color="#FFFFFF" />
            </View>
            <View style={[styles.markerArrow, { borderTopColor: '#2563EB' }]} />
          </View>
        </Marker>

        {/* Drop Marker — green flag pin */}
        <Marker
          coordinate={{ latitude: dropCenter[1], longitude: dropCenter[0] }}
          title="Drop-off"
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.markerBubble, styles.dropBubble]}>
              <Icon name="flag" size={20} color="#FFFFFF" />
            </View>
            <View style={[styles.markerArrow, { borderTopColor: '#059669' }]} />
          </View>
        </Marker>

        {/* Driver Marker — smoothly glides between live fixes (after accept) */}
        {driverLocation && driverAnim.current && bookingStatus !== 'searching' && (
          <MarkerAnimated
            coordinate={driverAnim.current as any}
            title={driver?.name || 'Rider'}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.driverMarkerContainer}>
              <View style={styles.driverMarkerPulse} />
              <View style={styles.driverMarkerBubble}>
                <Icon name={getVehicleIcon()} size={20} color="#FFFFFF" />
              </View>
            </View>
          </MarkerAnimated>
        )}
      </MapView>

      {/* Map Loading Overlay */}
      {!mapReady && (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        </View>
      )}

      {/* Overlay Content */}
      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        {/* Top Bar - Status Badge */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (isRealBooking && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              }
            }}
          >
            <Icon name="arrow-back" size={ms(24)} color="#1F2937" />
          </TouchableOpacity>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
            {bookingStatus === 'searching' ? (
              <ActivityIndicator size="small" color={statusConfig.color} style={{ marginRight: ms(8) }} />
            ) : (
              <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            )}
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
              {statusConfig.title}
            </Text>
          </View>
        </View>

        {/* Bottom Card — draggable: pull the handle (or tap the map) to reveal the map */}
        <Animated.View
          style={[styles.bottomCard, { transform: [{ translateY: sheetTranslateY }], paddingBottom: ms(16) + insets.bottom }]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            sheetCollapseYRef.current = Math.max(0, h - SHEET_PEEK);
          }}
        >
          {/* Dynamic status accent line */}
          <View style={[styles.bottomCardAccent, { backgroundColor: statusConfig.color }]} />
          {/* Drag zone — grab here to slide the sheet down/up (tap to toggle) */}
          <View style={styles.sheetDragZone} {...sheetPanResponder.panHandlers}>
            <View style={styles.bottomCardHandle} />
          </View>

          {/* Status Header */}
          <View style={styles.statusHeaderRow}>
            <View style={[styles.statusIconBox, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
              <Icon name={statusConfig.icon as any} size={ms(20)} color={statusConfig.color} />
            </View>
            <View style={styles.statusTitleCol}>
              <Text style={[styles.statusTitleMain, { color: statusConfig.color }]}>{statusConfig.title}</Text>
              <Text style={styles.statusSubtitleMain}>{statusConfig.subtitle}</Text>
            </View>
            {bookingStatus === 'searching' && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{searchCountdown}s</Text>
              </View>
            )}
            {(bookingStatus === 'assigned' || bookingStatus === 'arriving') && driverToPickupKm !== null && (
              <View style={styles.distanceBadgeModern}>
                <Icon name="schedule" size={ms(16)} color="#2563EB" />
                <Text style={styles.distanceBadgeTextModern}>
                  {driverToPickupKm < 1
                    ? `${Math.round(driverToPickupKm * 1000)} m`
                    : `${driverToPickupKm.toFixed(1)} km`} away
                </Text>
              </View>
            )}
          </View>

          {bookingStatus === 'searching' && (
             <View style={styles.countdownBarBg}>
               <View style={[styles.countdownBarFill, { width: `${(searchCountdown / 60) * 100}%` }]} />
             </View>
          )}

          {/* +₹10 button — after progress bar, prominent, mid-card */}
          {bookingStatus === 'searching' && (
            <TouchableOpacity
              style={styles.fareIncreaseBtnFull}
              onPress={handleIncreaseFare}
              disabled={fareIncreasing}
            >
              {fareIncreasing
                ? <ActivityIndicator size="small" color="#2563EB" />
                : (
                  <>
                    <Icon name="trending-up" size={ms(16)} color="#2563EB" style={{ marginRight: ms(6) }} />
                    <Text style={styles.fareIncreaseBtnText}>+ ₹10 to attract riders</Text>
                  </>
                )
              }
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          {/* Driver Card (when assigned) */}
          {driver && bookingStatus !== 'searching' && (
            <View style={styles.driverCard}>
              {/* Rider photo, with initials fallback */}
              <View style={styles.driverAvatarNew}>
                {driver.profile_image ? (
                  <Image
                    source={{ uri: driver.profile_image }}
                    style={styles.driverAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.driverInitial}>{driver.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>

              {/* Info column */}
              <View style={styles.driverInfoNew}>
                <Text style={styles.driverNameNew}>{driver.name}</Text>
                <View style={styles.driverMetaRow}>
                  <View style={styles.vehicleTypeBadge}>
                    <Icon name={getVehicleIcon() as any} size={ms(11)} color="#2563EB" />
                    <Text style={styles.vehicleTypeBadgeText}>{vehicleType.toUpperCase()}</Text>
                  </View>
                  {driver.vehicle_number ? (
                    <Text style={styles.vehicleNumberText}>{driver.vehicle_number}</Text>
                  ) : null}
                </View>
                {driver.rating != null && (
                  <View style={styles.driverRatingRow}>
                    <Icon name="star" size={ms(13)} color="#F59E0B" />
                    <Text style={styles.driverRatingText}>{Number(driver.rating).toFixed(1)}</Text>
                    {driver.total_trips ? (
                      <Text style={styles.driverTripsText}>· {driver.total_trips} trips</Text>
                    ) : null}
                  </View>
                )}
              </View>

              {/* Call button */}
              <TouchableOpacity style={styles.callBtnNew} onPress={handleCall} activeOpacity={0.8}>
                <Icon name="call" size={ms(18)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Sections */}
          {pickupOtp && !pickupOtpVerified && (bookingStatus === 'assigned' || bookingStatus === 'arriving') && (
            <View style={styles.otpCardNew}>
              <View style={[styles.otpIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Icon name="lock" size={ms(16)} color="#2563EB" />
              </View>
              <View style={styles.otpCardTextCol}>
                <Text style={styles.otpCardLabel}>Pickup OTP</Text>
                <Text style={styles.otpCardSub}>Share with your rider</Text>
              </View>
              <OTPDigits code={pickupOtp} color="#1E40AF" />
            </View>
          )}

          {otp && !deliveryOtpVerified && bookingStatus === 'in_progress' && (
            <View style={[styles.otpCardNew, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
              <View style={[styles.otpIconBox, { backgroundColor: '#BBF7D0' }]}>
                <Icon name="verified" size={ms(16)} color="#059669" />
              </View>
              <View style={styles.otpCardTextCol}>
                <Text style={[styles.otpCardLabel, { color: '#065F46' }]}>Delivery OTP</Text>
                <Text style={[styles.otpCardSub, { color: '#059669' }]}>Confirm delivery</Text>
              </View>
              <OTPDigits code={otp} color="#059669" />
            </View>
          )}

          {/* Route Card */}
          <View style={styles.routeCardNew}>
            <View style={styles.routeRowNew}>
              {/* Timeline dots */}
              <View style={styles.routeIconColNew}>
                <View style={styles.routeOriginDot} />
                <View style={styles.routeConnectorNew} />
                <View style={styles.routeDestDot} />
              </View>
              {/* Addresses */}
              <View style={styles.routeAddressColNew}>
                <View style={styles.routeAddressItemNew}>
                  <Text style={styles.routeAddressLabelNew}>PICKUP</Text>
                  <Text style={styles.routeAddressTextNew} numberOfLines={2}>{pickup || 'Pickup location'}</Text>
                </View>
                <View style={styles.routeInlineDivider} />
                <View style={styles.routeAddressItemNew}>
                  <Text style={[styles.routeAddressLabelNew, { color: '#EF4444' }]}>DROP</Text>
                  <Text style={styles.routeAddressTextNew} numberOfLines={2}>{drop || 'Drop location'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Actions */}
          {bookingStatus === 'completed' ? (
            /* ── Post-delivery payment section ── */
            <View style={styles.postDeliverySection}>
              {paidBy === 'sender' && !paymentDone ? (
                /* Customer (sender) needs to pay */
                <View style={styles.paymentDueCard}>
                  <View style={styles.paymentDueHeader}>
                    <View style={styles.paymentDueIconBox}>
                      <Icon name="payments" size={ms(22)} color="#2563EB" />
                    </View>
                    <View style={styles.paymentDueTextCol}>
                      <Text style={styles.paymentDueTitle}>Payment Due</Text>
                      <Text style={styles.paymentDueSub}>Complete your delivery payment</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentDueAmount}>₹{money(liveFare)}</Text>
                  <TouchableOpacity
                    style={styles.payNowBtnLarge}
                    onPress={handleOnlinePayment}
                    disabled={paymentLoading}
                    activeOpacity={0.85}
                  >
                    {paymentLoading
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <>
                          <Icon name="lock" size={ms(16)} color="#FFFFFF" style={{ marginRight: ms(6) }} />
                          <Text style={styles.payNowBtnLargeText}>Pay ₹{money(liveFare)} Securely</Text>
                        </>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.homeGhostBtn}
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
                  >
                    <Text style={styles.homeGhostBtnText}>Pay Later · Go Home</Text>
                  </TouchableOpacity>
                </View>
              ) : paidBy === 'receiver' ? (
                /* Receiver pays — sender doesn't owe anything */
                <View style={styles.receiverPaysCard}>
                  <Icon name="check-circle" size={ms(28)} color="#059669" />
                  <View style={styles.receiverPaysText}>
                    <Text style={styles.receiverPaysTitle}>Delivery Complete</Text>
                    <Text style={styles.receiverPaysSub}>Receiver pays — fare collected at delivery</Text>
                  </View>
                </View>
              ) : (
                /* Payment done */
                <View style={styles.paidCard}>
                  <Icon name="check-circle" size={ms(28)} color="#059669" />
                  <View style={styles.paidCardText}>
                    <Text style={styles.paidCardTitle}>Payment Complete</Text>
                    <Text style={styles.paidCardSub}>₹{money(liveFare)} paid successfully</Text>
                  </View>
                </View>
              )}
              {(paidBy !== 'sender' || paymentDone) && (
                <TouchableOpacity
                  style={[styles.homeBtnModern, { marginTop: ms(12) }]}
                  onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
                >
                  <Text style={styles.homeBtnTextModern}>Home</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : bookingStatus === 'cancelled' ? (
            <View style={styles.bottomActionsRow}>
              <View style={styles.fareContainerModern}>
                <Text style={styles.fareLabelModern}>Fare</Text>
                <Text style={styles.fareValueModern}>₹{money(liveFare)}</Text>
              </View>
              <TouchableOpacity
                style={styles.homeBtnModern}
                onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
              >
                <Text style={styles.homeBtnTextModern}>Home</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Active booking — show fare + cancel */
            <View style={styles.bottomActionsRow}>
              <View style={styles.fareContainerModern}>
                <Text style={styles.fareLabelModern}>
                  {paidBy === 'receiver' ? 'Receiver Pays' : 'To Pay'}
                </Text>
                <View style={styles.fareAmountRow}>
                  <Text style={styles.fareValueModern}>₹{money(liveFare)}</Text>
                  <View style={styles.paymentMethodBadge}>
                    <Text style={styles.paymentMethodModern}>
                      {paidBy === 'receiver' ? 'RECEIVER' : 'ONLINE'}
                    </Text>
                  </View>
                </View>
              </View>
              {/* Cancel is only allowed before pickup — once the trip is in
                  progress (pickup OTP verified) the order can no longer be cancelled. */}
              {bookingStatus !== 'in_progress' && (
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={styles.cancelBtnModern} onPress={handleCancel}>
                    <Text style={styles.cancelBtnTextModern}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </SafeAreaView>

      {/* ── Fare Increase / Retry Modal ── */}
      <Modal visible={retryModalVisible} transparent animationType="fade">
        <View style={styles.retryOverlay}>
          <View style={styles.retryCard}>
            <View style={styles.retryIconBox}>
              <Icon name="search-off" size={ms(32)} color="#F59E0B" />
            </View>
            <Text style={styles.retryTitle}>No Rider Found</Text>
            <Text style={styles.retrySub}>
              No riders accepted your booking in 60 seconds.{'\n'}
              Increase the fare to attract more riders nearby.
            </Text>

            <View style={styles.retryFareRow}>
              <View style={styles.retryFareBox}>
                <Text style={styles.retryFareLabel}>Current Fare</Text>
                <Text style={styles.retryFareOld}>₹{money(currentFare)}</Text>
              </View>
              <Icon name="arrow-forward" size={ms(20)} color="#9CA3AF" />
              <View style={[styles.retryFareBox, styles.retryFareBoxNew]}>
                <Text style={styles.retryFareLabel}>New Fare</Text>
                <Text style={styles.retryFareNew}>₹{money(suggestedFare)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.retryAcceptBtn}
              onPress={handleRetrySearch}
              disabled={retryLoading}
            >
              {retryLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.retryAcceptText}>Search Again at ₹{money(suggestedFare)}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.retryCancelBtn} onPress={handleCancelFromRetry}>
              <Text style={styles.retryCancelText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={successModal} transparent animationType="none">
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successContainer,
              {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
              },
            ]}
          >
            {confettiAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confettiDot,
                  {
                    backgroundColor: confettiColors[i % confettiColors.length],
                    opacity: anim.opacity,
                    transform: [
                      { translateX: anim.translateX },
                      { translateY: anim.translateY },
                      { scale: anim.scale },
                      {
                        rotate: anim.rotate.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '210deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}

            <Animated.View
              style={[
                styles.successCheckCircle,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              <Icon name="check" size={46} color="#FFFFFF" />
            </Animated.View>

            <Text style={styles.successTitle}>Booking Created</Text>
            <Text style={styles.successSubtitle}>
              {paidByParam === 'receiver'
                ? 'Receiver pays — fare collected at delivery.'
                : 'Pay after delivery. Rider search has started.'}
            </Text>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !cancelling && setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalContainer}>
            <ScrollView
              style={styles.cancelModalScroll}
              contentContainerStyle={styles.cancelModalScrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.cancelModalHeader}>
                <View style={styles.cancelModalIconWrap}>
                  <Icon name="warning" size={28} color="#F59E0B" />
                </View>
                <Text style={styles.cancelModalTitle}>Cancel Booking</Text>
                <Text style={styles.cancelModalSubtitle}>
                  Booking #{bookingId?.slice(0, 8)}
                </Text>
              </View>

              <Text style={styles.cancelReasonLabel}>Select a reason:</Text>
              <View style={styles.reasonList}>
                {CANCEL_REASONS.map(reason => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonOption,
                      cancelReason === reason && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setCancelReason(reason)}
                    activeOpacity={0.7}
                    disabled={cancelling}
                  >
                    <View
                      style={[
                        styles.reasonRadio,
                        cancelReason === reason && styles.reasonRadioSelected,
                      ]}
                    >
                      {cancelReason === reason && <View style={styles.reasonRadioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.reasonOptionText,
                        cancelReason === reason && styles.reasonOptionTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[
                    styles.reasonOption,
                    cancelReason === 'custom' && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setCancelReason('custom')}
                  activeOpacity={0.7}
                  disabled={cancelling}
                >
                  <View
                    style={[
                      styles.reasonRadio,
                      cancelReason === 'custom' && styles.reasonRadioSelected,
                    ]}
                  >
                    {cancelReason === 'custom' && <View style={styles.reasonRadioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.reasonOptionText,
                      cancelReason === 'custom' && styles.reasonOptionTextSelected,
                    ]}
                  >
                    Other reason
                  </Text>
                </TouchableOpacity>

                {cancelReason === 'custom' && (
                  <TextInput
                    style={styles.customReasonInput}
                    placeholder="Type your reason..."
                    placeholderTextColor="#94A3B8"
                    value={customCancelReason}
                    onChangeText={setCustomCancelReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!cancelling}
                  />
                )}
              </View>

              <View style={styles.cancelModalActions}>
                <TouchableOpacity
                  style={styles.cancelModalKeep}
                  onPress={() => setCancelModalVisible(false)}
                  disabled={cancelling}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelModalKeepText}>Keep Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cancelModalConfirm,
                    (!cancelReason ||
                      (cancelReason === 'custom' && !customCancelReason.trim())) &&
                      styles.cancelModalConfirmDisabled,
                  ]}
                  onPress={handleConfirmCancel}
                  disabled={
                    cancelling ||
                    !cancelReason ||
                    (cancelReason === 'custom' && !customCancelReason.trim())
                  }
                  activeOpacity={0.7}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="close" size={18} color="#FFFFFF" />
                      <Text style={styles.cancelModalConfirmText}>Cancel Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rate the rider after a completed delivery */}
      <RatingModal
        visible={showRating}
        bookingId={realBookingId || bookingId}
        driverName={driver?.name}
        // Keep the pending flag on dismiss so Home can re-surface it; clear on submit.
        onClose={() => setShowRating(false)}
        onSubmitted={() => { clearPendingRating(); }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  // Top section
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingTop: ms(8),
    gap: ms(12),
  },
  backButton: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(2) },
    shadowOpacity: 0.1,
    shadowRadius: ms(8),
    elevation: 3,
  },
  statusBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderRadius: ms(24),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(2) },
    shadowOpacity: 0.08,
    shadowRadius: ms(8),
    elevation: 3,
  },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    marginRight: ms(8),
  },
  statusBadgeText: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  // ── Map Markers ───────────────────────────────────────────────────────────
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: ms(2.5),
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(4) },
    shadowOpacity: 0.35,
    shadowRadius: ms(6),
    elevation: 10,
  },
  pickupBubble: {
    backgroundColor: '#2563EB',
  },
  dropBubble: {
    backgroundColor: '#EF4444',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: ms(8),
    borderRightWidth: ms(8),
    borderTopWidth: ms(10),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: ms(-2),
  },
  // ── Driver moving marker ──────────────────────────────────────────────────
  driverMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarkerPulse: {
    position: 'absolute',
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  driverMarkerBubble: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: ms(3),
    borderColor: '#FFFFFF',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: ms(4) },
    shadowOpacity: 0.45,
    shadowRadius: ms(8),
    elevation: 12,
  },
  // Modern Bottom Card
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingHorizontal: ms(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(-10) },
    shadowOpacity: 0.15,
    shadowRadius: ms(20),
    elevation: 20,
    overflow: 'hidden',
  },
  bottomCardAccent: {
    height: ms(4),
    marginHorizontal: -ms(20),
    marginBottom: ms(14),
  },
  // Generous grab area around the visual handle so the sheet is easy to drag.
  sheetDragZone: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: ms(2),
    paddingBottom: ms(12),
  },
  bottomCardHandle: {
    width: ms(44),
    height: ms(5),
    backgroundColor: '#D1D5DB',
    borderRadius: ms(3),
    alignSelf: 'center',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    justifyContent: 'space-between',
    marginBottom: ms(12),
  },
  statusIconBox: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(14),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statusTitleCol: {
    flex: 1,
  },
  statusTitleMain: {
    fontSize: fs(15),
    fontWeight: '700',
    marginBottom: ms(1),
  },
  statusSubtitleMain: {
    fontSize: fs(12),
    color: '#6B7280',
    fontWeight: '400',
  },
  countdownBadge: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    backgroundColor: '#FEF3C7',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  countdownText: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#D97706',
  },
  distanceBadgeModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
    borderRadius: ms(20),
    gap: ms(6),
  },
  distanceBadgeTextModern: {
    fontSize: fs(13),
    color: '#2563EB',
    fontWeight: '700',
  },
  countdownBarBg: {
    height: ms(4),
    backgroundColor: '#FEF3C7',
    borderRadius: ms(2),
    marginTop: ms(8),
    overflow: 'hidden',
  },
  countdownBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: ms(2),
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: ms(16),
  },
  // ── Driver Card (redesigned) ──────────────────────────────────────────────
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: ms(10),
    marginBottom: ms(10),
    gap: ms(10),
  },
  driverAvatarNew: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: ms(3) },
    shadowOpacity: 0.3,
    shadowRadius: ms(6),
    elevation: 5,
    overflow: 'hidden',
  },
  driverAvatarImage: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
  },
  driverInitial: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  driverInfoNew: {
    flex: 1,
    gap: ms(2),
  },
  driverNameNew: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#111827',
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  vehicleTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
    backgroundColor: '#EFF6FF',
    borderRadius: ms(5),
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  vehicleTypeBadgeText: {
    fontSize: fs(9),
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  vehicleNumberText: {
    fontSize: fs(11),
    color: '#6B7280',
    fontWeight: '600',
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  driverRatingText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#D97706',
  },
  driverTripsText: {
    fontSize: fs(11),
    color: '#9CA3AF',
  },
  callBtnNew: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: ms(3) },
    shadowOpacity: 0.3,
    shadowRadius: ms(6),
    elevation: 4,
  },
  // ── OTP Card (redesigned) ─────────────────────────────────────────────────
  otpCardNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
    gap: ms(10),
    marginBottom: ms(10),
  },
  otpIconBox: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  otpCardTextCol: { flex: 1, minWidth: 0 },
  otpCardLabel: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#1E40AF',
  },
  otpCardSub: {
    fontSize: fs(11),
    color: '#3B82F6',
    marginTop: ms(1),
  },
  otpInline: {
    fontSize: fs(18),
    fontWeight: '800',
    letterSpacing: ms(2),
    flexShrink: 0,
  },
  // ── Route Card (redesigned) ───────────────────────────────────────────────
  routeCardNew: {
    backgroundColor: '#F9FAFB',
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: ms(14),
    marginBottom: ms(14),
  },
  routeRowNew: {
    flexDirection: 'row',
    gap: ms(12),
  },
  routeIconColNew: {
    alignItems: 'center',
    paddingVertical: ms(4),
    width: ms(14),
  },
  routeOriginDot: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  routeConnectorNew: {
    width: 2,
    flex: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: ms(4),
    minHeight: ms(28),
  },
  routeDestDot: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  routeAddressColNew: {
    flex: 1,
    gap: ms(6),
  },
  routeAddressItemNew: {
    gap: ms(2),
  },
  routeAddressLabelNew: {
    fontSize: fs(9),
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
  },
  routeAddressTextNew: {
    fontSize: fs(13),
    fontWeight: '500',
    color: '#374151',
    lineHeight: fs(18),
  },
  routeInlineDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: ms(2),
  },
  // ── Kept for backwards compat (used in other areas) ───────────────────────
  actionRowModern: {
    flexDirection: 'row',
    gap: ms(12),
  },
  actionIconBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  // Bottom Actions Row
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareContainerModern: {
    flex: 1,
  },
  fareLabelModern: {
    fontSize: fs(13),
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: ms(2),
  },
  fareAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  fareValueModern: {
    fontSize: fs(22),
    fontWeight: '800',
    color: '#111827',
  },
  paymentMethodBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(6),
  },
  paymentMethodModern: {
    fontSize: fs(10),
    fontWeight: '700',
    color: '#4B5563',
  },
  fareIncreaseBtn: {
    marginTop: ms(6),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: ms(8),
    paddingVertical: ms(5),
    paddingHorizontal: ms(10),
    alignSelf: 'flex-start',
  },
  fareIncreaseBtnFull: {
    marginTop: ms(12),
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: ms(12),
    paddingVertical: ms(12),
    paddingHorizontal: ms(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareIncreaseBtnText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: fs(13),
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  // ── Retry modal ───────────────────────────────────────────────────────────
  retryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ms(20),
  },
  retryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: ms(24),
    width: '100%',
    alignItems: 'center',
  },
  retryIconBox: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(14),
  },
  retryTitle: {
    fontSize: fs(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: ms(8),
  },
  retrySub: {
    fontSize: fs(14),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: ms(20),
  },
  retryFareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    marginBottom: ms(10),
    width: '100%',
    justifyContent: 'center',
  },
  retryFareBox: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: ms(12),
    paddingVertical: ms(10),
    paddingHorizontal: ms(20),
  },
  retryFareBoxNew: {
    backgroundColor: '#ECFDF5',
  },
  retryFareLabel: {
    fontSize: fs(11),
    color: '#6B7280',
    marginBottom: ms(2),
  },
  retryFareOld: {
    fontSize: fs(20),
    fontWeight: '700',
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  retryFareNew: {
    fontSize: fs(20),
    fontWeight: '700',
    color: '#059669',
  },
  retryNote: {
    fontSize: fs(12),
    color: '#9CA3AF',
    marginBottom: ms(20),
  },
  retryAcceptBtn: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: ms(14),
    width: '100%',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  retryAcceptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fs(15),
  },
  retryCancelBtn: {
    paddingVertical: ms(12),
    width: '100%',
    alignItems: 'center',
  },
  retryCancelText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: fs(14),
  },
  payNowBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: ms(20),
    paddingVertical: ms(14),
    borderRadius: ms(12),
    minWidth: ms(90),
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fs(14),
  },
  // ── Post-delivery payment styles ──────────────────────────────────────────
  postDeliverySection: {
    marginTop: ms(4),
  },
  paymentDueCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: ms(16),
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: ms(16),
    alignItems: 'center',
  },
  paymentDueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: ms(10),
    marginBottom: ms(12),
  },
  paymentDueIconBox: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentDueTextCol: { flex: 1 },
  paymentDueTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#1E40AF',
  },
  paymentDueSub: {
    fontSize: fs(12),
    color: '#3B82F6',
    marginTop: ms(2),
  },
  paymentDueAmount: {
    fontSize: fs(32),
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: ms(16),
  },
  payNowBtnLarge: {
    backgroundColor: '#2563EB',
    borderRadius: ms(14),
    paddingVertical: ms(16),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: ms(4) },
    shadowOpacity: 0.35,
    shadowRadius: ms(8),
    elevation: 6,
    marginBottom: ms(10),
  },
  payNowBtnLargeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fs(15),
  },
  homeGhostBtn: {
    paddingVertical: ms(10),
    alignItems: 'center',
  },
  homeGhostBtnText: {
    color: '#6B7280',
    fontSize: fs(13),
    fontWeight: '600',
  },
  receiverPaysCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: '#F0FDF4',
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: ms(14),
  },
  receiverPaysText: { flex: 1 },
  receiverPaysTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#065F46',
  },
  receiverPaysSub: {
    fontSize: fs(12),
    color: '#059669',
    marginTop: ms(2),
  },
  paidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: '#F0FDF4',
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: ms(14),
  },
  paidCardText: { flex: 1 },
  paidCardTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#065F46',
  },
  paidCardSub: {
    fontSize: fs(12),
    color: '#059669',
    marginTop: ms(2),
  },
  cancelBtnModern: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: ms(24),
    paddingVertical: ms(14),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnTextModern: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: fs(15),
  },
  homeBtnModern: {
    backgroundColor: '#2563EB',
    paddingHorizontal: ms(24),
    paddingVertical: ms(14),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnTextModern: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fs(15),
    textAlign: 'center',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    width: SCREEN_WIDTH * 0.82,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 34,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  successCheckCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  confettiDot: {
    position: 'absolute',
    width: 9,
    height: 16,
    borderRadius: 3,
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -4.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  cancelModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.78,
  },
  cancelModalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cancelModalScrollContent: {
    paddingBottom: 34,
  },
  cancelModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cancelModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  cancelReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  reasonList: {
    marginBottom: 14,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  reasonOptionSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reasonRadioSelected: {
    borderColor: '#F59E0B',
  },
  reasonRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  reasonOptionText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  reasonOptionTextSelected: {
    color: '#92400E',
    fontWeight: '600',
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 90,
    fontSize: 14,
    color: '#1E293B',
    marginTop: 4,
    marginBottom: 6,
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalKeep: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelModalKeepText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  cancelModalConfirm: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    gap: 6,
  },
  cancelModalConfirmDisabled: {
    opacity: 0.45,
  },
  cancelModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LiveTracking;
