import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTabBar from '../../components/BottomTabBar';
import { vehicleApi, CoinTransaction } from '../../api/vehicle';
import EnterView from '../../components/EnterView';
import LinearGradient from 'react-native-linear-gradient';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../../utils/metrics';

const Coins = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

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

  const earnCoinsWays = [
    {
      icon: 'local-shipping',
      text: 'Complete deliveries',
      coins: 'Per order',
      done: false,
      onPress: () => navigation.navigate('EarnCoinsInfo'),
    },
    {
      icon: 'share',
      text: 'Refer friends',
      coins: '+1000',
      done: false,
      onPress: () => navigation.navigate('ReferEarn'),
    },
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
            <View style={styles.headerSpacer} />
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
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
          }
        >
          {/* ── Balance Card ── */}
          <EnterView delay={40} style={styles.balanceCardContainer}>
            <ImageBackground
              source={require('../../assets/images/coins-bg.png')}
              style={styles.balanceCard}
              imageStyle={styles.balanceCardImage}
              resizeMode="cover"
            >
              {/* Dark overlay — heavier on the left so the text reads clearly,
                  fading right so the coins stay visible. */}
              <LinearGradient
                colors={['rgba(8,15,70,0.86)', 'rgba(8,15,70,0.55)', 'rgba(8,15,70,0.20)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.balanceCardOverlay}
              />
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Available Coins</Text>
                {balanceError ? (
                  <Text style={styles.balanceAmount}>--</Text>
                ) : (
                  <>
                    <Text style={styles.balanceAmount}>{coins.toLocaleString()}</Text>
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
            </ImageBackground>
          </EnterView>

          {/* ── Earn More Coins ── */}
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
                    <View style={styles.earnCoinsTag}>
                      <Text style={styles.earnCoinsText}>{way.coins}</Text>
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

          {/* ── Info Banner ── */}
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

// ─── Derived responsive values ─────────────────────────────────────────────────
const btnSize        = ms(40);
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
  headerSpacer:  { width: btnSize },

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
    overflow:      'hidden',
    minHeight:     vs(180),
    justifyContent: 'space-between',
    backgroundColor: '#1E40FF', // fallback while the image loads
    elevation:     8,
    shadowColor:   '#1E40FF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  8,
  },
  balanceCardImage: { borderRadius: ms(20) },
  balanceCardOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: ms(20),
  },
  coinsIconContainer: {
    position: 'absolute',
    right:    hs(16),
    top:      vs(16),
    opacity:  0.25,
    zIndex:   0,
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

  // ── Section ──
  section:      { paddingHorizontal: hs(16), marginBottom: vs(24) },
  sectionTitle: { fontSize: fs(18), fontWeight: 'bold', color: '#0F172A', marginBottom: vs(16) },

  // ── Earn Card ──
  earnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius:    ms(12),
    padding:         ms(4),
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
    paddingHorizontal: hs(12),
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
    marginRight:       hs(8),
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
    gap:              hs(12),
  },
  infoBannerText: {
    flex:       1,
    fontSize:   fs(13),
    color:      '#1E40AF',
    lineHeight: fs(13) * 1.4,
  },
});

export default Coins;
