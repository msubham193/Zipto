import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { showAlert } from '../components/CustomAlert';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { paymentApi, walletApi } from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Payment'>;

type PaymentData = {
  encRequest: string;
  accessCode: string;
  paymentUrl: string;
  orderId: string;
  amount: number;
};

const RESULT_URL_PATTERN = '/payment/hdfc/result';

export default function Payment({ route, navigation }: Props) {
  const { type, bookingId, amount } = route.params;
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedRef = useRef(false);

  const initiate = useCallback(async () => {
    setLoading(true);
    setError(null);
    resolvedRef.current = false;
    setPaymentData(null);
    setWebViewLoading(true);
    try {
      let res: any;
      if (type === 'booking' && bookingId) {
        res = await paymentApi.initiate({ booking_id: bookingId, amount });
      } else if (type === 'wallet') {
        res = await walletApi.initiateAddMoney(amount);
      } else {
        throw new Error('Invalid payment type');
      }
      const data = res.data ?? res;
      setPaymentData({
        encRequest: data.encRequest,
        accessCode: data.accessCode,
        paymentUrl: data.paymentUrl,
        orderId: data.orderId,
        amount,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  }, [type, bookingId, amount]);

  useEffect(() => {
    initiate();
  }, [initiate]);

  const handleResult = useCallback(
    (status: string, ref?: string) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;

      if (status === 'success') {
        showAlert(
          'Payment Successful',
          `₹${amount} paid successfully${ref ? `\nRef: ${ref}` : ''}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else if (status === 'cancelled') {
        showAlert('Payment Cancelled', 'You can retry from the Orders screen.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        showAlert('Payment Failed', 'Please try again.', [
          { text: 'Retry', onPress: () => initiate() },
          { text: 'Cancel', onPress: () => navigation.goBack() },
        ]);
      }
    },
    [amount, navigation, initiate],
  );

  const onNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      const url = navState.url ?? '';
      if (!url.includes(RESULT_URL_PATTERN)) return;
      try {
        const qs = url.includes('?') ? url.split('?')[1] : '';
        const params: Record<string, string> = {};
        qs.split('&').forEach(pair => {
          const [k, v] = pair.split('=');
          if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
        });
        const status = params.status ?? 'failed';
        const ref = params.ref;
        handleResult(status, ref);
      } catch {
        handleResult('failed');
      }
    },
    [handleResult],
  );

  // Build HTML that auto-submits a POST form to HDFC — only way to do a form POST from WebView
  const buildHtml = (data: PaymentData) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Connecting to HDFC Bank...</title>
    <style>
      body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;
           height:100vh;margin:0;background:#f9fafb;flex-direction:column}
      .spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#2563eb;
               border-radius:50%;animation:spin 0.8s linear infinite}
      p{color:#6b7280;font-size:14px;margin-top:16px}
      @keyframes spin{to{transform:rotate(360deg)}}
    </style>
  </head>
  <body>
    <div class="spinner"></div>
    <p>Connecting to HDFC Bank...</p>
    <form id="f" method="POST" action="${data.paymentUrl}">
      <input type="hidden" name="encRequest" value="${data.encRequest}"/>
      <input type="hidden" name="access_code" value="${data.accessCode}"/>
    </form>
    <script>document.getElementById('f').submit();</script>
  </body>
</html>`;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Setting up payment...</Text>
      </SafeAreaView>
    );
  }

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
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'wallet' ? 'Add Money to Wallet' : 'Complete Payment'}
        </Text>
        <Text style={styles.headerAmount}>₹{amount}</Text>
      </SafeAreaView>

      {webViewLoading && (
        <View style={styles.webViewLoader}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Connecting to HDFC Bank...</Text>
        </View>
      )}

      {paymentData && (
        <WebView
          source={{ html: buildHtml(paymentData) }}
          style={webViewLoading ? styles.hidden : styles.webView}
          onLoadEnd={() => setWebViewLoading(false)}
          onNavigationStateChange={onNavigationStateChange}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  back: { padding: 8 },
  backText: { fontSize: 18, color: '#374151' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerAmount: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  webView: { flex: 1 },
  hidden: { height: 0 },
  webViewLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    zIndex: 10,
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
  btnSecondary: { paddingVertical: 14, paddingHorizontal: 32 },
  btnSecondaryText: { color: '#6b7280', fontSize: 15 },
});
