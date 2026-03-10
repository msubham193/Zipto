import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { THEME } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BottomTabBar from './BottomTabBar';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

const ms = (size: number, factor = 0.45) =>
  size + (scaleW(size) - size) * factor;

const fs = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(ms(size)));
// ─────────────────────────────────────────────────────────────────────────────

const Payment = () => {
  const navigation = useNavigation();
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'upi'>('cash');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={ms(24)} color={THEME.colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.amount}>₹350</Text>
          <Text style={styles.amountLabel}>Total Amount</Text>

          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'cash' && styles.selectedCard]}
            onPress={() => setSelectedMethod('cash')}
          >
            <Icon name="money" size={ms(24)} color={THEME.colors.text} />
            <Text style={styles.methodName}>Cash</Text>
            {selectedMethod === 'cash' && (
              <Icon name="check-circle" size={ms(24)} color={THEME.colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'upi' && styles.selectedCard]}
            onPress={() => setSelectedMethod('upi')}
          >
            <Icon name="account-balance-wallet" size={ms(24)} color={THEME.colors.text} />
            <Text style={styles.methodName}>UPI (GPay / PhonePe)</Text>
            {selectedMethod === 'upi' && (
              <Icon name="check-circle" size={ms(24)} color={THEME.colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={`Pay via ${selectedMethod === 'cash' ? 'Cash' : 'UPI'}`}
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>

      <BottomTabBar />
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize = ms(40);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  safeArea:  { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleW(ms(THEME.spacing.m)),
    paddingVertical: scaleH(ms(THEME.spacing.m)),
    backgroundColor: THEME.colors.white,
  },
  backButton: {
    marginRight: scaleW(ms(THEME.spacing.m)),
    width: backBtnSize,
    height: backBtnSize,
    borderRadius: backBtnSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: 'bold',
    color: THEME.colors.black,
  },

  // ── Content ──
  content: {
    flex: 1,
    paddingHorizontal: scaleW(ms(THEME.spacing.l)),
    paddingTop: scaleH(ms(THEME.spacing.l)),
  },
  amount: {
    fontSize: fs(40),
    fontWeight: 'bold',
    textAlign: 'center',
    color: THEME.colors.primary,
    marginBottom: scaleH(6),
  },
  amountLabel: {
    textAlign: 'center',
    fontSize: fs(14),
    color: THEME.colors.textSecondary,
    marginBottom: scaleH(ms(THEME.spacing.xl)),
  },
  sectionTitle: {
    fontSize: fs(ms(THEME.sizes.body1)),
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: scaleH(ms(THEME.spacing.m)),
  },

  // ── Method cards ──
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.white,
    paddingHorizontal: scaleW(ms(THEME.spacing.m)),
    paddingVertical: scaleH(ms(THEME.spacing.m)),
    borderRadius: ms(8),
    marginBottom: scaleH(ms(THEME.spacing.m)),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#FFF0E0',
  },
  methodName: {
    flex: 1,
    marginLeft: scaleW(10),
    fontSize: fs(ms(THEME.sizes.body1)),
    color: THEME.colors.text,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: scaleW(ms(THEME.spacing.m)),
    paddingTop: scaleH(ms(THEME.spacing.m)),
    paddingBottom: scaleH(10),
  },
});

export default Payment;