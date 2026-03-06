import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { vehicleApi, FareEstimateResponse } from '../api/vehicle';
import { useAuthStore } from '../store/useAuthStore';
import { WebView } from 'react-native-webview';

const FareEstimate = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'online'>(
    'cash',
  );
  const [estimateData, setEstimateData] = useState<
    FareEstimateResponse['data'] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    html: string;
    bookingId: string;
  } | null>(null);

  const { user } = useAuthStore();
  const {
    vehicle,
    pickup,
    drop,
    pickupCoords,
    dropCoords,
    city,
    serviceCategory,
    senderName,
    senderMobile,
    helperCount,
    helperCost,
  } = route.params || {};

  const fetchFareEstimate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!pickupCoords || !dropCoords) {
        throw new Error('Location coordinates are required');
      }

      const response = await vehicleApi.estimateFare({
        pickup_location: {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          address: pickup || '',
        },
        drop_location: {
          latitude: dropCoords.latitude,
          longitude: dropCoords.longitude,
          address: drop || '',
        },
        vehicle_type: vehicle?.id || 'bike',
      });

      if (response.success && response.data) {
        setEstimateData(response.data);
      } else {
        throw new Error('Failed to get fare estimate');
      }
    } catch (err: any) {
      console.error('Error fetching fare estimate:', err);
      setError(err.message || 'Failed to calculate fare. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pickupCoords, dropCoords, pickup, drop, vehicle?.id]);

  // Fetch fare estimate on mount
  useEffect(() => {
    fetchFareEstimate();
  }, [fetchFareEstimate]);

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
            bookingId,
            pickup: pickup || '',
            drop: drop || '',
            pickupCoords,
            dropCoords,
            vehicleType: vehicle?.id || 'bike',
            fare: (estimateData?.estimated_fare || 0) + (helperCost || 0),
            showBookingSuccess,
            paymentMethod,
            helperCount,
            helperCost,
          },
        },
      ],
    });
  };

  const buildRazorpayHTML = (
    orderId: string,
    amount: number,
    currency: string,
    key: string,
  ) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin:0; background:#F9FAFB; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; }
    .loader { text-align:center; color:#6B7280; font-size:16px; }
  </style>
</head>
<body>
  <div class="loader">Opening payment gateway...</div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var options = {
      key: "${key}",
      amount: ${Math.round(amount * 100)},
      currency: "${currency}",
      name: "Zipto",
      description: "Booking Payment",
      order_id: "${orderId}",
      prefill: {
        contact: "${user?.phone || ''}",
        name: "${user?.name || ''}"
      },
      theme: { color: "#2563EB" },
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "PAYMENT_SUCCESS", data: response
        }));
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "PAYMENT_CANCELLED" }));
        }
      }
    };
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "PAYMENT_FAILED", error: response.error
      }));
    });
    rzp.open();
  </script>
