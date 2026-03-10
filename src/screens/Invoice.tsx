import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { THEME } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

// ─── Responsive Utilities ────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BASE_WIDTH = 393;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const ms = (size: number, factor = 0.45) => size + (scaleW(size) - size) * factor;
const nf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));
const sp = (size: number) => Math.round(scaleW(size));

const isSmallScreen = SCREEN_WIDTH <= 360;
const isLargeScreen = SCREEN_WIDTH >= 428;

// ─── Component ───────────────────────────────────────────────────────────────

const Invoice = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Icon
          name="receipt"
          size={sp(isSmallScreen ? 20 : 24)}
          color={THEME.colors.black}
          style={{ marginRight: sp(10) }}
        />
        <Text style={styles.headerTitle}>Invoice #ZIP-12345</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Trip Details Card ── */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>04 Jan 2026, 10:30 AM</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vehicle</Text>
            <Text style={styles.value}>Tata Ace</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationValue}>Master Canteen Area</Text>
            <View style={{ height: sp(10) }} />
            <Text style={styles.locationLabel}>Drop</Text>
            <Text style={styles.locationValue}>Patia, Bhubaneswar</Text>
          </View>
        </View>

        {/* ── Fare Breakdown Card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fare Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Base Fare</Text>
            <Text style={styles.value}>₹250</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Distance Charge (10km)</Text>
            <Text style={styles.value}>₹80</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Taxes & Fees</Text>
            <Text style={styles.value}>₹20</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹350</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Button
          title="Download Receipt"
          onPress={() => {}}
          variant="outline"
          icon={
            <Icon
              name="file-download"
              size={sp(isSmallScreen ? 18 : 20)}
              color={THEME.colors.primary}
              style={{ marginRight: sp(8) }}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

// ─── Responsive Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(isSmallScreen ? 12 : 16),
    paddingVertical: sp(isSmallScreen ? 12 : 14),
    backgroundColor: THEME.colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: nf(isSmallScreen ? 17 : isLargeScreen ? 22 : 20),
    fontWeight: 'bold',
    color: THEME.colors.black,
    flexShrink: 1,
  },

  // ── Scroll content ───────────────────────────────────────────────────────────
  content: {
    padding: sp(isSmallScreen ? 12 : 16),
    paddingBottom: sp(24),
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: sp(isSmallScreen ? 8 : 10),
    padding: sp(isSmallScreen ? 12 : 16),
    marginBottom: sp(isSmallScreen ? 12 : 16),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },

  // ── Row ──────────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: sp(isSmallScreen ? 6 : 8),
    gap: sp(8),
  },
  label: {
    fontSize: nf(isSmallScreen ? 12 : 14),
    color: THEME.colors.textSecondary,
    flex: 1,
    flexShrink: 1,
  },
  value: {
    fontSize: nf(isSmallScreen ? 12 : 14),
    color: THEME.colors.text,
    fontWeight: '500',
    flexShrink: 0,
    textAlign: 'right',
  },

  // ── Total row ────────────────────────────────────────────────────────────────
  totalLabel: {
    fontSize: nf(isSmallScreen ? 14 : 16),
    fontWeight: 'bold',
    color: THEME.colors.black,
    flex: 1,
  },
  totalValue: {
    fontSize: nf(isSmallScreen ? 16 : 18),
    fontWeight: 'bold',
    color: THEME.colors.black,
    flexShrink: 0,
  },

  // ── Divider ──────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: sp(isSmallScreen ? 8 : 10),
  },

  // ── Location block ───────────────────────────────────────────────────────────
  locationContainer: {
    paddingVertical: sp(4),
  },
  locationLabel: {
    fontSize: nf(isSmallScreen ? 9 : 10),
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: nf(isSmallScreen ? 13 : 15),
    color: THEME.colors.text,
    marginTop: sp(2),
  },

  // ── Section title ─────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: nf(isSmallScreen ? 14 : 16),
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: sp(isSmallScreen ? 10 : 14),
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    padding: sp(isSmallScreen ? 12 : 16),
    backgroundColor: THEME.colors.white,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});

export default Invoice;