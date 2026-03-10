import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

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

const RedeemVouchersScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const availableCoins = 850;

  const vouchers = [
    { id: 1, brand: 'Amazon',      value: '₹500',  coins: 5000,  color: '#FF9900', icon: 'shopping-bag'  },
    { id: 2, brand: 'Flipkart',    value: '₹500',  coins: 5000,  color: '#2874F0', icon: 'shopping-cart' },
    { id: 3, brand: 'Swiggy',      value: '₹200',  coins: 2000,  color: '#FC8019', icon: 'restaurant'    },
    { id: 4, brand: 'Zomato',      value: '₹200',  coins: 2000,  color: '#E23744', icon: 'fastfood'      },
    { id: 5, brand: 'BookMyShow',  value: '₹300',  coins: 3000,  color: '#C4242B', icon: 'local-movies'  },
    { id: 6, brand: 'MakeMyTrip',  value: '₹1000', coins: 10000, color: '#ED1C24', icon: 'flight'        },
  ];

  const handleRedeem = (voucher: typeof vouchers[0]) => {
    if (availableCoins >= voucher.coins) {
      console.log('Redeeming voucher:', voucher);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Redeem Vouchers</Text>
          <View style={{ width: backBtnSize }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Balance card */}
          <View style={styles.balanceCardContainer}>
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#B45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Your Coins</Text>
                <Text style={styles.balanceAmount}>{availableCoins}</Text>
              </View>
              <View style={styles.coinsIconContainer}>
                <MaterialIcons name="card-giftcard" size={ms(60)} color="#FCD34D" />
              </View>
            </LinearGradient>
          </View>

          {/* Vouchers grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Vouchers</Text>
            <View style={styles.vouchersGrid}>
              {vouchers.map(voucher => {
                const canRedeem = availableCoins >= voucher.coins;
                return (
                  <View
                    key={voucher.id}
                    style={[styles.voucherCard, !canRedeem && styles.disabledCard]}
                  >
                    <View style={[styles.voucherIcon, { backgroundColor: voucher.color }]}>
                      <MaterialIcons name={voucher.icon} size={ms(32)} color="#FFFFFF" />
                    </View>

                    <Text style={styles.voucherBrand}>{voucher.brand}</Text>
                    <Text style={styles.voucherValue}>{voucher.value}</Text>

                    <View style={styles.voucherCoinsContainer}>
                      <MaterialIcons name="stars" size={ms(16)} color="#F59E0B" />
                      <Text style={styles.voucherCoins}>{voucher.coins} coins</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.voucherButton, !canRedeem && styles.disabledButton]}
                      disabled={!canRedeem}
                      onPress={() => handleRedeem(voucher)}
                    >
                      <Text style={styles.voucherButtonText}>
                        {canRedeem ? 'Redeem' : 'Locked'}
                      </Text>
                      {!canRedeem && (
                        <MaterialIcons name="lock" size={ms(14)} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <MaterialIcons name="info" size={ms(20)} color="#F59E0B" />
            <Text style={styles.infoBannerText}>
              Voucher codes will be sent to your registered email within 24 hours of redemption.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize    = ms(40);
const voucherIconSz  = ms(64);
// Card width: two cards per row with a gap between them
const cardGap        = scaleW(12);
const voucherCardW   = (SCREEN_WIDTH - scaleW(16) * 2 - cardGap) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea:  { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(16),
    backgroundColor: '#FFFFFF',
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
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },

  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: scaleH(24) },

  // ── Balance card ──
  balanceCardContainer: {
    padding: scaleW(16),
  },
  balanceCard: {
    borderRadius: ms(20),
    padding: ms(24),
    overflow: 'hidden',
    minHeight: scaleH(140),
    elevation: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceInfo: { zIndex: 1 },
  balanceLabel: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#FEF3C7',
    marginBottom: scaleH(8),
  },
  balanceAmount: {
    fontSize: fs(48),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  coinsIconContainer: {
    position: 'absolute',
    right: scaleW(20),
    top: scaleH(20),
    opacity: 0.2,
  },

  // ── Section ──
  section: { paddingHorizontal: scaleW(16) },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(16),
  },

  // ── Voucher grid ──
  vouchersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: cardGap,
  },
  voucherCard: {
    width: voucherCardW,
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(14),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  disabledCard: { opacity: 0.5 },

  voucherIcon: {
    width: voucherIconSz,
    height: voucherIconSz,
    borderRadius: voucherIconSz / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(10),
  },
  voucherBrand: {
    fontSize: fs(15),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(4),
    textAlign: 'center',
  },
  voucherValue: {
    fontSize: fs(20),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#F59E0B',
    marginBottom: scaleH(6),
  },
  voucherCoinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(4),
    marginBottom: scaleH(12),
  },
  voucherCoins: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },
  voucherButton: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(8),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleW(6),
    width: '100%',
  },
  disabledButton:    { backgroundColor: '#94A3B8' },
  voucherButtonText: {
    color: '#FFFFFF',
    fontSize: fs(13),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
  },

  // ── Info banner ──
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: ms(16),
    borderRadius: ms(12),
    marginHorizontal: scaleW(16),
    marginTop: scaleH(16),
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: scaleW(10),
  },
  infoBannerText: {
    flex: 1,
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#78350F',
    lineHeight: fs(13) * 1.5,
  },
});

export default RedeemVouchersScreen;