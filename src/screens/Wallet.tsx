import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { showAlert } from '../components/CustomAlert';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {walletApi} from '../api/client';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';


interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  description: string;
  source: string;
  reference_id: string | null;
  created_at: string;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
}

const Wallet = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Money modal
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchWallet = useCallback(async (silent = false) => {
    if (!silent) {setLoading(true);}
    try {
      const res = await walletApi.getWallet();
      if (res?.data) {
        setBalance(res.data.balance ?? 0);
        setTransactions(res.data.transactions ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWallet(true);
  };

  const handleAddMoney = () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum < 10) {
      showAlert('Invalid Amount', 'Minimum top-up amount is ₹10.');
      return;
    }
    if (amtNum > 50000) {
      showAlert('Invalid Amount', 'Maximum top-up amount is ₹50,000.');
      return;
    }
    setShowAddMoney(false);
    setAmount('');
    // Navigate to HDFC Payment screen; wallet is credited by backend after HDFC response
    navigation.navigate('Payment', { type: 'wallet', amount: amtNum });
    // Refresh wallet balance when user returns
    setTimeout(() => fetchWallet(true), 3000);
  };

  const creditCount = transactions.filter(t => t.type === 'credit').length;
  const debitCount = transactions.filter(t => t.type === 'debit').length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <TouchableOpacity
            onPress={() => fetchWallet(true)}
            style={styles.backButton}>
            <MaterialIcons name="refresh" size={ms(22)} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3B82F6']}
              />
            }>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceIconWrap}>
                <MaterialIcons
                  name="account-balance-wallet"
                  size={ms(32)}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                ₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialIcons name="arrow-downward" size={ms(16)} color="#86EFAC" />
                  <Text style={styles.statValue}>{creditCount}</Text>
                  <Text style={styles.statLabel}>Credits</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcons name="arrow-upward" size={ms(16)} color="#FCA5A5" />
                  <Text style={styles.statValue}>{debitCount}</Text>
                  <Text style={styles.statLabel}>Debits</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcons name="receipt-long" size={ms(16)} color="#BAE6FD" />
                  <Text style={styles.statValue}>{transactions.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setShowAddMoney(true)}
                  activeOpacity={0.85}>
                  <MaterialIcons name="add" size={ms(20)} color="#3B82F6" />
                  <Text style={styles.addBtnText}>Add Money</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.historyBtn}
                  onPress={() => navigation.navigate('TransactionHistory')}
                  activeOpacity={0.85}>
                  <MaterialIcons name="history" size={ms(20)} color="#FFFFFF" />
                  <Text style={styles.historyBtnText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transaction list */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>

              {transactions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <MaterialIcons
                    name="receipt-long"
                    size={ms(40)}
                    color="#CBD5E1"
                  />
                  <Text style={styles.emptyText}>No transactions yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add money to get started
                  </Text>
                </View>
              ) : (
                transactions.map(txn => (
                  <View key={txn.id} style={styles.txnCard}>
                    <View
                      style={[
                        styles.txnIcon,
                        txn.type === 'credit'
                          ? styles.txnIconCredit
                          : styles.txnIconDebit,
                      ]}>
                      <MaterialIcons
                        name={
                          txn.type === 'credit'
                            ? 'arrow-downward'
                            : 'arrow-upward'
                        }
                        size={ms(20)}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.txnDetails}>
                      <Text style={styles.txnDesc} numberOfLines={1}>
                        {txn.description}
                      </Text>
                      <Text style={styles.txnDate}>
                        {formatDate(txn.created_at)}
                      </Text>
                    </View>
                    <View style={styles.txnRight}>
                      <Text
                        style={[
                          styles.txnAmount,
                          txn.type === 'credit'
                            ? styles.txnAmountCredit
                            : styles.txnAmountDebit,
                        ]}>
                        {txn.type === 'credit' ? '+' : '-'}₹
                        {parseFloat(txn.amount as unknown as string).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={styles.txnBalance}>
                        Bal: ₹{parseFloat(txn.balance_after as unknown as string).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ── Add Money Modal ── */}
      <Modal
        visible={showAddMoney}
        animationType="slide"
        transparent
        onRequestClose={() => !adding && setShowAddMoney(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money</Text>
              <TouchableOpacity
                onPress={() => !adding && setShowAddMoney(false)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <MaterialIcons name="close" size={ms(22)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Current balance */}
            <View style={styles.currentBal}>
              <Text style={styles.currentBalLabel}>Current Balance</Text>
              <Text style={styles.currentBalAmt}>
                ₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}
              </Text>
            </View>

            {/* Amount input */}
            <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#CBD5E1"
                maxLength={6}
                editable={!adding}
              />
            </View>

            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.quickChip,
                    amount === String(q) && styles.quickChipActive,
                  ]}
                  onPress={() => setAmount(String(q))}
                  disabled={adding}>
                  <Text
                    style={[
                      styles.quickChipText,
                      amount === String(q) && styles.quickChipTextActive,
                    ]}>
                    +₹{q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pay button */}
            <TouchableOpacity
              style={[styles.payBtn, adding && styles.payBtnDisabled]}
              onPress={handleAddMoney}
              disabled={adding}
              activeOpacity={0.85}>
              {adding ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="lock" size={ms(18)} color="#FFFFFF" />
                  <Text style={styles.payBtnText}>
                    Pay ₹{amount || '0'} Securely
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.poweredBy}>Powered by Razorpay</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Derived sizes ────────────────────────────────────────────────────────────
const balIconSize = ms(64);
const txnIconSize = ms(44);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  safeArea: {flex: 1},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hs(16),
    paddingVertical: vs(14),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      android: {elevation: 2},
      ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 4},
    }),
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

  scrollView: {flex: 1},

  // ── Balance Card ──
  balanceCard: {
    backgroundColor: '#3B82F6',
    margin: hs(16),
    padding: ms(24),
    borderRadius: ms(20),
    alignItems: 'center',
    ...Platform.select({
      android: {elevation: 6},
      ios: {shadowColor: '#3B82F6', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.35, shadowRadius: 16},
    }),
  },
  balanceIconWrap: {
    width: balIconSize,
    height: balIconSize,
    borderRadius: balIconSize / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  balanceLabel: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: vs(6),
  },
  balanceAmount: {
    fontSize: fs(40),
    fontWeight: '800',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    marginBottom: vs(20),
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: ms(12),
    paddingVertical: vs(10),
    paddingHorizontal: hs(16),
    width: '100%',
    marginBottom: vs(20),
  },
  statItem: {flex: 1, alignItems: 'center', gap: vs(2)},
  statDivider: {width: 1, backgroundColor: 'rgba(255,255,255,0.25)'},
  statValue: {fontSize: fs(16), fontWeight: '700', color: '#FFFFFF', fontFamily: 'Poppins-Regular'},
  statLabel: {fontSize: fs(11), color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins-Regular'},
  cardActions: {flexDirection: 'row', gap: hs(12), width: '100%'},
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    backgroundColor: '#FFFFFF',
    paddingVertical: vs(13),
    borderRadius: ms(12),
  },
  addBtnText: {fontSize: fs(14), fontWeight: '700', color: '#3B82F6', fontFamily: 'Poppins-Regular'},
  historyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: vs(13),
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  historyBtnText: {fontSize: fs(14), fontWeight: '700', color: '#FFFFFF', fontFamily: 'Poppins-Regular'},

  // ── Transactions ──
  section: {paddingHorizontal: hs(16), paddingBottom: vs(40)},
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Poppins-Regular',
    marginBottom: vs(14),
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(14),
    padding: ms(28),
    alignItems: 'center',
    gap: vs(8),
  },
  emptyText: {fontSize: fs(15), fontWeight: '600', color: '#475569', fontFamily: 'Poppins-Regular'},
  emptySubtext: {fontSize: fs(13), color: '#94A3B8', fontFamily: 'Poppins-Regular'},
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ms(14),
    borderRadius: ms(14),
    marginBottom: vs(10),
    ...Platform.select({
      android: {elevation: 1},
      ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3},
    }),
  },
  txnIcon: {
    width: txnIconSize,
    height: txnIconSize,
    borderRadius: txnIconSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hs(12),
    flexShrink: 0,
  },
  txnIconCredit: {backgroundColor: '#10B981'},
  txnIconDebit: {backgroundColor: '#EF4444'},
  txnDetails: {flex: 1},
  txnDesc: {fontSize: fs(14), fontWeight: '600', color: '#0F172A', fontFamily: 'Poppins-Regular', marginBottom: vs(3)},
  txnDate: {fontSize: fs(11), color: '#94A3B8', fontFamily: 'Poppins-Regular'},
  txnRight: {alignItems: 'flex-end', gap: vs(3)},
  txnAmount: {fontSize: fs(15), fontWeight: '800', fontFamily: 'Poppins-Regular'},
  txnAmountCredit: {color: '#16A34A'},
  txnAmountDebit: {color: '#DC2626'},
  txnBalance: {fontSize: fs(11), color: '#94A3B8', fontFamily: 'Poppins-Regular'},

  // ── Add Money Modal ──
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    padding: hs(20),
    paddingBottom: vs(36),
  },
  modalHandle: {
    width: hs(40),
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: vs(16),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  modalTitle: {fontSize: fs(20), fontWeight: '700', color: '#0F172A', fontFamily: 'Poppins-Regular'},
  currentBal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: ms(12),
    padding: ms(14),
    marginBottom: vs(20),
  },
  currentBalLabel: {fontSize: fs(13), color: '#16A34A', fontFamily: 'Poppins-Regular'},
  currentBalAmt: {fontSize: fs(16), fontWeight: '700', color: '#16A34A', fontFamily: 'Poppins-Regular'},
  inputLabel: {fontSize: fs(13), fontWeight: '600', color: '#475569', fontFamily: 'Poppins-Regular', marginBottom: vs(8)},
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: ms(14),
    paddingHorizontal: hs(16),
    marginBottom: vs(16),
  },
  rupeeSign: {fontSize: fs(22), fontWeight: '700', color: '#0F172A', marginRight: hs(4)},
  amountInput: {
    flex: 1,
    fontSize: fs(32),
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: vs(12),
    fontFamily: 'Poppins-Regular',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hs(8),
    marginBottom: vs(24),
  },
  quickChip: {
    paddingHorizontal: hs(14),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  quickChipActive: {borderColor: '#3B82F6', backgroundColor: '#EFF6FF'},
  quickChipText: {fontSize: fs(13), fontWeight: '600', color: '#64748B', fontFamily: 'Poppins-Regular'},
  quickChipTextActive: {color: '#3B82F6'},
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    backgroundColor: '#3B82F6',
    paddingVertical: vs(16),
    borderRadius: ms(14),
    marginBottom: vs(12),
    ...Platform.select({
      android: {elevation: 4},
      ios: {shadowColor: '#3B82F6', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8},
    }),
  },
  payBtnDisabled: {backgroundColor: '#94A3B8'},
  payBtnText: {fontSize: fs(16), fontWeight: '700', color: '#FFFFFF', fontFamily: 'Poppins-Regular'},
  poweredBy: {fontSize: fs(11), color: '#94A3B8', textAlign: 'center', fontFamily: 'Poppins-Regular'},
});

export default Wallet;
