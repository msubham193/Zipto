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

// ─── Responsive Utilities ────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms = (size: number, factor = 0.45) => size + (scaleW(size) - size) * factor;
const nf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));
const sp = (size: number) => Math.round(scaleW(size));

const isSmallScreen = SCREEN_WIDTH <= 360;
const isLargeScreen = SCREEN_WIDTH >= 428;

// ─── Component ───────────────────────────────────────────────────────────────

const GetDiscountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const availableCoins = 850;

  const discounts = [
    { id: 1, title: '₹50 Off',       coins: 500,  description: 'On orders above ₹500',  gradient: ['#10B981', '#059669'], icon: 'local-offer'    },
    { id: 2, title: '₹100 Off',      coins: 1000, description: 'On orders above ₹1000', gradient: ['#F59E0B', '#D97706'], icon: 'discount'       },
    { id: 3, title: '₹200 Off',      coins: 2000, description: 'On orders above ₹2000', gradient: ['#EF4444', '#DC2626'], icon: 'sell'           },
    { id: 4, title: 'Free Delivery', coins: 300,  description: 'On any order',           gradient: ['#3B82F6', '#2563EB'], icon: 'delivery-dining'},
    { id: 5, title: '₹500 Off',      coins: 5000, description: 'On orders above ₹5000', gradient: ['#8B5CF6', '#7C3AED'], icon: 'card-giftcard'  },
  ];

  const handleRedeem = (discount: typeof discounts[0]) => {
    if (availableCoins >= discount.coins) {
      console.log('Redeeming discount:', discount);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={sp(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Get Discount</Text>
          <View style={{ width: sp(40) }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Balance Card ── */}
          <View style={styles.balanceCardContainer}>
            <LinearGradient
              colors={['#10B981', '#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Your Coins</Text>
                <Text style={styles.balanceAmount}>{availableCoins}</Text>
              </View>
              <View style={styles.coinsIconContainer}>
                <MaterialIcons name="local-offer" size={sp(isSmallScreen ? 50 : 60)} color="#FCD34D" />
              </View>
            </LinearGradient>
          </View>

          {/* ── Discounts List ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Discounts</Text>
            {discounts.map(discount => {
              const canRedeem = availableCoins >= discount.coins;
              return (
                <View
                  key={discount.id}
                  style={[styles.discountCard, !canRedeem && styles.disabledCard]}
                >
                  <LinearGradient
                    colors={canRedeem ? discount.gradient : ['#94A3B8', '#64748B']}
                    style={styles.discountHeader}
                  >
                    <View style={styles.discountIconContainer}>
                      <MaterialIcons name={discount.icon} size={sp(isSmallScreen ? 26 : 32)} color="#FFFFFF" />
                    </View>
                    <View style={styles.discountTitleContainer}>
                      <Text style={styles.discountTitle}>{discount.title}</Text>
                      <Text style={styles.discountDescription}>{discount.description}</Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.discountFooter}>
                    <View style={styles.coinsRequired}>
                      <MaterialIcons name="stars" size={sp(18)} color="#F59E0B" />
                      <Text style={styles.coinsRequiredText}>{discount.coins} coins</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.redeemButton, !canRedeem && styles.disabledButton]}
                      disabled={!canRedeem}
                      onPress={() => handleRedeem(discount)}
                    >
                      <Text style={styles.redeemButtonText}>{canRedeem ? 'Redeem' : 'Locked'}</Text>
                      <MaterialIcons
                        name={canRedeem ? 'arrow-forward' : 'lock'}
                        size={sp(18)}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Info Banner ── */}
          <View style={styles.infoBanner}>
            <MaterialIcons name="info" size={sp(20)} color="#10B981" />
            <Text style={styles.infoBannerText}>
              Redeemed discounts will be automatically applied on your next eligible order!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Responsive Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: sp(isSmallScreen ? 12 : 16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: nf(isSmallScreen ? 17 : 20),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: sp(24),
  },

  // ── Balance card ─────────────────────────────────────────────────────────────
  balanceCardContainer: {
    padding: sp(16),
  },
  balanceCard: {
    borderRadius: sp(20),
    padding: sp(isSmallScreen ? 18 : 24),
    position: 'relative',
    overflow: 'hidden',
    minHeight: scaleH(isSmallScreen ? 120 : 140),
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceInfo: {
    zIndex: 1,
  },
  balanceLabel: {
    fontSize: nf(isSmallScreen ? 12 : 14),
    fontFamily: 'Poppins-Regular',
    color: '#D1FAE5',
    marginBottom: sp(6),
  },
  balanceAmount: {
    fontSize: nf(isSmallScreen ? 38 : isLargeScreen ? 52 : 48),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  coinsIconContainer: {
    position: 'absolute',
    right: sp(20),
    top: sp(20),
    opacity: 0.2,
  },

  // ── Section ──────────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: sp(16),
  },
  sectionTitle: {
    fontSize: nf(isSmallScreen ? 16 : 18),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: sp(16),
  },

  // ── Discount card ─────────────────────────────────────────────────────────────
  discountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sp(16),
    marginBottom: sp(16),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  disabledCard: {
    opacity: 0.6,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(isSmallScreen ? 12 : 16),
  },
  discountIconContainer: {
    width: sp(isSmallScreen ? 46 : 56),
    height: sp(isSmallScreen ? 46 : 56),
    borderRadius: sp(isSmallScreen ? 23 : 28),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(12),
    flexShrink: 0,
  },
  discountTitleContainer: {
    flex: 1,
  },
  discountTitle: {
    fontSize: nf(isSmallScreen ? 17 : 20),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    marginBottom: sp(3),
  },
  discountDescription: {
    fontSize: nf(isSmallScreen ? 12 : 14),
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },

  // ── Discount footer ───────────────────────────────────────────────────────────
  discountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp(isSmallScreen ? 12 : 16),
    paddingVertical: sp(isSmallScreen ? 10 : 14),
    backgroundColor: '#F8FAFC',
    flexWrap: 'nowrap',
    gap: sp(8),
  },
  coinsRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    flexShrink: 1,
  },
  coinsRequiredText: {
    fontSize: nf(isSmallScreen ? 13 : 15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  redeemButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingHorizontal: sp(isSmallScreen ? 14 : 20),
    paddingVertical: sp(isSmallScreen ? 8 : 10),
    borderRadius: sp(8),
    alignItems: 'center',
    gap: sp(6),
    flexShrink: 0,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: nf(isSmallScreen ? 13 : 15),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
  },

  // ── Info banner ───────────────────────────────────────────────────────────────
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    padding: sp(isSmallScreen ? 12 : 16),
    borderRadius: sp(12),
    marginHorizontal: sp(16),
    marginTop: sp(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: sp(12),
  },
  infoBannerText: {
    flex: 1,
    fontSize: nf(isSmallScreen ? 11 : 13),
    fontFamily: 'Poppins-Regular',
    color: '#065F46',
    lineHeight: nf(isSmallScreen ? 16 : 18),
  },
});

export default GetDiscountScreen;