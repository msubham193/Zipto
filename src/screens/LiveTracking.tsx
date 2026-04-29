import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  Animated,
  Easing,
  Vibration,
  TextInput,
  ScrollView,
  PixelRatio,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { vehicleApi } from '../api/vehicle';
import { googleMapsApi } from '../api/googleMaps';
import { useBookingStore } from '../store/useBookingStore';

const { width, height } = Dimensions.get('window');

const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;

const scaleW = (size: number) => (width / BASE_WIDTH) * size;
const scaleH = (size: number) => (height / BASE_HEIGHT) * size;

const ms = (size: number, factor = 0.45) =>
  size + (scaleW(size) - size) * factor;

const fs = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(ms(size)));

type BookingStatus = 'searching' | 'assigned' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';

interface DriverInfo {
  name: string;
  phone: string;
  vehicle_number?: string;
  rating?: number;
  total_trips?: number;
}

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
  'Driver taking too long',
  'Wrong pickup/drop location',
  'Booked by mistake',
];

const LiveTracking = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);

  const {
    bookingId,
    pickup = '',
    drop = '',
    pickupCoords,
    dropCoords,
    vehicleType = 'bike',
    fare = 0,
    showBookingSuccess = false,
    paymentMethod = 'cash',
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
  const [mapReady, setMapReady] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [searchCountdown, setSearchCountdown] = useState(60);
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
            name: data.driver.name || 'Driver',
            phone: data.driver.phone || '',
            vehicle_number: data.driver.vehicle_number,
            rating: (data as any).driver_stats?.average_rating ?? data.driver.rating,
            total_trips: (data as any).driver_stats?.total_trips,
          });
        }
        if (data.delivery_otp)        setOtp(data.delivery_otp);
        if (data.pickup_otp)           setPickupOtp(data.pickup_otp);
        if (data.pickup_otp_verified != null)  setPickupOtpVerified(!!data.pickup_otp_verified);
        if (data.delivery_otp_verified != null) setDeliveryOtpVerified(!!data.delivery_otp_verified);
        if (data.driver_location)      setDriverLocation(data.driver_location);
      }
    } catch (err: any) {
      console.log('Booking fetch error:', err?.message);
    }
  }, [bookingId, bookingStatus, realBookingId]);

  // Initial fetch
  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

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

  // 60-second countdown while searching
  useEffect(() => {
    if (bookingStatus !== 'searching') return;
    if (searchCountdown <= 0) {
      // Time's up — mark cancelled
      setBookingStatus('cancelled');
      clearActiveBooking();
      return;
    }
    const timer = setTimeout(() => setSearchCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [bookingStatus, searchCountdown]);

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

  // Fit map to show all markers (pickup, drop, driver if present)
  const lastFitRef = useRef(0);
  useEffect(() => {
    if (!mapRef.current || !pickupCoords || !dropCoords) return;
    // Throttle to max once per 5s to prevent jank from driver location updates
    const now = Date.now();
    if (now - lastFitRef.current < 5000) return;
    lastFitRef.current = now;

    const points = [
      { latitude: pickupCenter[1], longitude: pickupCenter[0] },
      { latitude: dropCenter[1], longitude: dropCenter[0] },
    ];
    if (driverLocation) {
      points.push(driverLocation);
    }
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 80, bottom: 300, left: 80 },
      animated: true,
    });
  }, [dropCenter, dropCoords, pickupCenter, pickupCoords, driverLocation]);

  const handleCall = () => {
    if (driver?.phone) {
      Linking.openURL(`tel:${driver.phone}`);
    } else {
      Alert.alert('Unavailable', 'Driver phone number is not available yet.');
    }
  };

  const handleCancel = () => {
    if (!bookingId) {
      Alert.alert('Unable to Cancel', 'Booking ID not found.');
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
        Alert.alert(
          'Cancel Failed',
          response.message || 'Could not cancel booking. Please try again.',
        );
        return;
      }

      setBookingStatus('cancelled');
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err: any) {
      setCancelling(false);
      Alert.alert(
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
          title: `Finding driver... ${searchCountdown}s`,
          subtitle: 'Please wait while we find the best driver for you',
        };
      case 'assigned':
        return {
          color: '#2563EB',
          bg: '#EFF6FF',
          border: '#BFDBFE',
          icon: 'person-pin',
          title: 'Driver assigned!',
          subtitle: 'Your driver is preparing to pick up',
        };
      case 'arriving':
        return {
          color: '#059669',
          bg: '#F0FDF4',
          border: '#BBF7D0',
          icon: 'directions-car',
          title: 'Driver on the way',
          subtitle: 'Your driver is heading to the pickup point',
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
          subtitle: 'Thank you for riding with Zipto!',
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
        showsUserLocation={false}
        toolbarEnabled={false}
        userInterfaceStyle="light"
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

        {/* Driver Marker — moving vehicle (only after driver accepts) */}
        {driverLocation && bookingStatus !== 'searching' && (
          <Marker
            coordinate={driverLocation}
            title={driver?.name || 'Driver'}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.driverMarkerContainer}>
              <View style={styles.driverMarkerPulse} />
              <View style={styles.driverMarkerBubble}>
                <Icon name={getVehicleIcon()} size={20} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
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
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Top Bar - Status Badge */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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

        {/* Bottom Card */}
        <View style={styles.bottomCard}>
          {/* Draggable handle indicator (visual only) */}
          <View style={styles.bottomCardHandle} />

          {/* Status Header */}
          <View style={styles.statusHeaderRow}>
            <View style={styles.statusTitleCol}>
              <Text style={styles.statusTitleMain}>{statusConfig.title}</Text>
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

          <View style={styles.divider} />

          {/* Driver Card (when assigned) */}
          {driver && bookingStatus !== 'searching' && (
            <View style={styles.driverSection}>
              <View style={styles.driverHeader}>
                <View style={styles.driverAvatar}>
                  <Icon name="person" size={ms(32)} color="#2563EB" />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.vehicleInfo}>{vehicleType.toUpperCase()} • {driver.vehicle_number || 'WAITING'}</Text>
                  {driver.rating != null && (
                    <View style={styles.ratingBadge}>
                      <Icon name="star" size={ms(12)} color="#F59E0B" />
                      <Text style={styles.ratingText}>{Number(driver.rating).toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.actionRowModern}>
                  <TouchableOpacity style={styles.actionIconBtn} onPress={handleCall}>
                    <Icon name="call" size={ms(20)} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIconBtn}>
                    <Icon name="chat" size={ms(20)} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* OTP Sections */}
          {pickupOtp && !pickupOtpVerified && (bookingStatus === 'assigned' || bookingStatus === 'arriving') && (
            <View style={styles.otpBlock}>
              <View style={styles.otpBlockLeft}>
                <Text style={styles.otpBlockLabel}>Pickup OTP</Text>
                <Text style={styles.otpBlockSub}>Share with partner</Text>
              </View>
              <View style={styles.otpBlockRight}>
                <Text style={styles.otpBigText}>{pickupOtp}</Text>
              </View>
            </View>
          )}

          {otp && !deliveryOtpVerified && bookingStatus === 'in_progress' && (
            <View style={[styles.otpBlock, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <View style={styles.otpBlockLeft}>
                <Text style={[styles.otpBlockLabel, { color: '#065F46' }]}>Delivery OTP</Text>
                <Text style={[styles.otpBlockSub, { color: '#059669' }]}>Share with partner</Text>
              </View>
              <View style={[styles.otpBlockRight, { borderLeftColor: '#BBF7D0' }]}>
                <Text style={[styles.otpBigText, { color: '#065F46', letterSpacing: ms(4) }]}>{otp}</Text>
              </View>
            </View>
          )}

          {/* Booking Details */}
          <View style={styles.routeSectionModern}>
            <View style={styles.routeRowModern}>
              <View style={styles.routeDotsModern}>
                <View style={[styles.routeDotModern, { backgroundColor: '#2563EB' }]} />
                <View style={styles.routeLineModern} />
                <View style={[styles.routeDotModern, { backgroundColor: '#EF4444' }]} />
              </View>
              <View style={styles.routeAddressesModern}>
                <View style={styles.routeItemModern}>
                  <Text style={styles.routeAddressTextModern} numberOfLines={1}>{pickup || 'Pickup location'}</Text>
                </View>
                <View style={styles.routeItemModern}>
                  <Text style={styles.routeAddressTextModern} numberOfLines={1}>{drop || 'Drop location'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cancel & Payment Details */}
          <View style={styles.bottomActionsRow}>
            <View style={styles.fareContainerModern}>
               <Text style={styles.fareLabelModern}>To Pay</Text>
               <View style={styles.fareAmountRow}>
                 <Text style={styles.fareValueModern}>₹{fare}</Text>
                 <View style={styles.paymentMethodBadge}>
                   <Text style={styles.paymentMethodModern}>{paymentMethod.toUpperCase()}</Text>
                 </View>
               </View>
            </View>

            {bookingStatus !== 'completed' && bookingStatus !== 'cancelled' ? (
              <TouchableOpacity style={styles.cancelBtnModern} onPress={handleCancel}>
                <Text style={styles.cancelBtnTextModern}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.homeBtnModern}
                onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
              >
                <Text style={styles.homeBtnTextModern}>Home</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

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
              {paymentMethod === 'online'
                ? 'Payment successful. Driver search has started.'
                : 'Cash payment selected. Driver search has started.'}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    width,
    height,
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
    borderTopLeftRadius: ms(32),
    borderTopRightRadius: ms(32),
    padding: ms(20),
    paddingBottom: ms(30),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(-10) },
    shadowOpacity: 0.15,
    shadowRadius: ms(20),
    elevation: 20,
  },
  bottomCardHandle: {
    width: ms(40),
    height: ms(5),
    backgroundColor: '#E5E7EB',
    borderRadius: ms(3),
    alignSelf: 'center',
    marginBottom: ms(16),
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(12),
  },
  statusTitleCol: {
    flex: 1,
  },
  statusTitleMain: {
    fontSize: fs(22),
    fontWeight: '800',
    color: '#111827',
    marginBottom: ms(4),
  },
  statusSubtitleMain: {
    fontSize: fs(14),
    color: '#6B7280',
    fontWeight: '500',
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
  // Modern Driver Section
  driverSection: {
    marginBottom: ms(8),
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
    marginRight: ms(16),
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#111827',
    marginBottom: ms(2),
  },
  vehicleInfo: {
    fontSize: fs(13),
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: ms(4),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(8),
    alignSelf: 'flex-start',
  },
  ratingText: {
    marginLeft: ms(4),
    fontWeight: '700',
    color: '#D97706',
    fontSize: fs(12),
  },
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
  // Modern OTP Block
  otpBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    borderRadius: ms(16),
    padding: ms(16),
    marginTop: ms(8),
    marginBottom: ms(8),
  },
  otpBlockLeft: {
    flex: 1,
  },
  otpBlockLabel: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: ms(2),
  },
  otpBlockSub: {
    fontSize: fs(12),
    color: '#3B82F6',
  },
  otpBlockRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#BFDBFE',
    paddingLeft: ms(16),
  },
  otpBigText: {
    fontSize: fs(24),
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: ms(6),
  },
  // Route Section Modern
  routeSectionModern: {
    backgroundColor: '#F9FAFB',
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: ms(16),
    marginTop: ms(8),
  },
  routeRowModern: {
    flexDirection: 'row',
  },
  routeDotsModern: {
    alignItems: 'center',
    marginRight: ms(16),
    paddingVertical: ms(4),
  },
  routeDotModern: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  routeLineModern: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: ms(4),
  },
  routeAddressesModern: {
    flex: 1,
    justifyContent: 'space-between',
    height: ms(64),
  },
  routeItemModern: {
    flex: 1,
    justifyContent: 'center',
  },
  routeAddressTextModern: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#374151',
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
  },
  homeBtnTextModern: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fs(15),
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    width: width * 0.82,
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
    maxHeight: height * 0.78,
    overflow: 'hidden',
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
