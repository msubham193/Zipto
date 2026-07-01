import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import BottomTabBar from '../../components/BottomTabBar';
import { OrderCardSkeleton } from '../../components/Skeleton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vehicleApi, BookingDetails } from '../../api/vehicle';
import { showAlert } from '../../components/CustomAlert';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs, SCREEN_WIDTH } from '../../utils/metrics';

const ACTIVE_STATUSES = ['pending', 'searching', 'accepted', 'assigned', 'driver_assigned', 'driver_arriving', 'arriving', 'in_progress', 'ongoing', 'picked_up'];
const COMPLETED_STATUSES = ['completed', 'delivered'];
const CANCELLED_STATUSES = ['cancelled'];
const RATED_BOOKINGS_KEY = 'bookfleet_rated_bookings';

type PaymentFilter = 'all' | 'paid' | 'unpaid';

const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price',
  'Rider taking too long',
  'Wrong pickup/drop location',
  'Booked by mistake',
];

const MyOrders = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState('active');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cancelModal, setCancelModal] = useState<{ bookingId: string; orderId: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Payment state
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  // Rating state
  const [ratingModal, setRatingModal] = useState<BookingDetails | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingTags, setRatingTags] = useState<string[]>([]);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedBookings, setRatedBookings] = useState<Record<string, number>>({});

  const RATING_CONFIG: Record<number, { label: string; emoji: string; color: string; bg: string }> = {
    1: { label: 'Poor',          emoji: '😞', color: '#EF4444', bg: '#FEF2F2' },
    2: { label: 'Below Average', emoji: '😐', color: '#F97316', bg: '#FFF7ED' },
    3: { label: 'Average',       emoji: '🙂', color: '#EAB308', bg: '#FEFCE8' },
    4: { label: 'Good',          emoji: '😊', color: '#22C55E', bg: '#F0FDF4' },
    5: { label: 'Excellent!',    emoji: '🤩', color: '#10B981', bg: '#ECFDF5' },
  };
  const RATING_TAGS = ['Fast delivery', 'Careful handling', 'Friendly rider', 'On time', 'Professional', 'Great service'];

  const toggleRatingTag = (tag: string) =>
    setRatingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    })),
  ).current;

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const response = await vehicleApi.getCustomerHistory();
      if (response.success && response.data?.bookings) {
        setBookings(response.data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Seed ratedBookings from AsyncStorage on mount so the modal never reappears
  // even if the API fetch fails on re-entry.
  useEffect(() => {
    AsyncStorage.getItem(RATED_BOOKINGS_KEY)
      .then(raw => {
        if (raw) {
          const persisted = JSON.parse(raw) as Record<string, number>;
          setRatedBookings(prev => ({ ...persisted, ...prev }));
        }
      })
      .catch(() => {});
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchBookings(true); };

  const isPaid = (b: BookingDetails) =>
    b.payments?.some(p => p.payment_status === 'completed') || false;

  const filterByPayment = (list: BookingDetails[]) => {
    if (paymentFilter === 'all') return list;
    if (paymentFilter === 'paid') return list.filter(isPaid);
    return list.filter(b => !isPaid(b));
  };

  const activeOrders = filterByPayment(bookings.filter(b => ACTIVE_STATUSES.includes(b.status?.toLowerCase())));
  const completedOrders = filterByPayment(bookings.filter(b => COMPLETED_STATUSES.includes(b.status?.toLowerCase())));
  const cancelledOrders = filterByPayment(bookings.filter(b => CANCELLED_STATUSES.includes(b.status?.toLowerCase())));

  const getTabCount = (tab: string) => {
    if (tab === 'active') return activeOrders.length;
    if (tab === 'completed') return completedOrders.length;
    return cancelledOrders.length;
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'delivered') return '#10B981';
    if (s === 'cancelled') return '#EF4444';
    if (s === 'in_progress' || s === 'ongoing' || s === 'picked_up') return '#7C3AED';
    if (s === 'assigned' || s === 'driver_assigned' || s === 'driver_arriving' || s === 'arriving' || s === 'accepted') return '#3B82F6';
    if (s === 'pending' || s === 'searching') return '#F59E0B';
    return '#64748B';
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'delivered') return 'check-circle';
    if (s === 'cancelled') return 'cancel';
    if (s === 'in_progress' || s === 'ongoing' || s === 'picked_up') return 'local-shipping';
    if (s === 'assigned' || s === 'driver_assigned' || s === 'driver_arriving' || s === 'arriving' || s === 'accepted') return 'person-pin';
    if (s === 'pending' || s === 'searching') return 'hourglass-top';
    return 'info';
  };

  const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'delivered') return 'Completed';
    if (s === 'cancelled') return 'Cancelled';
    if (s === 'in_progress' || s === 'ongoing' || s === 'picked_up') return 'In Transit';
    if (s === 'driver_arriving' || s === 'arriving') return 'Rider Arriving';
    if (s === 'assigned' || s === 'driver_assigned' || s === 'accepted') return 'Rider Assigned';
    if (s === 'searching') return 'Finding Rider';
    if (s === 'pending') return 'Pending';
    return status;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      let hours = date.getHours();
      const mins = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month} ${year} • ${hours}:${mins} ${ampm}`;
    } catch { return dateStr; }
  };

  const getPickupAddress = (b: BookingDetails) => b.pickup_address || 'Pickup location';
  const getDropAddress = (b: BookingDetails) => b.drop_address || 'Drop location';
  const getServiceCategoryLabel = (b: BookingDetails) => {
    const raw = (b.service_category || '').toString().trim();
    if (!raw) return b.vehicle_type || b.booking_type || 'Delivery';
    return raw.split('_').filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const isActiveBooking = (b: BookingDetails) => ACTIVE_STATUSES.includes(b.status?.toLowerCase());

  // Open the GST/tax invoice (print-ready HTML) in the device browser, where the
  // customer can Save-as-PDF / share. Auth is the access token passed in the URL.
  const handleDownloadInvoice = async (b: BookingDetails) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        showAlert('Session expired', 'Please sign in again to download your invoice.');
        return;
      }
      const url = `https://api.ridezipto.com/api/payment/invoice/${b.id}/pdf?token=${encodeURIComponent(token)}`;
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else {
        showAlert('Unavailable', 'Could not open the invoice on this device.');
      }
    } catch {
      showAlert('Something went wrong', 'Could not open the invoice. Please try again.');
    }
  };

  const handleTrack = (b: BookingDetails) => {
    const pickupCoords = b.pickup_location?.coordinates
      ? { latitude: b.pickup_location.coordinates[1], longitude: b.pickup_location.coordinates[0] }
      : undefined;
    const dropCoords = b.drop_location?.coordinates
      ? { latitude: b.drop_location.coordinates[1], longitude: b.drop_location.coordinates[0] }
      : undefined;
    navigation.navigate('LiveTracking', {
      bookingId: b.id,
      pickup: getPickupAddress(b),
      drop: getDropAddress(b),
      pickupCoords,
      dropCoords,
      vehicleType: b.vehicle_type || b.booking_type || 'delivery',
      fare: parseFloat(b.estimated_fare) || 0,
      isRealBooking: true, // skip offer-polling — this is a DB booking ID
    });
  };

  const getPaymentStatus = (b: BookingDetails) => {
    if (!b.payments || b.payments.length === 0) {
      // Completed bookings without payment record = cash paid
      if (COMPLETED_STATUSES.includes(b.status?.toLowerCase())) {
        return { label: 'Paid (Cash)', color: '#10B981', icon: 'check-circle' as const };
      }
      return { label: 'Unpaid', color: '#EF4444', icon: 'money-off' as const };
    }
    const completed = b.payments.find(p => p.payment_status === 'completed');
    if (completed) {
      const method = completed.payment_method === 'cash' ? 'Cash' : 'Online';
      return { label: `Paid (${method})`, color: '#10B981', icon: 'check-circle' as const };
    }
    const pending = b.payments.find(p => p.payment_status === 'pending');
    if (pending) return { label: 'Payment Pending', color: '#F59E0B', icon: 'hourglass-top' as const };
    return { label: 'Payment Failed', color: '#EF4444', icon: 'error' as const };
  };

  const handleCancelOrder = async () => {
    if (!cancelModal) return;
    const reason = cancelReason === 'custom' ? customReason.trim() : cancelReason;
    if (!reason) return;
    setCancelling(true);
    try {
      await vehicleApi.cancelBooking(cancelModal.bookingId, reason);
      setCancelModal(null);
      setCancelReason('');
      setCustomReason('');
      showSuccessAnimation();
    } catch (err) {
      setCancelling(false);
    }
  };

  const handlePayNow = (booking: BookingDetails) => {
    if (payingBookingId) return;
    const amount = Math.round(parseFloat((booking as any).final_fare || booking.estimated_fare || '0'));
    if (!amount || amount <= 0) {
      showAlert('Error', 'Cannot determine payment amount for this booking.');
      return;
    }
    navigation.navigate('Payment', {
      type: 'booking',
      bookingId: booking.id,
      amount,
    });
  };

  const showSuccessAnimation = () => {
    setCancelling(false);
    setSuccessModal(true);
    successScale.setValue(0); successOpacity.setValue(0);
    checkScale.setValue(0); checkRotate.setValue(0);
    confettiAnims.forEach(a => { a.translateY.setValue(0); a.translateX.setValue(0); a.opacity.setValue(0); a.scale.setValue(0); });

    Animated.sequence([
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.spring(checkScale, { toValue: 1.2, friction: 3, tension: 80, useNativeDriver: true }),
        Animated.spring(checkScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.parallel(
        confettiAnims.map((anim, i) => {
          const angle = (i / 8) * 2 * Math.PI;
          const radius = 80 + Math.random() * 40;
          return Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(anim.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(anim.translateX, { toValue: Math.cos(angle) * radius, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(anim.translateY, { toValue: Math.sin(angle) * radius - 30, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.timing(anim.translateY, { toValue: Math.sin(angle) * radius + 60, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ]),
          ]);
        }),
      ),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(successOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(successScale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ]).start(() => { setSuccessModal(false); fetchBookings(true); });
    }, 2500);
  };

  const confettiColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];

  // Fetch existing ratings for completed bookings
  useEffect(() => {
    const fetchRatings = async () => {
      const completed = bookings.filter(b => COMPLETED_STATUSES.includes(b.status?.toLowerCase()));
      for (const b of completed) {
        try {
          const res = await vehicleApi.getRatingByBooking(b.id);
          const ratingValue = res?.data?.rating;
          if (ratingValue != null) {
            setRatedBookings(prev => ({ ...prev, [b.id]: ratingValue }));
          }
        } catch { }
      }
    };
    if (bookings.length > 0) fetchRatings();
  }, [bookings]);

  const handleSubmitRating = async () => {
    if (!ratingModal || ratingValue === 0) return;
    setSubmittingRating(true);
    try {
      await vehicleApi.submitRating({
        booking_id: ratingModal.id,
        rating: ratingValue,
        comment: ratingComment.trim() || undefined,
      });
      setRatedBookings(prev => {
        const updated = { ...prev, [ratingModal.id]: ratingValue };
        AsyncStorage.setItem(RATED_BOOKINGS_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      setRatingModal(null);
      setRatingValue(0);
      setRatingComment('');
      setRatingTags([]);
      showAlert('Thank you!', 'Your rating has been submitted successfully.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit rating';
      showAlert('Error', msg);
    } finally {
      setSubmittingRating(false);
    }
  };

  const openRatingModal = (booking: BookingDetails) => {
    setRatingValue(0);
    setRatingComment('');
    setRatingTags([]);
    setRatingModal(booking);
  };

  // ── Order Card ───────────────────────────────────────────────────────────────
  const OrderCard = ({ booking }: { booking: BookingDetails }) => {
    const statusColor = getStatusColor(booking.status);
    const active = isActiveBooking(booking);
    const paymentStatus = getPaymentStatus(booking);
    const isCancelled = booking.status?.toLowerCase() === 'cancelled';
    const isCompleted = COMPLETED_STATUSES.includes(booking.status?.toLowerCase());
    const existingRating = ratedBookings[booking.id];

    return (
      <TouchableOpacity
        style={[styles.orderCard, isCancelled && styles.orderCardCancelled]}
        activeOpacity={0.7}
        onPress={() => {
          if (active) handleTrack(booking);
          else if (isCompleted && !existingRating) openRatingModal(booking);
        }}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.orderIconContainer, { backgroundColor: statusColor + '20' }]}>
              <MaterialIcons name="local-shipping" size={ms(24)} color={statusColor} />
            </View>
            <View style={styles.orderHeaderText}>
              <Text style={styles.orderType}>{getServiceCategoryLabel(booking)}</Text>
              <Text style={styles.orderId}>#{booking.id?.slice(0, 8)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <MaterialIcons name={getStatusIcon(booking.status)} size={ms(14)} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(booking.status)}</Text>
          </View>
        </View>

        {/* Locations */}
        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationText} numberOfLines={1}>{getPickupAddress(booking)}</Text>
            </View>
          </View>
          <View style={styles.locationLine} />
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Drop-off</Text>
              <Text style={styles.locationText} numberOfLines={1}>{getDropAddress(booking)}</Text>
            </View>
          </View>
        </View>

        {/* Payment badge */}
        <View style={[styles.paymentBadge, { backgroundColor: paymentStatus.color + '15' }]}>
          <MaterialIcons name={paymentStatus.icon} size={ms(14)} color={paymentStatus.color} />
          <Text style={[styles.paymentBadgeText, { color: paymentStatus.color }]}>{paymentStatus.label}</Text>
        </View>

        {/* Receiver details */}
        {booking.receiver_name && (
          <View style={styles.receiverContainer}>
            <MaterialIcons name="person-outline" size={ms(14)} color="#64748B" />
            <Text style={styles.receiverText}>
              Receiver: {booking.receiver_name}
              {booking.receiver_phone ? `  •  ${booking.receiver_phone}` : ''}
              {booking.alternative_phone ? `  •  Alt: ${booking.alternative_phone}` : ''}
            </Text>
          </View>
        )}

        {/* Delivery OTP — shown on active bookings so sender can share with driver */}
        {booking.delivery_otp && !booking.otp_verified && ACTIVE_STATUSES.includes(booking.status?.toLowerCase()) && (
          <View style={styles.otpContainer}>
            <View style={styles.otpIconWrap}>
              <MaterialIcons name="lock" size={ms(16)} color="#7C3AED" />
            </View>
            <View style={styles.otpTextWrap}>
              <Text style={styles.otpLabel}>Delivery OTP</Text>
              <Text style={styles.otpValue}>{booking.delivery_otp}</Text>
              <Text style={styles.otpHint}>Share with rider on delivery</Text>
            </View>
          </View>
        )}

        {/* Cancellation reason */}
        {isCancelled && booking.cancellation_reason && (
          <View style={styles.cancelReasonContainer}>
            <MaterialIcons name="info-outline" size={ms(14)} color="#94A3B8" />
            <Text style={styles.cancelReasonText}>{booking.cancellation_reason}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.orderFooter}>
          <View style={styles.orderFooterLeft}>
            <MaterialIcons name="schedule" size={ms(16)} color="#64748B" />
            <Text style={styles.footerText}>{formatDate(booking.created_at)}</Text>
          </View>
          <Text style={styles.amountText}>
            ₹{parseFloat(booking.estimated_fare || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Rating display for completed orders */}
        {isCompleted && existingRating && (
          <View style={styles.ratingDisplay}>
            <View style={styles.ratingStarsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <MaterialIcons
                  key={star}
                  name={star <= existingRating ? 'star' : 'star-border'}
                  size={ms(18)}
                  color={star <= existingRating ? '#F59E0B' : '#CBD5E1'}
                />
              ))}
            </View>
            <Text style={styles.ratingDisplayText}>You rated this delivery</Text>
          </View>
        )}

        {/* Pay Now — for completed, unpaid, sender-pays bookings */}
        {isCompleted && !isPaid(booking) && (booking as any).paid_by !== 'receiver' && (
          <TouchableOpacity
            style={styles.payNowButton}
            activeOpacity={0.8}
            disabled={payingBookingId === booking.id}
            onPress={() => handlePayNow(booking)}
          >
            {payingBookingId === booking.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="lock" size={ms(16)} color="#FFFFFF" />
                <Text style={styles.payNowButtonText}>
                  Pay ₹{parseFloat((booking as any).final_fare || booking.estimated_fare || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Rate button for completed orders without rating */}
        {isCompleted && !existingRating && (
          <TouchableOpacity
            style={styles.rateButton}
            activeOpacity={0.7}
            onPress={() => openRatingModal(booking)}
          >
            <MaterialIcons name="star-outline" size={ms(18)} color="#F59E0B" />
            <Text style={styles.rateButtonText}>Rate this delivery</Text>
          </TouchableOpacity>
        )}

        {/* Download GST invoice — only for orders where a GSTIN was applied (B2B) */}
        {isCompleted && !!booking.customer_gstin && (
          <TouchableOpacity
            style={styles.invoiceButton}
            activeOpacity={0.7}
            onPress={() => handleDownloadInvoice(booking)}
          >
            <MaterialIcons name="receipt-long" size={ms(18)} color="#16A34A" />
            <Text style={styles.invoiceButtonText}>Download GST Invoice</Text>
          </TouchableOpacity>
        )}

        {/* Action buttons */}
        {active && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={() => {
                setCancelReason('');
                setCustomReason('');
                setCancelModal({ bookingId: booking.id, orderId: booking.id?.slice(0, 8) });
              }}
            >
              <MaterialIcons name="close" size={ms(18)} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.trackButton}
              activeOpacity={0.7}
              onPress={() => handleTrack(booking)}
            >
              <MaterialIcons name="my-location" size={ms(18)} color="#FFFFFF" />
              <Text style={styles.trackButtonText}>Track Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getOrdersForTab = () => {
    if (activeTab === 'active') return activeOrders;
    if (activeTab === 'completed') return completedOrders;
    return cancelledOrders;
  };

  const getEmptyMessage = () => {
    if (activeTab === 'active') return { title: 'No Active Orders', text: "You don't have any active orders at the moment" };
    if (activeTab === 'completed') return { title: 'No Completed Orders', text: 'Your completed orders will appear here' };
    return { title: 'No Cancelled Orders', text: 'Your cancelled orders will appear here' };
  };

  const tabsData = [
    { key: 'active', label: 'Active', color: '#3B82F6' },
    { key: 'completed', label: 'Completed', color: '#10B981' },
    { key: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  ];

  const orders = getOrdersForTab();
  const empty = getEmptyMessage();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {tabsData.map(tab => {
            const isActive = activeTab === tab.key;
            const count = getTabCount(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && { backgroundColor: tab.color }]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, isActive && { backgroundColor: '#FFFFFF' }]}>
                    <Text style={[styles.tabBadgeText, isActive && { color: tab.color }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment filter */}
        <View style={styles.filterContainer}>
          {(['all', 'paid', 'unpaid'] as PaymentFilter[]).map(filter => {
            const selected = paymentFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, selected && styles.filterChipActive]}
                onPress={() => setPaymentFilter(filter)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={filter === 'all' ? 'filter-list' : filter === 'paid' ? 'check-circle' : 'money-off'}
                  size={ms(14)}
                  color={selected ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                  {filter === 'all' ? 'All' : filter === 'paid' ? 'Paid' : 'Unpaid'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        {loading ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingTop: vs(12) }]}
            scrollEnabled={false}
          >
            {[1, 2, 3, 4].map(i => <OrderCardSkeleton key={i} />)}
          </ScrollView>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="error-outline" size={ms(64)} color="#EF4444" />
            <Text style={styles.emptyStateTitle}>Something went wrong</Text>
            <Text style={styles.emptyStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchBookings()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
          >
            {orders.length > 0
              ? orders.map(b => <OrderCard key={b.id} booking={b} />)
              : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="inbox" size={ms(64)} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>{empty.title}</Text>
                  <Text style={styles.emptyStateText}>{empty.text}</Text>
                </View>
              )
            }
          </ScrollView>
        )}
      </SafeAreaView>

      <BottomTabBar />

      {/* ── Cancel Order Modal ── */}
      <Modal visible={!!cancelModal} transparent animationType="slide" onRequestClose={() => !cancelling && setCancelModal(null)}>
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
                  <MaterialIcons name="warning" size={ms(28)} color="#F59E0B" />
                </View>
                <Text style={styles.cancelModalTitle}>Cancel Order</Text>
                <Text style={styles.cancelModalSubtitle}>Order #{cancelModal?.orderId}</Text>
              </View>

              <Text style={styles.cancelReasonLabel}>Select a reason:</Text>
              <View style={styles.reasonList}>
                {CANCEL_REASONS.map(reason => (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOption, cancelReason === reason && styles.reasonOptionSelected]}
                    onPress={() => setCancelReason(reason)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.reasonRadio, cancelReason === reason && styles.reasonRadioSelected]}>
                      {cancelReason === reason && <View style={styles.reasonRadioDot} />}
                    </View>
                    <Text style={[styles.reasonOptionText, cancelReason === reason && styles.reasonOptionTextSelected]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.reasonOption, cancelReason === 'custom' && styles.reasonOptionSelected]}
                  onPress={() => setCancelReason('custom')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.reasonRadio, cancelReason === 'custom' && styles.reasonRadioSelected]}>
                    {cancelReason === 'custom' && <View style={styles.reasonRadioDot} />}
                  </View>
                  <Text style={[styles.reasonOptionText, cancelReason === 'custom' && styles.reasonOptionTextSelected]}>
                    Other reason
                  </Text>
                </TouchableOpacity>

                {cancelReason === 'custom' && (
                  <TextInput
                    style={styles.customReasonInput}
                    placeholder="Type your reason..."
                    placeholderTextColor="#94A3B8"
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                )}
              </View>

              <View style={styles.cancelModalActions}>
                <TouchableOpacity
                  style={styles.cancelModalKeep}
                  onPress={() => setCancelModal(null)}
                  disabled={cancelling}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelModalKeepText}>Keep Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cancelModalConfirm,
                    (!cancelReason || (cancelReason === 'custom' && !customReason.trim())) && styles.cancelModalConfirmDisabled,
                  ]}
                  onPress={handleCancelOrder}
                  disabled={cancelling || !cancelReason || (cancelReason === 'custom' && !customReason.trim())}
                  activeOpacity={0.7}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="close" size={ms(18)} color="#FFFFFF" />
                      <Text style={styles.cancelModalConfirmText}>Cancel Order</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Rating Modal ── */}
      <Modal visible={!!ratingModal} transparent animationType="slide" onRequestClose={() => !submittingRating && setRatingModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalContainer}>
            {/* Drag handle */}
            <View style={styles.ratingDragHandle} />

            <ScrollView
              contentContainerStyle={styles.ratingModalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {ratingModal && (<>

                {/* ── Gradient Header ── */}
                <LinearGradient
                  colors={['#FFF7ED', '#FFFBEB', '#FFFFFF']}
                  style={styles.ratingGradientHeader}
                >
                  <View style={styles.ratingHeaderIconRing}>
                    <Text style={styles.ratingHeaderEmoji}>
                      {ratingValue > 0 ? RATING_CONFIG[ratingValue].emoji : '⭐'}
                    </Text>
                  </View>
                  <Text style={styles.ratingModalTitle}>Rate Your Delivery</Text>
                  <Text style={styles.ratingModalSubtitle}>Order #{ratingModal.id?.slice(0, 8)?.toUpperCase()}</Text>
                </LinearGradient>

                {/* ── Driver card ── */}
                {ratingModal.driver && (
                  <View style={styles.ratingDriverCard}>
                    <View style={styles.ratingDriverAvatarWrap}>
                      <View style={styles.ratingDriverAvatar}>
                        <MaterialIcons name="person" size={ms(22)} color="#FFFFFF" />
                      </View>
                      <View style={styles.ratingDriverOnlineDot} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ratingDriverName}>{ratingModal.driver.name || 'Delivery Partner'}</Text>
                      <Text style={styles.ratingDriverVehicle}>{ratingModal.vehicle_type || 'Delivery Partner'}</Text>
                    </View>
                    <View style={styles.ratingFareChip}>
                      <Text style={styles.ratingFareText}>
                        ₹{parseFloat(ratingModal.final_fare || ratingModal.estimated_fare || '0').toFixed(0)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── Route summary ── */}
                <View style={styles.ratingRouteSummary}>
                  <View style={styles.ratingRouteRow}>
                    <View style={[styles.ratingRouteDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.ratingRouteText} numberOfLines={1}>{getPickupAddress(ratingModal)}</Text>
                  </View>
                  <View style={styles.ratingRouteLine} />
                  <View style={styles.ratingRouteRow}>
                    <View style={[styles.ratingRouteDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.ratingRouteText} numberOfLines={1}>{getDropAddress(ratingModal)}</Text>
                  </View>
                </View>

                {/* ── Stars ── */}
                <Text style={styles.ratingAskLabel}>How was your experience?</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRatingValue(star)}
                      activeOpacity={0.65}
                      style={styles.starBtn}
                    >
                      <MaterialIcons
                        name={star <= ratingValue ? 'star' : 'star-outline'}
                        size={ms(48)}
                        color={star <= ratingValue
                          ? (RATING_CONFIG[ratingValue]?.color ?? '#F59E0B')
                          : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Rating feedback pill */}
                {ratingValue > 0 ? (
                  <View style={[styles.ratingFeedbackPill, { backgroundColor: RATING_CONFIG[ratingValue].bg, borderColor: RATING_CONFIG[ratingValue].color + '40' }]}>
                    <Text style={[styles.ratingFeedbackText, { color: RATING_CONFIG[ratingValue].color }]}>
                      {RATING_CONFIG[ratingValue].emoji}  {RATING_CONFIG[ratingValue].label}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.ratingTapHint}>Tap a star to rate</Text>
                )}

                {/* ── Quick tags ── */}
                <Text style={styles.ratingTagsLabel}>What went well?</Text>
                <View style={styles.ratingTagsWrap}>
                  {RATING_TAGS.map(tag => {
                    const active = ratingTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.ratingTag, active && styles.ratingTagActive]}
                        onPress={() => toggleRatingTag(tag)}
                        activeOpacity={0.75}
                      >
                        {active && <MaterialIcons name="check" size={ms(12)} color="#F59E0B" />}
                        <Text style={[styles.ratingTagText, active && styles.ratingTagTextActive]}>{tag}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ── Comment ── */}
                <TextInput
                  style={styles.ratingCommentInput}
                  placeholder="Share more about your experience... (optional)"
                  placeholderTextColor="#94A3B8"
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* ── Submit button ── */}
                <TouchableOpacity
                  style={[styles.ratingSubmitBtn, ratingValue === 0 && styles.ratingSubmitDisabled]}
                  onPress={handleSubmitRating}
                  disabled={submittingRating || ratingValue === 0}
                  activeOpacity={0.8}
                >
                  {submittingRating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="star" size={ms(18)} color={ratingValue > 0 ? '#FFFFFF' : '#9CA3AF'} />
                      <Text style={[styles.ratingSubmitText, ratingValue === 0 && { color: '#9CA3AF' }]}>
                        Submit Rating
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Skip link */}
                <TouchableOpacity
                  style={styles.ratingSkipLink}
                  onPress={() => { setRatingModal(null); setRatingTags([]); }}
                  disabled={submittingRating}
                  activeOpacity={0.6}
                >
                  <Text style={styles.ratingSkipText}>Maybe later</Text>
                </TouchableOpacity>

              </>)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Success Animation Modal ── */}
      <Modal visible={successModal} transparent animationType="none">
        <View style={styles.successOverlay}>
          <Animated.View style={[styles.successContainer, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
            {confettiAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confettiDot,
                  {
                    backgroundColor: confettiColors[i],
                    opacity: anim.opacity,
                    transform: [
                      { translateX: anim.translateX },
                      { translateY: anim.translateY },
                      { scale: anim.scale },
                    ],
                  },
                ]}
              />
            ))}
            <Animated.View style={[styles.successCheckCircle, { transform: [{ scale: checkScale }] }]}>
              <MaterialIcons name="check" size={ms(48)} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.successTitle}>Order Cancelled</Text>
            <Text style={styles.successSubtitle}>Your order has been cancelled successfully</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize = ms(40);
const orderIconContSize = ms(48);
const cancelIconWrapSz = ms(56);
const radioSize = ms(20);
const radioDotSize = ms(10);
const successCircleSz = ms(88);
const confettiDotSz = ms(10);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hs(16),
    paddingVertical: vs(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: backBtnSize,
    height: backBtnSize,
    borderRadius: backBtnSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: { width: backBtnSize },

  // ── Tabs ──
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hs(12),
    paddingVertical: vs(8),
    gap: hs(6),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(10),
    paddingHorizontal: hs(8),
    borderRadius: ms(10),
    backgroundColor: '#F1F5F9',
    gap: hs(5),
  },
  tabText: { fontSize: fs(13), fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: ms(10),
    minWidth: ms(20),
    height: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: hs(5),
  },
  tabBadgeText: { color: '#64748B', fontSize: fs(11), fontWeight: 'bold' },

  // ── Filter ──
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hs(12),
    paddingVertical: vs(8),
    gap: hs(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hs(12),
    paddingVertical: vs(6),
    borderRadius: ms(20),
    backgroundColor: '#F1F5F9',
    gap: hs(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  filterChipText: { fontSize: fs(12), fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },

  scrollView: { flex: 1 },
  scrollContent: { padding: hs(16), paddingBottom: vs(100) },

  // ── Order card ──
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardCancelled: { opacity: 0.75, borderColor: '#FCA5A5' },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIconContainer: {
    width: orderIconContSize,
    height: orderIconContSize,
    borderRadius: orderIconContSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hs(12),
    flexShrink: 0,
  },
  orderHeaderText: { flex: 1 },
  orderType: {
    fontSize: fs(16),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: vs(2),
    textTransform: 'capitalize',
  },
  orderId: { fontSize: fs(13), color: '#64748B' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hs(10),
    paddingVertical: vs(6),
    borderRadius: ms(20),
    gap: hs(4),
  },
  statusText: { fontSize: fs(12), fontWeight: '600' },

  // Locations
  locationContainer: { marginBottom: vs(12) },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locationDot: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    backgroundColor: '#3B82F6',
    marginTop: vs(4),
    marginRight: hs(12),
    flexShrink: 0,
  },
  locationLine: {
    width: 2,
    height: vs(20),
    backgroundColor: '#E2E8F0',
    marginLeft: hs(5),
    marginVertical: vs(4),
  },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: fs(12), color: '#64748B', marginBottom: vs(2) },
  locationText: { fontSize: fs(14), color: '#1E293B', fontWeight: '500' },

  // Payment badge
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: hs(10),
    paddingVertical: vs(5),
    borderRadius: ms(12),
    gap: hs(4),
    marginBottom: vs(12),
  },
  paymentBadgeText: { fontSize: fs(12), fontWeight: '600' },

  // Cancel reason
  cancelReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: hs(10),
    paddingVertical: vs(6),
    borderRadius: ms(8),
    gap: hs(6),
    marginBottom: vs(12),
  },
  cancelReasonText: { fontSize: fs(12), color: '#94A3B8', flex: 1 },

  // Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  orderFooterLeft: { flexDirection: 'row', alignItems: 'center', gap: hs(6), flex: 1 },
  footerText: { fontSize: fs(12), color: '#64748B' },
  amountText: { fontSize: fs(18), fontWeight: 'bold', color: '#3B82F6' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: hs(10), marginTop: vs(12) },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: vs(12),
    borderRadius: ms(10),
    gap: hs(6),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelButtonText: { color: '#EF4444', fontSize: fs(14), fontWeight: '600' },
  trackButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: vs(12),
    borderRadius: ms(10),
    gap: hs(6),
  },
  trackButtonText: { color: '#FFFFFF', fontSize: fs(14), fontWeight: '600' },

  // Loading / empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: vs(12), fontSize: fs(15), color: '#64748B' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: vs(80) },
  emptyStateTitle: { fontSize: fs(20), fontWeight: 'bold', color: '#1E293B', marginTop: vs(16), marginBottom: vs(8) },
  emptyStateText: { fontSize: fs(14), color: '#64748B', textAlign: 'center', paddingHorizontal: hs(32) },
  retryButton: {
    marginTop: vs(16),
    backgroundColor: '#3B82F6',
    paddingHorizontal: hs(24),
    paddingVertical: vs(10),
    borderRadius: ms(8),
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: fs(14) },

  // ── Cancel Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  cancelModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    maxHeight: '80%',
    overflow: 'hidden',
  },
  cancelModalScroll: { paddingHorizontal: hs(20), paddingTop: vs(20) },
  cancelModalScrollContent: { paddingBottom: vs(34) },
  cancelModalHeader: { alignItems: 'center', marginBottom: vs(20) },
  cancelModalIconWrap: {
    width: cancelIconWrapSz,
    height: cancelIconWrapSz,
    borderRadius: cancelIconWrapSz / 2,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  cancelModalTitle: { fontSize: fs(20), fontWeight: 'bold', color: '#1E293B', marginBottom: vs(4) },
  cancelModalSubtitle: { fontSize: fs(14), color: '#64748B' },
  cancelReasonLabel: { fontSize: fs(14), fontWeight: '600', color: '#475569', marginBottom: vs(12) },
  reasonList: { marginBottom: vs(8) },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: hs(14),
    borderRadius: ms(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: vs(8),
    gap: hs(12),
  },
  reasonOptionSelected: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  reasonRadio: {
    width: radioSize,
    height: radioSize,
    borderRadius: radioSize / 2,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  reasonRadioSelected: { borderColor: '#3B82F6' },
  reasonRadioDot: {
    width: radioDotSize,
    height: radioDotSize,
    borderRadius: radioDotSize / 2,
    backgroundColor: '#3B82F6',
  },
  reasonOptionText: { fontSize: fs(14), color: '#475569', flex: 1 },
  reasonOptionTextSelected: { color: '#1E293B', fontWeight: '500' },
  customReasonInput: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: ms(12),
    padding: ms(12),
    fontSize: fs(14),
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: vs(80),
    marginBottom: vs(8),
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: hs(10),
    marginTop: vs(16),
  },
  cancelModalKeep: {
    flex: 1,
    paddingVertical: vs(14),
    borderRadius: ms(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalKeepText: { fontSize: fs(15), fontWeight: '600', color: '#475569' },
  cancelModalConfirm: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: vs(14),
    borderRadius: ms(12),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
  },
  cancelModalConfirmDisabled: { opacity: 0.5 },
  cancelModalConfirmText: { fontSize: fs(15), fontWeight: '600', color: '#FFFFFF' },

  // ── Success Modal ──
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(24),
    padding: ms(40),
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  successCheckCircle: {
    width: successCircleSz,
    height: successCircleSz,
    borderRadius: successCircleSz / 2,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  successTitle: { fontSize: fs(22), fontWeight: 'bold', color: '#1E293B', marginBottom: vs(8) },
  successSubtitle: { fontSize: fs(14), color: '#64748B', textAlign: 'center', lineHeight: fs(14) * 1.5 },
  confettiDot: {
    position: 'absolute',
    width: confettiDotSz,
    height: confettiDotSz,
    borderRadius: confettiDotSz / 2,
    top: '50%',
    left: '50%',
    marginTop: -(confettiDotSz / 2),
    marginLeft: -(confettiDotSz / 2),
  },

  // ── Receiver details ──
  receiverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
    paddingVertical: vs(6),
    paddingHorizontal: hs(10),
    backgroundColor: '#F8FAFC',
    borderRadius: ms(8),
    marginBottom: vs(8),
  },
  receiverText: { fontSize: fs(12), color: '#64748B', flex: 1 },

  // ── Rating display on card ──
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(8),
    paddingVertical: vs(8),
    paddingHorizontal: hs(10),
    backgroundColor: '#FFFBEB',
    borderRadius: ms(8),
    marginBottom: vs(8),
  },
  ratingStarsRow: { flexDirection: 'row', gap: hs(2) },
  ratingDisplayText: { fontSize: fs(12), color: '#92400E', fontWeight: '500' },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    paddingVertical: vs(13),
    backgroundColor: '#2563EB',
    borderRadius: ms(10),
    marginTop: vs(8),
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  payNowButtonText: { fontSize: fs(14), fontWeight: '700', color: '#FFFFFF' },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    paddingVertical: vs(10),
    backgroundColor: '#FFFBEB',
    borderRadius: ms(10),
    marginTop: vs(8),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rateButtonText: { fontSize: fs(14), fontWeight: '600', color: '#92400E' },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    paddingVertical: vs(10),
    backgroundColor: '#F0FDF4',
    borderRadius: ms(10),
    marginTop: vs(8),
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  invoiceButtonText: { fontSize: fs(14), fontWeight: '600', color: '#16A34A' },

  // ── Rating Modal ──
  ratingModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    maxHeight: '92%',
    overflow: 'hidden',
  },
  ratingDragHandle: {
    width: ms(36),
    height: vs(4),
    borderRadius: ms(2),
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: vs(10),
    marginBottom: vs(4),
  },
  ratingModalContent: { paddingHorizontal: hs(20), paddingBottom: vs(32) },
  ratingGradientHeader: {
    alignItems: 'center',
    paddingTop: vs(20),
    paddingBottom: vs(24),
    marginHorizontal: -hs(20),
    marginBottom: vs(16),
    paddingHorizontal: hs(20),
  },
  ratingHeaderIconRing: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(36),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(12),
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ratingHeaderEmoji: { fontSize: ms(36) },
  ratingModalTitle: { fontSize: fs(20), fontWeight: '800', color: '#1E293B', marginBottom: vs(4), letterSpacing: -0.3 },
  ratingModalSubtitle: { fontSize: fs(13), color: '#94A3B8', fontWeight: '500' },

  // Driver card
  ratingDriverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(12),
    backgroundColor: '#F8FAFC',
    borderRadius: ms(16),
    padding: ms(14),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingDriverAvatarWrap: { position: 'relative' },
  ratingDriverAvatar: {
    width: ms(46),
    height: ms(46),
    borderRadius: ms(23),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingDriverOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: ms(11),
    height: ms(11),
    borderRadius: ms(6),
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  ratingDriverName: { fontSize: fs(15), fontWeight: '700', color: '#1E293B' },
  ratingDriverVehicle: { fontSize: fs(12), color: '#64748B', textTransform: 'capitalize', marginTop: vs(2) },
  ratingFareChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(5),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ratingFareText: { fontSize: fs(13), fontWeight: '700', color: '#059669' },

  // Route summary
  ratingRouteSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: vs(12),
    marginBottom: vs(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingRouteRow: { flexDirection: 'row', alignItems: 'center', gap: hs(10) },
  ratingRouteDot: { width: ms(9), height: ms(9), borderRadius: ms(5), flexShrink: 0 },
  ratingRouteLine: { width: 1, height: vs(14), backgroundColor: '#CBD5E1', marginLeft: ms(4), marginVertical: vs(3) },
  ratingRouteText: { fontSize: fs(13), color: '#475569', flex: 1 },

  // Stars
  ratingAskLabel: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: vs(14),
  },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: hs(6), marginBottom: vs(12) },
  starBtn: { padding: hs(4) },
  ratingFeedbackPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hs(18),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    borderWidth: 1,
    marginBottom: vs(20),
  },
  ratingFeedbackText: { fontSize: fs(15), fontWeight: '700', letterSpacing: 0.2 },
  ratingTapHint: { fontSize: fs(13), color: '#94A3B8', textAlign: 'center', marginBottom: vs(20) },

  // Quick tags
  ratingTagsLabel: { fontSize: fs(13), fontWeight: '600', color: '#64748B', marginBottom: vs(10) },
  ratingTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: hs(8), marginBottom: vs(16) },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(4),
    paddingHorizontal: hs(14),
    paddingVertical: vs(7),
    borderRadius: ms(20),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  ratingTagActive: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  ratingTagText: { fontSize: fs(12), color: '#64748B', fontWeight: '500' },
  ratingTagTextActive: { color: '#B45309', fontWeight: '700' },

  // Comment input
  ratingCommentInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: ms(14),
    padding: ms(14),
    fontSize: fs(14),
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: vs(80),
    marginBottom: vs(16),
    textAlignVertical: 'top',
  },

  // Submit button
  ratingSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    paddingVertical: vs(16),
    borderRadius: ms(14),
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: vs(4),
  },
  ratingSubmitDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  ratingSubmitText: { fontSize: fs(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  ratingSkipLink: { alignItems: 'center', paddingVertical: vs(12) },
  ratingSkipText: { fontSize: fs(14), color: '#94A3B8', fontWeight: '500' },

  // ── Delivery OTP ──
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: ms(12),
    padding: hs(12),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: hs(10),
  },
  otpIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  otpTextWrap: { flex: 1 },
  otpLabel: { fontSize: fs(11), color: '#7C3AED', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: vs(2) },
  otpValue: { fontSize: fs(24), fontWeight: 'bold', color: '#4C1D95', letterSpacing: 4 },
  otpHint: { fontSize: fs(11), color: '#8B5CF6', marginTop: vs(2) },
});

export default MyOrders;