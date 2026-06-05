import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
  CFSession,
  CFDropCheckoutPayment,
  CFEnvironment,
} from 'cashfree-pg-api-contract';
import { AppStackParamList } from '../navigation/AppNavigator';
import { paymentApi, walletApi } from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Payment'>;

export default function Payment({ route, navigation }: Props) {
  const { type, bookingId, amount } = route.params;
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Setting up payment…');
  const [error, setError] = useState<string | null>(null);
  const resolvedRef = useRef(false);
  const pendingOrderRef = useRef<string | null>(null);

  // Confirm the result with the backend (authoritative).
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
      Alert.alert('Payment Successful', `₹${amount} ${type === 'wallet' ? 'added to wallet' : 'paid successfully'}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Payment Not Confirmed', 'If money was debited it will reflect shortly. You can retry if needed.', [
        { text: 'Retry', onPress: () => { resolvedRef.current = false; initiate(); } },
        { text: 'Close', onPress: () => navigation.goBack() },
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, bookingId, amount, navigation]);

  const onError = useCallback((message?: string) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    Alert.alert('Payment Failed', message || 'The payment was not completed.', [
      { text: 'Retry', onPress: () => { resolvedRef.current = false; initiate(); } },
      { text: 'Cancel', onPress: () => navigation.goBack() },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  // Register the Cashfree SDK callbacks once.
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
      // Launches the native Cashfree checkout (UPI apps via intent + cards).
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
});
