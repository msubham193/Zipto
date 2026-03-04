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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTabBar from './BottomTabBar';
import { vehicleApi, BookingDetails } from '../api/vehicle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACTIVE_STATUSES = ['pending', 'searching', 'accepted', 'assigned', 'driver_assigned', 'driver_arriving', 'arriving', 'in_progress', 'ongoing', 'picked_up'];
const COMPLETED_STATUSES = ['completed', 'delivered'];
const CANCELLED_STATUSES = ['cancelled'];

type PaymentFilter = 'all' | 'paid' | 'unpaid';

const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price',
  'Driver taking too long',
  'Wrong pickup/drop location',
  'Booked by mistake',
];

const MyOrders = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState('active');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState<{ bookingId: string; orderId: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Success modal state
  const [successModal, setSuccessModal] = useState(false);
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
      console.log(response);
      if (response.success && response.data?.bookings) {
        setBookings(response.data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings(true);
  };

  const isPaid = (booking: BookingDetails) => {
    return booking.payments?.some(p => p.payment_status === 'completed') || false;
  };

  const filterByPayment = (list: BookingDetails[]) => {
    if (paymentFilter === 'all') return list;
    if (paymentFilter === 'paid') return list.filter(isPaid);
    return list.filter(b => !isPaid(b));
  };

  const activeOrders = filterByPayment(
    bookings.filter(b => ACTIVE_STATUSES.includes(b.status?.toLowerCase())),
  );
  const completedOrders = filterByPayment(
    bookings.filter(b => COMPLETED_STATUSES.includes(b.status?.toLowerCase())),
  );
  const cancelledOrders = filterByPayment(
    bookings.filter(b => CANCELLED_STATUSES.includes(b.status?.toLowerCase())),
  );

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
    if (s === 'driver_arriving' || s === 'arriving') return 'Driver Arriving';
    if (s === 'assigned' || s === 'driver_assigned' || s === 'accepted') return 'Driver Assigned';
    if (s === 'searching') return 'Finding Driver';
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
    } catch {
      return dateStr;
    }
  };

  const getPickupAddress = (booking: BookingDetails) => booking.pickup_address || 'Pickup location';
  const getDropAddress = (booking: BookingDetails) => booking.drop_address || 'Drop location';
  const getServiceCategoryLabel = (booking: BookingDetails) => {
    const raw = (booking.service_category || '').toString().trim();
    if (!raw) {
      return booking.vehicle_type || booking.booking_type || 'Delivery';
    }

    return raw
      .split('_')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isActiveBooking = (booking: BookingDetails) =>
    ACTIVE_STATUSES.includes(booking.status?.toLowerCase());

  const handleTrack = (booking: BookingDetails) => {
    const pickupCoords = booking.pickup_location?.coordinates
      ? { latitude: booking.pickup_location.coordinates[1], longitude: booking.pickup_location.coordinates[0] }
      : undefined;
    const dropCoords = booking.drop_location?.coordinates
      ? { latitude: booking.drop_location.coordinates[1], longitude: booking.drop_location.coordinates[0] }
      : undefined;

    navigation.navigate('LiveTracking', {
      bookingId: booking.id,
      pickup: getPickupAddress(booking),
      drop: getDropAddress(booking),
      pickupCoords,
      dropCoords,
      vehicleType: booking.vehicle_type || booking.booking_type || 'delivery',
      fare: parseFloat(booking.estimated_fare) || 0,
    });
  };

  const getPaymentStatus = (booking: BookingDetails) => {
    if (!booking.payments || booking.payments.length === 0) {
      return { label: 'Unpaid', color: '#EF4444', icon: 'money-off' as const };
    }
    const completedPayment = booking.payments.find(p => p.payment_status === 'completed');
    if (completedPayment) {
      const method = completedPayment.payment_method === 'cash' ? 'Cash' : 'Online';
      return { label: `Paid (${method})`, color: '#10B981', icon: 'check-circle' as const };
    }
    const pendingPayment = booking.payments.find(p => p.payment_status === 'pending');
    if (pendingPayment) {
      return { label: 'Payment Pending', color: '#F59E0B', icon: 'hourglass-top' as const };
    }
    return { label: 'Payment Failed', color: '#EF4444', icon: 'error' as const };
  };

  // Cancel order
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
    } catch (err: any) {
      console.error('Cancel error:', err);
      setCancelling(false);
    }
  };

  // Success animation
  const showSuccessAnimation = () => {
    setCancelling(false);
    setSuccessModal(true);

    successScale.setValue(0);
    successOpacity.setValue(0);
    checkScale.setValue(0);
    checkRotate.setValue(0);
    confettiAnims.forEach(a => {
      a.translateY.setValue(0);
      a.translateX.setValue(0);
      a.opacity.setValue(0);
      a.scale.setValue(0);
    });

    Animated.sequence([
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.spring(checkScale, {
          toValue: 1.2,
          friction: 3,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel(
        confettiAnims.map((anim, i) => {
          const angle = (i / 8) * 2 * Math.PI;
          const radius = 80 + Math.random() * 40;
          return Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateX, {
              toValue: Math.cos(angle) * radius,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.translateY, {
                toValue: Math.sin(angle) * radius - 30,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateY, {
                toValue: Math.sin(angle) * radius + 60,
                duration: 400,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
          ]);
        }),
      ),
    ]).start();

    // Auto-dismiss after 2.5 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successScale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSuccessModal(false);
        fetchBookings(true);
      });
    }, 2500);
  };

  const confettiColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];

  // Order Card
  const OrderCard = ({ booking }: { booking: BookingDetails }) => {
    const statusColor = getStatusColor(booking.status);
    const active = isActiveBooking(booking);
    const paymentStatus = getPaymentStatus(booking);
    const isCancelled = booking.status?.toLowerCase() === 'cancelled';

    return (
      <TouchableOpacity
        style={[styles.orderCard, isCancelled && styles.orderCardCancelled]}
        activeOpacity={0.7}
        onPress={() => active && handleTrack(booking)}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.orderIconContainer, { backgroundColor: statusColor + '20' }]}>
              <MaterialIcons name="local-shipping" size={24} color={statusColor} />
            </View>
            <View style={styles.orderHeaderText}>
              <Text style={styles.orderType}>{getServiceCategoryLabel(booking)}</Text>
              <Text style={styles.orderId}>#{booking.id?.slice(0, 8)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <MaterialIcons name={getStatusIcon(booking.status)} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(booking.status)}
            </Text>
          </View>
        </View>

        {/* Pickup and Dropoff */}
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

        {/* Payment Status */}
        <View style={[styles.paymentBadge, { backgroundColor: paymentStatus.color + '15' }]}>
          <MaterialIcons name={paymentStatus.icon} size={14} color={paymentStatus.color} />
          <Text style={[styles.paymentBadgeText, { color: paymentStatus.color }]}>
            {paymentStatus.label}
          </Text>
        </View>

        {/* Cancellation Reason */}
        {isCancelled && booking.cancellation_reason && (
          <View style={styles.cancelReasonContainer}>
            <MaterialIcons name="info-outline" size={14} color="#94A3B8" />
            <Text style={styles.cancelReasonText}>{booking.cancellation_reason}</Text>
          </View>
        )}

        {/* Order Footer */}
        <View style={styles.orderFooter}>
          <View style={styles.orderFooterLeft}>
            <MaterialIcons name="schedule" size={16} color="#64748B" />
            <Text style={styles.footerText}>{formatDate(booking.created_at)}</Text>
          </View>
          <Text style={styles.amountText}>
            ₹{parseFloat(booking.estimated_fare || '0').toFixed(0)}
          </Text>
        </View>

        {/* Action Buttons */}
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
              <MaterialIcons name="close" size={18} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.trackButton}
              activeOpacity={0.7}
              onPress={() => handleTrack(booking)}
            >
              <MaterialIcons name="my-location" size={18} color="#FFFFFF" />
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Three Tabs */}
        <View style={styles.tabContainer}>
          {tabsData.map(tab => {
            const isActive = activeTab === tab.key;
            const count = getTabCount(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: tab.color },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, isActive && { backgroundColor: '#FFFFFF' }]}>
                    <Text style={[styles.tabBadgeText, isActive && { color: tab.color }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Filter */}
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
                  size={14}
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="error-outline" size={64} color="#EF4444" />
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
            }
          >
            {orders.length > 0 ? (
              orders.map(booking => (
                <OrderCard key={booking.id} booking={booking} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={64} color="#CBD5E1" />
                <Text style={styles.emptyStateTitle}>{empty.title}</Text>
                <Text style={styles.emptyStateText}>{empty.text}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      <BottomTabBar />

      {/* Cancel Order Modal */}
      <Modal
        visible={!!cancelModal}
        transparent
        animationType="slide"
        onRequestClose={() => !cancelling && setCancelModal(null)}
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
              {/* Modal Header */}
              <View style={styles.cancelModalHeader}>
                <View style={styles.cancelModalIconWrap}>
                  <MaterialIcons name="warning" size={28} color="#F59E0B" />
                </View>
                <Text style={styles.cancelModalTitle}>Cancel Order</Text>
                <Text style={styles.cancelModalSubtitle}>
                  Order #{cancelModal?.orderId}
                </Text>
              </View>

              {/* Reason Selection */}
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
                  >
                    <View style={[
                      styles.reasonRadio,
                      cancelReason === reason && styles.reasonRadioSelected,
                    ]}>
                      {cancelReason === reason && <View style={styles.reasonRadioDot} />}
                    </View>
                    <Text style={[
                      styles.reasonOptionText,
                      cancelReason === reason && styles.reasonOptionTextSelected,
                    ]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Custom reason */}
                <TouchableOpacity
                  style={[
                    styles.reasonOption,
                    cancelReason === 'custom' && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setCancelReason('custom')}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.reasonRadio,
                    cancelReason === 'custom' && styles.reasonRadioSelected,
                  ]}>
                    {cancelReason === 'custom' && <View style={styles.reasonRadioDot} />}
                  </View>
                  <Text style={[
                    styles.reasonOptionText,
                    cancelReason === 'custom' && styles.reasonOptionTextSelected,
                  ]}>
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

              {/* Actions */}
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
                      <MaterialIcons name="close" size={18} color="#FFFFFF" />
                      <Text style={styles.cancelModalConfirmText}>Cancel Order</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Animation Modal */}
      <Modal
        visible={successModal}
        transparent
        animationType="none"
      >
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
            {/* Confetti particles */}
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

            {/* Check circle */}
            <Animated.View
              style={[
                styles.successCheckCircle,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              <MaterialIcons name="check" size={48} color="#FFFFFF" />
            </Animated.View>

            <Text style={styles.successTitle}>Order Cancelled</Text>
            <Text style={styles.successSubtitle}>
              Your order has been cancelled successfully
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardCancelled: {
    opacity: 0.75,
    borderColor: '#FCA5A5',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderHeaderText: {
    flex: 1,
  },
  orderType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  orderId: {
    fontSize: 13,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginTop: 4,
    marginRight: 12,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginLeft: 5,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  cancelReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  cancelReasonText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  orderFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  trackButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Cancel Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cancelModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    marginBottom: 20,
  },
  cancelModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  cancelModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  cancelReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  reasonList: {
    marginBottom: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  reasonOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonRadioSelected: {
    borderColor: '#3B82F6',
  },
  reasonRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  reasonOptionText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  reasonOptionTextSelected: {
    color: '#1E293B',
    fontWeight: '500',
  },
  customReasonInput: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: 80,
    marginBottom: 8,
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelModalKeep: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalKeepText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  cancelModalConfirm: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelModalConfirmDisabled: {
    opacity: 0.5,
  },
  cancelModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  successCheckCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  confettiDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: '50%',
    left: '50%',
    marginTop: -5,
    marginLeft: -5,
  },
});

export default MyOrders;