</body>
</html>`;

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const bookingId = paymentModal?.bookingId || '';
      setPaymentModal(null);

      if (message.type === 'PAYMENT_SUCCESS') {
        setBookingLoading(true);
        const verifyResponse = await vehicleApi.verifyPayment({
          razorpay_order_id: message.data.razorpay_order_id,
          razorpay_payment_id: message.data.razorpay_payment_id,
          razorpay_signature: message.data.razorpay_signature,
          booking_id: bookingId,
        });
        setBookingLoading(false);

        if (!verifyResponse.success) {
          Alert.alert(
            'Verification Failed',
            'Payment collected but verification failed. Contact support.',
          );
          return;
        }
        navigateToTracking(bookingId, true, 'online');
      } else if (message.type === 'PAYMENT_CANCELLED') {
        Alert.alert(
          'Payment Cancelled',
          'Your booking is saved. You can retry payment later.',
        );
      } else if (message.type === 'PAYMENT_FAILED') {
        Alert.alert(
          'Payment Failed',
          message.error?.description || 'Payment could not be completed.',
        );
      }
    } catch {
      setPaymentModal(null);
      setBookingLoading(false);
      Alert.alert('Error', 'Something went wrong with the payment.');
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setBookingLoading(true);

      const bookingData = {
        name: senderName || user?.name || '',
        mobile_number: senderMobile || user?.phone || '',
        city: city || 'Bhubaneswar',
        service_category: serviceCategory || 'send_packages',
        pickup_location: {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          address: pickup || '',
        },
        drop_location: {
          latitude: dropCoords.latitude,
          longitude: dropCoords.longitude,
          address: drop || '',
        },
        vehicle_type: vehicle?.id || 'bike',
        booking_type: 'instant' as const,
      };

      const bookingResponse = await vehicleApi.createBooking(bookingData);

      if (!bookingResponse.success) {
        Alert.alert(
          'Booking Failed',
          bookingResponse.message ||
            'Failed to create booking. Please try again.',
        );
        return;
      }

      const bookingId = bookingResponse.data?.id;
      const amount = (estimateData?.estimated_fare || 0) + (helperCost || 0);

      if (selectedPayment === 'online') {
        const orderResponse = await vehicleApi.createPaymentOrder({
          booking_id: bookingId,
          amount,
        });

        if (!orderResponse.success || !orderResponse.data?.order_id) {
          Alert.alert(
            'Payment Error',
            'Failed to create payment order. Please try again.',
          );
          return;
        }

        const { order_id, currency, key } = orderResponse.data;
        const html = buildRazorpayHTML(
          order_id,
          amount,
          currency || 'INR',
          key,
        );
        setBookingLoading(false);
        setPaymentModal({ html, bookingId });
      } else {
        navigateToTracking(bookingId, true, 'cash');
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message ||
          err.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Calculating best fare...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchFareEstimate}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Retry Estimation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const breakdown = estimateData?.breakdown;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fare Estimate</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Route Card */}
        <View style={styles.card}>
          <View style={styles.routeContainer}>
            <View style={styles.timelineContainer}>
              <View style={[styles.dot, styles.pickupDot]} />
              <View style={styles.line} />
              <View style={[styles.dot, styles.dropDot]} />
            </View>
            <View style={styles.addressContainer}>
              <View style={styles.addressItem}>
                <Text style={styles.label}>Pickup</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {pickup || 'Current Location'}
                </Text>
              </View>
              <View style={styles.addressItem}>
                <Text style={styles.label}>Drop-off</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {drop || 'Select Destination'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="schedule" size={16} color="#6B7280" />
              <Text style={styles.statText}>
                {estimateData?.duration ? Math.round(estimateData.duration) : 0}{' '}
                mins
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="place" size={16} color="#6B7280" />
              <Text style={styles.statText}>
                {estimateData?.distance ? estimateData.distance.toFixed(2) : 0}{' '}
                km
              </Text>
            </View>
          </View>
        </View>

        {/* Fare Breakdown Card */}
        <Text style={styles.sectionTitle}>Fare Breakdown</Text>
        <View style={styles.card}>
          {(breakdown?.surge_multiplier || 1) > 1 && (
            <View style={styles.surgeAlert}>
              <Icon name="trending-up" size={16} color="#B91C1C" />
              <Text style={styles.surgeText}>
                Identify high demand! Fares are slightly higher due to high
                demand.
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Base Fare</Text>
            <Text style={styles.rowValue}>₹{breakdown?.base_fare || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Distance Charge</Text>
            <Text style={styles.rowValue}>
              ₹{breakdown?.distance_charge || 0}
            </Text>
          </View>
          {(breakdown?.time_charge || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Time Charge</Text>
              <Text style={styles.rowValue}>
                ₹{breakdown?.time_charge || 0}
              </Text>
            </View>
          )}

          {(helperCount || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                Labour Charge ({helperCount}x)
              </Text>
              <Text style={styles.rowValue}>₹{helperCost || 0}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Estimate</Text>
            <Text style={styles.totalValue}>
              ₹{(estimateData?.estimated_fare || 0) + (helperCost || 0)}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentContainer}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'cash' && styles.selectedPayment,
            ]}
            onPress={() => setSelectedPayment('cash')}
            activeOpacity={0.9}
          >
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.iconBox,
                  selectedPayment === 'cash' && styles.selectedIconBox,
                ]}
              >
                <Icon
                  name="payments"
                  size={20}
                  color={selectedPayment === 'cash' ? '#2563EB' : '#6B7280'}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.paymentTitle,
                    selectedPayment === 'cash' && styles.selectedPaymentText,
                  ]}
                >
                  Cash
                </Text>
                <Text style={styles.paymentSub}>Pay to driver</Text>
              </View>
            </View>
            <View
              style={[
                styles.radio,
                selectedPayment === 'cash' && styles.radioSelected,
              ]}
            >
              {selectedPayment === 'cash' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'online' && styles.selectedPayment,
            ]}
            onPress={() => setSelectedPayment('online')}
            activeOpacity={0.9}
          >
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.iconBox,
                  selectedPayment === 'online' && styles.selectedIconBox,
                ]}
              >
                <Icon
                  name="credit-card"
                  size={20}
                  color={selectedPayment === 'online' ? '#2563EB' : '#6B7280'}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.paymentTitle,
                    selectedPayment === 'online' && styles.selectedPaymentText,
                  ]}
                >
                  Online
                </Text>
                <Text style={styles.paymentSub}>UPI, Card, Netbanking</Text>
              </View>
            </View>
            <View
              style={[
                styles.radio,
                selectedPayment === 'online' && styles.radioSelected,
              ]}
            >
              {selectedPayment === 'online' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.finalPriceLabel}>Final Amount</Text>
          <Text style={styles.finalPrice}>
            ₹{(estimateData?.estimated_fare || 0) + (helperCost || 0)}
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

      {/* Razorpay Payment Modal */}
      <Modal
        visible={!!paymentModal}
        animationType="slide"
        onRequestClose={() => {
          setPaymentModal(null);
          Alert.alert(
            'Payment Cancelled',
            'Your booking is saved. You can retry payment later.',
          );
        }}
      >
        <SafeAreaView style={styles.paymentModalContainer}>
          <View style={styles.paymentModalHeader}>
            <TouchableOpacity
              onPress={() => {
                setPaymentModal(null);
                Alert.alert(
                  'Payment Cancelled',
                  'Your booking is saved. You can retry payment later.',
                );
              }}
            >
              <Icon name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.paymentModalTitle}>Complete Payment</Text>
            <View style={{ width: 24 }} />
          </View>
          {paymentModal?.html && (
            <WebView
              source={{ html: paymentModal.html }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoader}>
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  // Route Styles
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineContainer: {
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  pickupDot: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  dropDot: {
    borderColor: '#059669',
    backgroundColor: '#059669', // Solid fill for drop
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  addressContainer: {
    flex: 1,
    justifyContent: 'space-between',
    height: 80, // Ensure height matches timeline
  },
  addressItem: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D1D5DB',
  },
  // Breakdown Styles
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
  },
  surgeAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  surgeText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
    lineHeight: 16,
  },
  // Payment Styles
  paymentContainer: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
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
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconBox: {
    backgroundColor: '#DBEAFE',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedPaymentText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  paymentSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  // Footer Styles
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  priceContainer: {
    flex: 1,
  },
  finalPriceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  finalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  bookButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 50,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  paymentModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default FareEstimate;
