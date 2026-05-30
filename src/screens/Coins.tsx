import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import BottomTabBar from './BottomTabBar';
import { vehicleApi, CoinTransaction } from '../api/vehicle';
import EnterView from '../components/EnterView';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

const Coins = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [coins, setCoins]               = useState(0);
  const [rupeeValue, setRupeeValue]     = useState(0);
  const [rate, setRate]                 = useState('');
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [balanceError, setBalanceError] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setBalanceError(false);

      const [balanceRes, historyRes] = await Promise.all([
        vehicleApi.getCoinsBalance().catch(() => null),
        vehicleApi.getCoinsHistory().catch(() => null),
      ]);

      if (balanceRes) {
        setCoins(balanceRes.coins ?? 0);
        setRupeeValue(balanceRes.rupee_value ?? 0);
        setRate(balanceRes.rate ?? '');
      } else {
        setBalanceError(true);
      }

      if (historyRes?.transactions) {
        setTransactions(historyRes.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch coins data:', err);
      setBalanceError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date   = new Date(dateStr);
      const day    = date.getDate().toString().padStart(2, '0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const month  = months[date.getMonth()];
      let hours    = date.getHours();
      const mins   = date.getMinutes().toString().padStart(2, '0');
      const ampm   = hours >= 12 ? 'PM' : 'AM';
      hours        = hours % 12 || 12;
      return `${day} ${month} • ${hours}:${mins} ${ampm}`;
    } catch { return dateStr; }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'earned')                      return 'add-circle';
    if (type === 'redeemed' || type === 'spent') return 'remove-circle';
    if (type === 'transferred')                  return 'swap-horiz';
    return 'stars';
  };

  const getTransactionColor = (type: string) => {
    if (type === 'earned')                      return '#10B981';
    if (type === 'redeemed' || type === 'spent') return '#EF4444';
    if (type === 'transferred')                  return '#F59E0B';
    return '#6366F1';
  };

  // Use Coins options — commented out, re-enable when TransferToWallet screen is ready
  /*
  const useCoinsOptions = [
    {
      id: 1,
      title: 'Transfer to Wallet',
      description: 'Convert coins to wallet balance',
      icon: 'account-balance-wallet',
      gradient: ['#3B82F6', '#2563EB'],
      badge: null,
      onPress: () => navigation.navigate('TransferToWallet'),
    },
  ];
  */

  const earnCoinsWays = [
    {
      icon: 'local-shipping',
      text: 'Complete deliveries',
      coins: 'Per order',
      done: false,
      coinsColor: undefined,
      coinsBg: undefined,
      onPress: () => navigation.navigate('EarnCoinsInfo'),
    },
    {
      icon: 'share',
      text: 'Refer friends',
      coins: '+1000',
      done: false,
      coinsColor: undefined,
      coinsBg: undefined,
      onPress: () => navigation.navigate('ReferEarn'),
    },
    // Transaction history row — commented out, re-enable when TransactionHistory screen is ready
    /*
    {
      icon: 'receipt-long',
      text: 'View transaction history',
      coins: 'All',
      onPress: () => navigation.navigate('TransactionHistory'),
    },
    */
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Coins</Text>
            {/* History button — commented out, re-enable when TransactionHistory screen is ready
            <TouchableOpacity
              onPress={() => navigation.navigate('TransactionHistory')}
              style={styles.historyButton}
            >
              <MaterialIcons name="history" size={ms(24)} color="#3B82F6" />
            </TouchableOpacity>
            */}
            <View style={styles.historyButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading coins...</Text>
          </View>
        </SafeAreaView>
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Coins</Text>
          {/* History icon button — commented out, re-enable when TransactionHistory screen is ready
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionHistory')}
            style={styles.historyButton}
          >
            <MaterialIcons name="history" size={ms(24)} color="#3B82F6" />
          </TouchableOpacity>
          */}
          <View style={styles.historyButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
          }
        >
          {/* Coins Balance Card */}
          <EnterView delay={40} style={styles.balanceCardContainer}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.coinsIconContainer}>
                <MaterialIcons name="stars" size={ms(60)} color="#FCD34D" />
              </View>

              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Available Coins</Text>
                {balanceError ? (
                  <Text style={styles.balanceAmount}>--</Text>
                ) : (
                  <>
                    <Text style={styles.balanceAmount}>{coins}</Text>
                    <Text style={styles.balanceSubtext}>≈ ₹{rupeeValue.toFixed(2)}</Text>
                  </>
                )}
              </View>

              {rate ? (
                <View style={styles.rateTag}>
                  <MaterialIcons name="info-outline" size={ms(14)} color="#E0E7FF" />
                  <Text style={styles.rateText}>{rate}</Text>
                </View>
              ) : null}

              {/* Decorative circles */}
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />
              <View style={[styles.decorCircle, styles.decorCircle3]} />
            </LinearGradient>

            {/* Transaction History button — commented out, re-enable when TransactionHistory screen is ready
            <TouchableOpacity
              style={styles.transactionHistoryButton}
              onPress={() => navigation.navigate('TransactionHistory')}
            >
              <MaterialIcons name="receipt-long" size={ms(20)} color="#6366F1" />
              <Text style={styles.transactionHistoryText}>Transaction History</Text>
              <MaterialIcons name="chevron-right" size={ms(20)} color="#94A3B8" />
            </TouchableOpacity>
            */}
          </EnterView>

          {/* Recent Transactions — commented out, re-enable when TransactionHistory screen is ready */}
          {/*
          {transactions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.transactionsCard}>
                {transactions.slice(0, 5).map((tx, index) => {
                  const color    = getTransactionColor(tx.type);
                  const isEarned = tx.type === 'earned';
                  return (
                    <React.Fragment key={tx.id}>
                      <View style={styles.transactionItem}>
                        <View style={[styles.txIconContainer, { backgroundColor: color + '15' }]}>
                          <MaterialIcons name={getTransactionIcon(tx.type)} size={ms(22)} color={color} />
                        </View>
                        <View style={styles.txInfo}>
                          <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                          <View style={styles.txMeta}>
                            <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                            {tx.multiplier && Number(tx.multiplier) > 1 && (
                              <View style={styles.multiplierTag}>
                                <Text style={styles.multiplierText}>{Number(tx.multiplier).toFixed(1)}x</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={[styles.txCoins, { color }]}>
                          {isEarned ? '+' : '-'}{tx.coins}
                        </Text>
                      </View>
                      {index < Math.min(transactions.length, 5) - 1 && (
                        <View style={styles.txDivider} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          )}
          */}

          {/* Use Coins Section — commented out, re-enable when TransferToWallet screen is ready */}
          {/*
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Use Coins</Text>
            <View style={styles.optionsGrid}>
              {useCoinsOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionCard}
                  onPress={option.onPress}
                  activeOpacity={0.8}
                >
                  {option.badge && (
                    <View style={[styles.badge, option.badge === 'NEW' && styles.badgeNew]}>
                      <Text style={styles.badgeText}>{option.badge}</Text>
                    </View>
                  )}
                  <LinearGradient colors={option.gradient} style={styles.optionIconContainer}>
                    <MaterialIcons name={option.icon} size={ms(32)} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                  <View style={styles.optionArrow}>
                    <MaterialIcons name="arrow-forward" size={ms(20)} color="#3B82F6" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          */}

          {/* Earn More Coins Section */}
          <EnterView delay={120} style={styles.section}>
            <Text style={styles.sectionTitle}>Earn More Coins</Text>
            <View style={styles.earnCard}>
              {earnCoinsWays.map((way, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[styles.earnItem, way.done && styles.earnItemDone]}
                    onPress={way.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.earnIconContainer, way.done && styles.earnIconDone]}>
                      <MaterialIcons
                        name={way.done ? 'check-circle' : way.icon}
                        size={ms(24)}
                        color={way.done ? '#10B981' : '#6366F1'}
                      />
                    </View>
                    <Text style={[styles.earnText, way.done && styles.earnTextDone]}>{way.text}</Text>
                    <View style={[styles.earnCoinsTag, way.coinsBg ? { backgroundColor: way.coinsBg } : null]}>
                      <Text style={[styles.earnCoinsText, way.coinsColor ? { color: way.coinsColor } : null]}>
                        {way.coins}
                      </Text>
                    </View>
                    {way.done
                      ? <MaterialIcons name="check" size={ms(20)} color="#10B981" />
                      : <MaterialIcons name="chevron-right" size={ms(20)} color="#94A3B8" />
                    }
                  </TouchableOpacity>
                  {index < earnCoinsWays.length - 1 && <View style={styles.earnDivider} />}
                </React.Fragment>
              ))}
            </View>
          </EnterView>

          {/* Info Banner */}
          <EnterView delay={180} variant="fade" style={styles.infoBanner}>
            <MaterialIcons name="info" size={ms(20)} color="#3B82F6" />
            <Text style={styles.infoBannerText}>
              {rate || '100 coins = ₹2'}. Use your coins for discounts on your next delivery!
            </Text>
          </EnterView>
        </ScrollView>
      </SafeAreaView>

      <BottomTabBar />
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const btnSize        = ms(40);
const txIconSize     = ms(42);
const optionIconSize = ms(64);
const earnIconSize   = ms(44);
const decorCircle1Sz = ms(120);
const decorCircle2Sz = ms(80);
const decorCircle3Sz = ms(60);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea:  { flex: 1 },

  // ── Header ──
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: hs(16),
    paddingVertical:   vs(16),
    backgroundColor:   '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width:           btnSize,
    height:          btnSize,
    borderRadius:    btnSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent:  'center',
    alignItems:      'center',
  },
  headerTitle:   { fontSize: fs(20), fontWeight: 'bold', color: '#0F172A' },
  historyButton: {
    width:           btnSize,
    height:          btnSize,
    borderRadius:    btnSize / 2,
    backgroundColor: '#EFF6FF',
    justifyContent:  'center',
    alignItems:      'center',
  },

  // ── Loading ──
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { marginTop: vs(12), fontSize: fs(15), color: '#64748B' },

  // ── Scroll ──
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: vs(100) },

  // ── Balance Card ──
  balanceCardContainer: { padding: hs(16) },
  balanceCard: {
    borderRadius:  ms(20),
    padding:       ms(24),
    position:      'relative',
    overflow:      'hidden',
    minHeight:     vs(180),
    elevation:     8,
    shadowColor:   '#6366F1',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius:  8,
  },
  coinsIconContainer: {
    position: 'absolute',
    right:    hs(20),
    top:      vs(20),
    opacity:  0.3,
  },
  balanceInfo:    { zIndex: 1 },
  balanceLabel:   { fontSize: fs(14), color: '#E0E7FF', marginBottom: vs(8) },
  balanceAmount:  { fontSize: fs(48), fontWeight: 'bold', color: '#FFFFFF', marginBottom: vs(4) },
  balanceSubtext: { fontSize: fs(16), color: '#E0E7FF' },
  rateTag: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.15)',
    alignSelf:         'flex-start',
    paddingHorizontal: hs(10),
    paddingVertical:   vs(4),
    borderRadius:      ms(12),
    marginTop:         vs(12),
    gap:               hs(4),
    zIndex:            1,
  },
  rateText: { fontSize: fs(12), color: '#E0E7FF', fontWeight: '500' },

  // ── Decor circles ──
  decorCircle:  { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  decorCircle1: { width: decorCircle1Sz, height: decorCircle1Sz, right: -hs(30), bottom: -vs(30) },
  decorCircle2: { width: decorCircle2Sz, height: decorCircle2Sz, right: hs(100), top: -vs(20) },
  decorCircle3: { width: decorCircle3Sz, height: decorCircle3Sz, left: -hs(20), bottom: vs(40) },

  // ── Transaction History Button style kept for easy re-enable ──
  transactionHistoryButton: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor:'#FFFFFF',
    padding:        ms(16),
    borderRadius:   ms(12),
    marginTop:      vs(12),
    elevation:      2,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 1 },
    shadowOpacity:  0.1,
    shadowRadius:   2,
  },
  transactionHistoryText: {
    flex:       1,
    fontSize:   fs(15),
    fontWeight: '600',
    color:      '#0F172A',
    marginLeft: hs(12),
  },

  // ── Section ──
  section:       { paddingHorizontal: hs(16), marginBottom: vs(24) },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   vs(16),
  },
  sectionTitle: { fontSize: fs(18), fontWeight: 'bold', color: '#0F172A', marginBottom: vs(16) },
  seeAllText:   { fontSize: fs(14), fontWeight: '600', color: '#6366F1', marginBottom: vs(16) },

  // ── Transactions Card styles kept for easy re-enable ──
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius:    ms(12),
    padding:         ms(4),
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.1,
    shadowRadius:    2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       ms(12),
  },
  txIconContainer: {
    width:         txIconSize,
    height:        txIconSize,
    borderRadius:  txIconSize / 2,
    justifyContent:'center',
    alignItems:    'center',
    marginRight:   hs(12),
  },
  txInfo:        { flex: 1 },
  txDescription: { fontSize: fs(14), fontWeight: '500', color: '#1E293B', marginBottom: vs(4) },
  txMeta:        { flexDirection: 'row', alignItems: 'center', gap: hs(8) },
  txDate:        { fontSize: fs(12), color: '#94A3B8' },
  multiplierTag: {
    backgroundColor:   '#FEF3C7',
    paddingHorizontal: hs(6),
    paddingVertical:   vs(2),
    borderRadius:      ms(6),
  },
  multiplierText: { fontSize: fs(10), fontWeight: 'bold', color: '#D97706' },
  txCoins:        { fontSize: fs(16), fontWeight: 'bold', marginLeft: hs(8) },
  txDivider:      { height: 1, backgroundColor: '#F1F5F9', marginLeft: txIconSize + hs(12) },

  // ── Options Grid styles kept for easy re-enable ──
  optionsGrid: { gap: vs(12) },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius:    ms(16),
    padding:         ms(20),
    position:        'relative',
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.1,
    shadowRadius:    3,
  },
  badge: {
    position:          'absolute',
    top:               vs(12),
    right:             hs(12),
    backgroundColor:   '#10B981',
    paddingHorizontal: hs(10),
    paddingVertical:   vs(4),
    borderRadius:      ms(12),
  },
  badgeNew:          { backgroundColor: '#F59E0B' },
  badgeText:         { fontSize: fs(10), fontWeight: 'bold', color: '#FFFFFF' },
  optionIconContainer: {
    width:          optionIconSize,
    height:         optionIconSize,
    borderRadius:   optionIconSize / 2,
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   vs(16),
  },
  optionTitle:       { fontSize: fs(16), fontWeight: '600', color: '#0F172A', marginBottom: vs(6) },
  optionDescription: { fontSize: fs(13), color: '#64748B', marginBottom: vs(12) },
  optionArrow:       { position: 'absolute', bottom: vs(20), right: hs(20) },

  // ── Earn Card ──
  earnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius:    ms(12),
    padding:         ms(16),
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.1,
    shadowRadius:    2,
  },
  earnItem: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: vs(12),
  },
  earnIconContainer: {
    width:           earnIconSize,
    height:          earnIconSize,
    borderRadius:    earnIconSize / 2,
    backgroundColor: '#EEF2FF',
    justifyContent:  'center',
    alignItems:      'center',
    marginRight:     hs(12),
  },
  earnItemDone: { opacity: 0.75 },
  earnIconDone: { backgroundColor: '#DCFCE7' },
  earnText:     { flex: 1, fontSize: fs(15), color: '#0F172A', fontWeight: '500' },
  earnTextDone: { color: '#64748B' },
  earnCoinsTag: {
    backgroundColor:   '#DCFCE7',
    paddingHorizontal: hs(12),
    paddingVertical:   vs(6),
    borderRadius:      ms(12),
  },
  earnCoinsText: { fontSize: fs(14), fontWeight: 'bold', color: '#16A34A' },
  earnDivider:   { height: 1, backgroundColor: '#F1F5F9' },

  // ── Info Banner ──
  infoBanner: {
    flexDirection:    'row',
    backgroundColor:  '#EFF6FF',
    padding:          ms(16),
    borderRadius:     ms(12),
    marginHorizontal: hs(16),
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      '#DBEAFE',
    marginBottom:     vs(20),
  },
  infoBannerText: {
    flex:       1,
    fontSize:   fs(13),
    color:      '#1E40AF',
    marginLeft: hs(12),
    lineHeight: fs(13) * 1.4,
  },
});

export default Coins;