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

const Wallet = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const transactions = [
    {
      id: 1,
      type: 'credit',
      amount: 500,
      desc: 'Cashback from order #ZP1234',
      date: '15 Jan 2026',
      time: '02:30 PM',
    },
    {
      id: 2,
      type: 'debit',
      amount: 250,
      desc: 'Used for order #ZP1235',
      date: '14 Jan 2026',
      time: '11:45 AM',
    },
    {
      id: 3,
      type: 'credit',
      amount: 1000,
      desc: 'Added to wallet via UPI',
      date: '12 Jan 2026',
      time: '09:15 AM',
    },
    {
      id: 4,
      type: 'debit',
      amount: 180,
      desc: 'Used for order #ZP1230',
      date: '10 Jan 2026',
      time: '06:20 PM',
    },
    {
      id: 5,
      type: 'credit',
      amount: 300,
      desc: 'Referral bonus credited',
      date: '08 Jan 2026',
      time: '03:00 PM',
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Wallet Balance Card */}
          <View style={styles.walletBalanceCard}>
            <View style={styles.balanceIconContainer}>
              <MaterialIcons name="account-balance-wallet" size={ms(32)} color="#FFFFFF" />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹1,250</Text>

            <View style={styles.walletActions}>
              <TouchableOpacity style={styles.walletActionButton}>
                <MaterialIcons name="add" size={ms(20)} color="#3B82F6" />
                <Text style={styles.walletActionButtonText}>Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.walletActionButton, styles.secondaryButton]}>
                <MaterialIcons name="send" size={ms(20)} color="#FFFFFF" />
                <Text style={[styles.walletActionButtonText, styles.secondaryButtonText]}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
                <MaterialIcons name="history" size={ms(24)} color="#16A34A" />
              </View>
              <Text style={styles.quickActionText}>Passbook</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="card-giftcard" size={ms(24)} color="#D97706" />
              </View>
              <Text style={styles.quickActionText}>Offers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E0E7FF' }]}>
                <MaterialIcons name="help-outline" size={ms(24)} color="#4F46E5" />
              </View>
              <Text style={styles.quickActionText}>Help</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction History */}
          <View style={styles.contentPadding}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {transactions.map((txn) => (
              <View key={txn.id} style={styles.transactionCard}>
                <View
                  style={[
                    styles.transactionIcon,
                    txn.type === 'credit' ? styles.creditIcon : styles.debitIcon,
                  ]}
                >
                  <MaterialIcons
                    name={txn.type === 'credit' ? 'arrow-downward' : 'arrow-upward'}
                    size={ms(20)}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDesc}>{txn.desc}</Text>
                  <Text style={styles.transactionDate}>
                    {txn.date} • {txn.time}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    txn.type === 'credit' ? styles.creditAmount : styles.debitAmount,
                  ]}
                >
                  {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const balanceIconSize    = ms(64);
const quickActionIconSize = ms(48);
const txnIconSize        = ms(44);

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
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
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
  placeholder: {
    width: ms(40),
  },
  scrollView: {
    flex: 1,
  },

  // ── Balance Card ──
  walletBalanceCard: {
    backgroundColor: '#3B82F6',
    margin: scaleW(16),
    padding: ms(28),
    borderRadius: ms(20),
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  balanceIconContainer: {
    width: balanceIconSize,
    height: balanceIconSize,
    borderRadius: balanceIconSize / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(16),
  },
  balanceLabel: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#BFDBFE',
    marginBottom: scaleH(8),
  },
  balanceAmount: {
    fontSize: fs(44),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    marginBottom: scaleH(24),
  },
  walletActions: {
    flexDirection: 'row',
    gap: scaleW(12),
    width: '100%',
  },
  walletActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleW(8),
    paddingVertical: scaleH(14),
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  walletActionButtonText: {
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },

  // ── Quick Actions ──
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: scaleW(16),
    gap: scaleW(12),
    marginBottom: scaleH(8),
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: ms(16),
    borderRadius: ms(12),
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickActionIcon: {
    width: quickActionIconSize,
    height: quickActionIconSize,
    borderRadius: quickActionIconSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(8),
  },
  quickActionText: {
    fontSize: fs(12),
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },

  // ── Transactions ──
  contentPadding: {
    padding: scaleW(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleH(16),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: fs(14),
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ms(14),
    borderRadius: ms(12),
    marginBottom: scaleH(10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionIcon: {
    width: txnIconSize,
    height: txnIconSize,
    borderRadius: txnIconSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(12),
  },
  creditIcon: {
    backgroundColor: '#10B981',
  },
  debitIcon: {
    backgroundColor: '#EF4444',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: fs(14),
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(4),
  },
  transactionDate: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
  },
  transactionAmount: {
    fontSize: fs(16),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
  },
  creditAmount: {
    color: '#16A34A',
  },
  debitAmount: {
    color: '#DC2626',
  },
});

export default Wallet;