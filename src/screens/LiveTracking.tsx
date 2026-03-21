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
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { vehicleApi } from '../api/vehicle';
import { mapboxApi } from '../api/mapbox';
import { useBookingStore } from '../store/useBookingStore';
import {MAPBOX_PUBLIC_TOKEN} from '../config/mapboxToken';

const { width, height } = Dimensions.get('window');

Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);

type BookingStatus = 'searching' | 'assigned' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';

interface DriverInfo {
  name: string;
  phone: string;
  vehicle_number?: string;
  rating?: number;
  total_trips?: number;
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
  const cameraRef = useRef<Mapbox.Camera>(null);

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
  } = route.params || {};

  const { updateActiveBookingId, updateActiveBookingStatus, clearActiveBooking } = useBookingStore();

  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('searching');
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [otp, setOtp] = useState<string | null>(null);
  const [pickupOtp, setPickupOtp] = useState<string | null>(null);
  // realBookingId is set once a driver accepts — until then we only have offer_id
  const [realBookingId, setRealBookingId] = useState<string | null>(null);
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
        } else if (status === 'in_progress' || status === 'picked_up') {
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
        if (data.delivery_otp) setOtp(data.delivery_otp);
        if (data.pickup_otp)   setPickupOtp(data.pickup_otp);
      }
    } catch (err: any) {
      console.log('Booking fetch error:', err?.message);
    }
  }, [bookingId, bookingStatus, realBookingId]);

  // Initial fetch
  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (bookingStatus !== 'completed' && bookingStatus !== 'cancelled') {
        fetchBookingDetails();
      }
    }, 5000);
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

  // Fetch actual road route from Mapbox Directions API
  useEffect(() => {
    const fetchRoute = async () => {
      const coords = await mapboxApi.getDirections(pickupCenter, dropCenter);
      if (coords) {
        setRouteCoordinates(coords);
      }
    };
    fetchRoute();
  }, [pickupCenter, dropCenter]);

  // Fit map to show both markers
  useEffect(() => {
    if (cameraRef.current && pickupCoords && dropCoords) {
      const minLng = Math.min(pickupCenter[0], dropCenter[0]);
      const maxLng = Math.max(pickupCenter[0], dropCenter[0]);
      const minLat = Math.min(pickupCenter[1], dropCenter[1]);
      const maxLat = Math.max(pickupCenter[1], dropCenter[1]);

      cameraRef.current.fitBounds(
        [maxLng, maxLat],
        [minLng, minLat],
        [80, 80, 300, 80],
        1000,
      );
    }
  }, [dropCenter, dropCoords, pickupCenter, pickupCoords]);

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
      Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
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

  // Use real route if available, fallback to straight line
  const routeLineGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates || [pickupCenter, dropCenter],
        },
      },
    ],
  };

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
      {/* MapBox Map */}
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onDidFailLoadingMap={() => setMapReady(true)}
      >
        <Mapbox.Camera
          ref={cameraRef}
          centerCoordinate={pickupCenter}
          zoomLevel={13}
          animationDuration={0}
        />

        {/* Route line between pickup and drop */}
        <Mapbox.ShapeSource id="routeLine" shape={routeLineGeoJSON}>
          <Mapbox.LineLayer
            id="routeLineLine"
            style={{
              lineColor: '#2563EB',
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </Mapbox.ShapeSource>

        {/* Vehicle Marker at Pickup */}
        <Mapbox.PointAnnotation
          id="vehicle-marker"
          coordinate={pickupCenter}
          title="Vehicle"
        >
          <View style={styles.vehicleMarkerContainer}>
            <View style={styles.vehicleMarker}>
              <Icon name={getVehicleIcon()} size={22} color="#FFFFFF" />
            </View>
            <View style={styles.vehicleMarkerArrow} />
          </View>
        </Mapbox.PointAnnotation>

        {/* Pickup dot */}
        <Mapbox.PointAnnotation
          id="pickup-marker"
          coordinate={pickupCenter}
          title="Pickup"
        >
          <View style={styles.pickupDotOuter}>
            <View style={styles.pickupDotInner} />
          </View>
        </Mapbox.PointAnnotation>

        {/* Drop Marker with vehicle icon */}
        <Mapbox.PointAnnotation
          id="drop-marker"
          coordinate={dropCenter}
          title="Drop"
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.dropMarker]}>
              <Icon name={getVehicleIcon()} size={16} color="#FFFFFF" />
            </View>
          </View>
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>

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
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
            {bookingStatus === 'searching' ? (
              <ActivityIndicator size="small" color={statusConfig.color} style={{ marginRight: 8 }} />
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
          {/* Status Info */}
          <View style={[styles.statusRow, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
            <Icon name={statusConfig.icon} size={24} color={statusConfig.color} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
                {statusConfig.title}
              </Text>
              <Text style={styles.statusSubtitle}>{statusConfig.subtitle}</Text>
            </View>
            {bookingStatus === 'searching' && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{searchCountdown}</Text>
              </View>
            )}
          </View>

          {/* Countdown progress bar */}
          {bookingStatus === 'searching' && (
            <View style={styles.countdownBarBg}>
              <View style={[styles.countdownBarFill, { width: `${(searchCountdown / 60) * 100}%` }]} />
            </View>
          )}

          {/* Pickup OTP — show when driver assigned but trip not started */}
          {pickupOtp && (bookingStatus === 'assigned' || bookingStatus === 'arriving') && (
            <View style={styles.otpContainer}>
              <View style={styles.otpLabelRow}>
                <Icon name="inventory" size={16} color="#2563EB" />
                <Text style={[styles.otpLabel, {color: '#2563EB', fontWeight: '700'}]}>
                  Pickup OTP — Share when driver arrives
                </Text>
              </View>
              <View style={styles.otpBox}>
                {pickupOtp.split('').map((digit, index) => (
                  <View key={index} style={[styles.otpDigit, {borderColor: '#2563EB', backgroundColor: '#EFF6FF'}]}>
                    <Text style={[styles.otpDigitText, {color: '#1E40AF'}]}>{digit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Delivery OTP — show during and after trip */}
          {otp && bookingStatus === 'in_progress' && (
            <View style={styles.otpContainer}>
              <View style={styles.otpLabelRow}>
                <Icon name="local-shipping" size={16} color="#059669" />
                <Text style={[styles.otpLabel, {color: '#059669', fontWeight: '700'}]}>
                  Delivery OTP — Share when package arrives
                </Text>
              </View>
              <View style={styles.otpBox}>
                {otp.split('').map((digit, index) => (
                  <View key={index} style={[styles.otpDigit, {borderColor: '#059669', backgroundColor: '#F0FDF4'}]}>
                    <Text style={[styles.otpDigitText, {color: '#065F46'}]}>{digit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Driver Card (when assigned) */}
          {driver && bookingStatus !== 'searching' && (
            <>
              <View style={styles.divider} />
              <View style={styles.driverHeader}>
                <View style={styles.driverAvatar}>
                  <Icon name="person" size={28} color="#2563EB" />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  {driver.vehicle_number && (
                    <Text style={styles.vehicleInfo}>{vehicleType} · {driver.vehicle_number}</Text>
                  )}
                  {driver.total_trips != null && driver.total_trips > 0 && (
                    <Text style={styles.tripsText}>{driver.total_trips} trips completed</Text>
                  )}
                </View>
                <View style={styles.driverBadgesCol}>
                  {driver.rating != null && (
                    <View style={styles.ratingBadge}>
                      <Icon name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{Number(driver.rating).toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                  <View style={styles.actionIcon}>
                    <Icon name="call" size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.actionText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <View style={styles.actionIcon}>
                    <Icon name="chat" size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.actionText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <View style={styles.actionIcon}>
                    <Icon name="share" size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Booking Details */}
          <View style={styles.divider} />
          <View style={styles.routeSection}>
            <View style={styles.routeRow}>
              <View style={styles.routeDots}>
                <View style={[styles.routeDot, { backgroundColor: '#2563EB' }]} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, { backgroundColor: '#059669' }]} />
              </View>
              <View style={styles.routeAddresses}>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>Pickup</Text>
                  <Text style={styles.routeAddress} numberOfLines={1}>{pickup || 'Pickup location'}</Text>
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>Drop-off</Text>
                  <Text style={styles.routeAddress} numberOfLines={1}>{drop || 'Drop location'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Fare & Vehicle */}
          <View style={styles.fareRow}>
            <View style={styles.fareItem}>
              <Icon name="local-shipping" size={18} color="#6B7280" />
              <Text style={styles.fareLabel}>{vehicleType}</Text>
            </View>
            <View style={styles.fareItem}>
              <Icon name="payments" size={18} color="#6B7280" />
              <Text style={styles.fareValue}>₹{fare}</Text>
            </View>
          </View>

          {/* Cancel Button */}
          {bookingStatus !== 'completed' && bookingStatus !== 'cancelled' && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Icon name="close" size={18} color="#DC2626" />
              <Text style={styles.cancelText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          {/* Go Home Button (completed/cancelled) */}
          {(bookingStatus === 'completed' || bookingStatus === 'cancelled') && (
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
            >
              <Icon name="home" size={20} color="#FFFFFF" />
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          )}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Markers
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pickupMarker: {
    backgroundColor: '#2563EB',
  },
  dropMarker: {
    backgroundColor: '#059669',
  },
  // Vehicle marker
  vehicleMarkerContainer: {
    alignItems: 'center',
  },
  vehicleMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  vehicleMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2563EB',
    marginTop: -2,
  },
  // Pickup dot
  pickupDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // Bottom Card
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Countdown
  countdownBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  countdownBarBg: {
    height: 4,
    backgroundColor: '#FDE68A',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  countdownBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  // OTP
  otpContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  otpLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  otpBox: {
    flexDirection: 'row',
    gap: 8,
  },
  otpDigit: {
    width: 40,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  otpDigitText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  // Driver
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  tripsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  driverBadgesCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '700',
    color: '#D97706',
    fontSize: 13,
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  // Route
  routeSection: {
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: 'row',
  },
  routeDots: {
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  routeAddresses: {
    flex: 1,
    justifyContent: 'space-between',
    height: 64,
  },
  routeItem: {
    flex: 1,
    justifyContent: 'center',
  },
  routeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 1,
  },
  routeAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  // Fare
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  fareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  fareValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  // Cancel
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  // Home button
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
