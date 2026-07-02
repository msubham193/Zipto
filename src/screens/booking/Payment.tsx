import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  View,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
  CFSession,
  CFDropCheckoutPayment,
  CFEnvironment,
} from 'cashfree-pg-api-contract';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { paymentApi, walletApi } from '../../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Payment'>;

export default function Payment({ route, navigation }: Props) {
  const { type, bookingId, amount } = route.params;
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Setting up payment…');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const resolvedRef = useRef(false);
  const pendingOrderRef = useRef<string | null>(null);

  // Animation values for success screen
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showSuccess = useCallback(() => {
    setSuccess(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const confirm = useCallback(async () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setStatusMsg('Confirming payment…');
    let ok = false;
    try {
      if (type === 'wallet' && pendingOrderRef.current) {
        const res: any = await walletApi.verifyWalletTopup(pendingOrderRef.current);
        ok = (res.data ?? res)?.status === 'approved';
      } else if (type === 'booking' && bookingId) {
        for (let i = 0; i < 5; i++) {
          const res: any = await paymentApi.getStatus(bookingId);
          const s = (res.data ?? res)?.status;
          if (s === 'completed') { ok = true; break; }
          if (s === 'failed') break;
          await new Promise<void>(r => setTimeout(() => r(), 1200));
        }
      }
    } catch { /* fall through to failure */ }

    if (ok) {
      showSuccess();
    } else {
      Alert.alert('Payment Not Confirmed', 'If money was debited it will reflect shortly. You can retry if needed.', [
        { text: 'Retry', onPress: () => { resolvedRef.current = false; initiate(); } },
        { text: 'Close', onPress: () => navigation.goBack() },
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, bookingId, amount, navigation, showSuccess]);

  const onError = useCallback((message?: string) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    Alert.alert('Payment Failed', message || 'The payment was not completed.', [
      { text: 'Retry', onPress: () => { resolvedRef.current = false; initiate(); } },
      { text: 'Cancel', onPress: () => navigation.goBack() },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  useEffect(() => {
    try {
      CFPaymentGatewayService.setCallback({
        onVerify: (_orderID: string) => { confirm(); },
        onError: (err: any, _orderID: string) => { onError(err?.getMessage?.() || err?.message); },
      });
    } catch { /* sdk not ready */ }
    return () => { try { (CFPaymentGatewayService as any).removeCallback?.(); } catch { /* noop */ } };
  }, [confirm, onError]);

  const initiate = useCallback(async () => {
    setLoading(true);
    setError(null);
    resolvedRef.current = false;
    pendingOrderRef.current = null;
    try {
      let data: any;
      if (type === 'booking' && bookingId) {
        const res: any = await paymentApi.initiateCashfree({ booking_id: bookingId, amount });
        data = res.data ?? res;
      } else if (type === 'wallet') {
        const res: any = await walletApi.initiateAddMoneyCashfree(amount);
        data = res.data ?? res;
      } else {
        throw new Error('Invalid payment type');
      }
      if (!data?.payment_session_id || !data?.order_id) throw new Error('Could not start payment');

      pendingOrderRef.current = data.order_id;
      const env = data.mode === 'sandbox' ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION;
      const session = new CFSession(data.payment_session_id, data.order_id, env);
      const dropPayment = new CFDropCheckoutPayment(session, null, null);
      setStatusMsg('Opening payment…');
      CFPaymentGatewayService.doPayment(dropPayment);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  }, [type, bookingId, amount]);

  useEffect(() => {
    initiate();
  }, [initiate]);

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <Animated.View style={[styles.successCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Checkmark circle */}
          <View style={styles.checkCircleOuter}>
            <View style={styles.checkCircleInner}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>

          {/* Badge */}
          <View style={styles.confirmedBadge}>
            <Text style={styles.confirmedBadgeText}>✦  PAYMENT CONFIRMED</Text>
          </View>

          {/* Amount */}
          <Text style={styles.amount}>₹{Number(amount).toFixed(2)}</Text>

          {/* Title & subtitle */}
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            {type === 'wallet'
              ? `₹${amount} has been added to your Bookfleet wallet.`
              : 'Your payment was received. Your delivery is confirmed.'}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Done button */}
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Error Screen ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Payment Setup Failed</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={initiate}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
          <Text style={styles.btnSecondaryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Loading Screen ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>{loading ? 'Setting up payment…' : statusMsg}</Text>
      <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.btnSecondaryText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Loading / Error ──
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  loadingText: { marginTop: 16, color: '#6b7280', fontSize: 14 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  btn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  btnSecondaryText: { color: '#6b7280', fontSize: 15 },

  // ── Success ──
  successContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  checkCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkCircleInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 40,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  confirmedBadgeText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Poppins-Regular',
  },
  amount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#16a34a',
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803d',
    fontFamily: 'Poppins-Regular',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#dcfce7',
    marginVertical: 24,
  },
  doneBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
  },
});
