import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { vehicleApi, CoinTransaction } from '../api/vehicle';

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

const TransactionHistoryScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [loadingMore, setLoadingMore]   = useState(false);

  const fetchTransactions = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      const res = await vehicleApi.getCoinsHistory(pageNum, 20);
      if (res?.transactions) {
        if (pageNum === 1) {
          setTransactions(res.transactions);
        } else {
          setTransactions(prev => [...prev, ...res.transactions]);
        }
        setTotalPages(res.totalPages ?? 1);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && page < totalPages) fetchTransactions(page + 1);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date   = new Date(dateStr);
      const day    = date.getDate().toString().padStart(2, '0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const month  = months[date.getMonth()];
      const year   = date.getFullYear();
      let hours    = date.getHours();
      const mins   = date.getMinutes().toString().padStart(2, '0');
      const ampm   = hours >= 12 ? 'PM' : 'AM';
      hours        = hours % 12 || 12;
      return `${day} ${month} ${year} • ${hours}:${mins} ${ampm}`;
    } catch { return dateStr; }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'earned') return 'add-circle';
    if (type === 'redeemed' || type === 'spent') return 'remove-circle';
    if (type === 'transferred') return 'swap-horiz';
    return 'stars';
  };

  const getTransactionColor = (type: string) => {
    if (type === 'earned') return '#10B981';
    if (type === 'redeemed' || type === 'spent') return '#EF4444';
    if (type === 'transferred') return '#F59E0B';
    return '#6366F1';
  };

  const renderTransaction = ({ item }: { item: CoinTransaction }) => {
    const color    = getTransactionColor(item.type);
    const isEarned = item.type === 'earned';

    return (
      <View style={styles.transactionCard}>
        <View style={[styles.transactionIcon, { backgroundColor: color + '15' }]}>
          <MaterialIcons name={getTransactionIcon(item.type)} size={ms(24)} color={color} />
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDesc} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
          {item.multiplier && Number(item.multiplier) > 1 && (
            <View style={styles.multiplierTag}>
              <MaterialIcons name="bolt" size={ms(12)} color="#D97706" />
              <Text style={styles.multiplierText}>{Number(item.multiplier).toFixed(1)}x multiplier</Text>
            </View>
          )}
        </View>

        <View style={styles.coinsColumn}>
          <Text style={[styles.transactionAmount, { color }]}>
            {isEarned ? '+' : '-'}{item.coins}
          </Text>
          <Text style={styles.coinsLabel}>coins</Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366F1" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="receipt-long" size={ms(64)} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Transactions Yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete deliveries to start earning coins!
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.emptyButtonText}>Book a Delivery</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Transaction History</Text>
            <View style={{ width: ms(40) }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        </SafeAreaView>
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
          <Text style={styles.headerTitle}>Transaction History</Text>
          <View style={{ width: ms(40) }} />
        </View>

        {/* Summary bar */}
        {transactions.length > 0 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Earned</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                +{transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.coins, 0)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                -{transactions.filter(t => t.type !== 'earned').reduce((sum, t) => sum + t.coins, 0)}
              </Text>
            </View>
          </View>
        )}

        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize = ms(40);
const txIconSize  = ms(48);

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
  headerTitle: { fontSize: fs(20), fontWeight: 'bold', color: '#0F172A' },

  // ── Loading ──
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: scaleH(12), fontSize: fs(15), color: '#64748B' },

  // ── Summary bar ──
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: scaleH(14),
    paddingHorizontal: scaleW(24),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryLabel:   { fontSize: fs(12), color: '#94A3B8', marginBottom: scaleH(4) },
  summaryValue:   { fontSize: fs(18), fontWeight: 'bold' },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0' },

  // ── List ──
  listContent: {
    padding: scaleW(16),
    flexGrow: 1,
  },

  // ── Transaction Card ──
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ms(16),
    borderRadius: ms(12),
    marginBottom: scaleH(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  transactionIcon: {
    width: txIconSize,
    height: txIconSize,
    borderRadius: txIconSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(12),
    flexShrink: 0,
  },
  transactionInfo: { flex: 1 },
  transactionDesc: {
    fontSize: fs(15),
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: scaleH(4),
  },
  transactionDate: { fontSize: fs(12), color: '#94A3B8' },
  multiplierTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: scaleW(8),
    paddingVertical: scaleH(3),
    borderRadius: ms(8),
    alignSelf: 'flex-start',
    marginTop: scaleH(6),
    gap: scaleW(3),
  },
  multiplierText: { fontSize: fs(11), fontWeight: 'bold', color: '#D97706' },

  coinsColumn: {
    alignItems: 'flex-end',
    marginLeft: scaleW(8),
    flexShrink: 0,
  },
  transactionAmount: { fontSize: fs(18), fontWeight: 'bold' },
  coinsLabel: { fontSize: fs(11), color: '#94A3B8', marginTop: scaleH(2) },

  // ── Footer loader ──
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleH(16),
    gap: scaleW(8),
  },
  footerText: { fontSize: fs(13), color: '#64748B' },

  // ── Empty state ──
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scaleH(80),
  },
  emptyTitle: {
    fontSize: fs(18),
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: scaleH(16),
  },
  emptySubtitle: {
    fontSize: fs(14),
    color: '#64748B',
    marginTop: scaleH(8),
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: scaleH(24),
    backgroundColor: '#6366F1',
    paddingVertical: scaleH(12),
    paddingHorizontal: scaleW(32),
    borderRadius: ms(12),
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '600' },
});

export default TransactionHistoryScreen;