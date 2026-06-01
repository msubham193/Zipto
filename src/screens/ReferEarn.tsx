import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
  TextInput,
} from 'react-native';
import { showAlert } from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import EnterView from '../components/EnterView';
import { referralApi, ReferralInfo, MyReferrals, ReferralRow } from '../api/referral';
import { moderateScale as ms, fontScale as fs } from '../utils/metrics';

/** Best-effort copy: uses the clipboard module if present, else opens Share. */
async function copyText(text: string): Promise<boolean> {
  try {
    // Avoid a hard dependency — only used if the lib is installed.
    const mod = require('@react-native-clipboard/clipboard');
    const Clipboard = mod?.default ?? mod;
    if (Clipboard?.setString) {
      Clipboard.setString(text);
      return true;
    }
  } catch {
    /* clipboard not available */
  }
  return false;
}

const STATUS_META: Record<ReferralRow['status'], { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',  color: '#B45309', bg: '#FEF3C7' },
  rewarded:  { label: 'Rewarded', color: '#047857', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
};

const ReferEarn = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [data, setData] = useState<MyReferrals | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [infoRes, listRes] = await Promise.all([
        referralApi.getMe().catch(() => null),
        referralApi.myReferrals().catch(() => null),
      ]);
      if (infoRes) setInfo(infoRes);
      if (listRes) setData(listRes);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const handleShare = async () => {
    if (!info) return;
    try {
      await Share.share({ message: info.share_message, title: 'Refer Zipto' });
    } catch {
      /* user dismissed */
    }
  };

  const handleCopy = async () => {
    if (!info) return;
    const ok = await copyText(info.code);
    if (ok) showAlert('Copied', `Referral code ${info.code} copied to clipboard`);
    else handleShare();
  };

  const handleApply = async () => {
    const code = applyCode.trim().toUpperCase();
    if (code.length < 4) {
      showAlert('Invalid code', 'Please enter a valid referral code');
      return;
    }
    try {
      setApplying(true);
      const res = await referralApi.apply(code);
      showAlert('Success', res.message || 'Referral code applied!');
      setApplyCode('');
      setApplyOpen(false);
      fetchData(true);
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message ?? 'Could not apply this code';
      showAlert('Could not apply', Array.isArray(raw) ? raw.join('\n') : String(raw));
    } finally {
      setApplying(false);
    }
  };

  const refereeCoins = info?.referee_coins ?? 500;
  const referrerCoins = info?.referrer_coins ?? 1000;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={ms(22)} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <View style={{ width: ms(40) }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        >
          {/* Hero card */}
          <EnterView delay={0}>
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroIconCircle}>
                <MaterialIcons name="card-giftcard" size={ms(30)} color="#FFFFFF" />
              </View>
              <Text style={styles.heroTitle}>Earn {referrerCoins} coins</Text>
              <Text style={styles.heroSub}>
                Invite a friend. They get {refereeCoins} coins on their first order — and you get{' '}
                {referrerCoins} coins. 🎉
              </Text>
            </LinearGradient>
          </EnterView>

          {/* Code card */}
          <EnterView delay={60}>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your referral code</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeValue}>{info?.code ?? '——————'}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
                  <MaterialIcons name="content-copy" size={ms(16)} color="#2563EB" />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.9}>
                <MaterialIcons name="share" size={ms(18)} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Invite friends</Text>
              </TouchableOpacity>
            </View>
          </EnterView>

          {/* Stats */}
          <EnterView delay={120}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{data?.summary.total ?? 0}</Text>
                <Text style={styles.statLabel}>Referred</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#047857' }]}>{data?.summary.rewarded ?? 0}</Text>
                <Text style={styles.statLabel}>Rewarded</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#D97706' }]}>{data?.summary.coins_earned ?? 0}</Text>
                <Text style={styles.statLabel}>Coins earned</Text>
              </View>
            </View>
          </EnterView>

          {/* How it works */}
          <EnterView delay={180}>
            <View style={styles.howCard}>
              <Text style={styles.sectionTitle}>How it works</Text>
              {[
                { icon: 'ios-share', text: 'Share your code with friends' },
                { icon: 'person-add', text: 'They sign up using your code' },
                { icon: 'local-shipping', text: `They complete their first order — they get ${refereeCoins}` },
                { icon: 'savings', text: `You get ${referrerCoins} coins, instantly` },
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
            </View>
          </EnterView>

          {/* My referrals */}
          <EnterView delay={220}>
            <View style={styles.listCard}>
              <Text style={styles.sectionTitle}>Your referrals</Text>
              {(!data || data.referrals.length === 0) ? (
                <View style={styles.emptyWrap}>
                  <MaterialIcons name="group-add" size={ms(34)} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No referrals yet. Share your code to start earning!</Text>
                </View>
              ) : (
                data.referrals.map((r) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <View key={r.id} style={styles.refRow}>
                      <View style={styles.refAvatar}>
                        <Text style={styles.refAvatarText}>
                          {(r.referee_name || 'N').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.refName} numberOfLines={1}>{r.referee_name}</Text>
                        {!!r.referee_phone && <Text style={styles.refPhone}>{r.referee_phone}</Text>}
                      </View>
                      <View style={styles.refRight}>
                        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                        {r.status === 'rewarded' && (
                          <Text style={styles.refCoins}>+{r.coins}</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </EnterView>

          {/* Have a code? */}
          <EnterView delay={260}>
            <View style={styles.applyCard}>
              <TouchableOpacity
                style={styles.applyToggle}
                onPress={() => setApplyOpen((v) => !v)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="redeem" size={ms(18)} color="#2563EB" />
                <Text style={styles.applyToggleText}>Have a referral code?</Text>
                <MaterialIcons
                  name={applyOpen ? 'expand-less' : 'expand-more'}
                  size={ms(20)}
                  color="#6B7280"
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
              {applyOpen && (
                <View style={styles.applyBody}>
                  <Text style={styles.applyHint}>
                    Enter it before your first order to earn {refereeCoins} bonus coins.
                  </Text>
                  <View style={styles.applyInputRow}>
                    <TextInput
                      style={styles.applyInput}
                      value={applyCode}
                      onChangeText={(t) => setApplyCode(t.toUpperCase())}
                      placeholder="ENTER CODE"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                      maxLength={12}
                    />
                    <TouchableOpacity
                      style={[styles.applyBtn, applying && { opacity: 0.6 }]}
                      onPress={handleApply}
                      disabled={applying}
                      activeOpacity={0.9}
                    >
                      {applying ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.applyBtnText}>Apply</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </EnterView>

          <View style={{ height: ms(24) }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safeTop: { backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: fs(17), fontWeight: '700', color: '#111827' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: ms(16), gap: ms(14) },

  // Hero
  hero: {
    borderRadius: ms(20),
    padding: ms(20),
    alignItems: 'center',
  },
  heroIconCircle: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  heroTitle: { fontSize: fs(24), fontWeight: '900', color: '#FFFFFF', marginBottom: ms(6) },
  heroSub: { fontSize: fs(13), color: '#DBEAFE', textAlign: 'center', lineHeight: fs(19) },

  // Code card
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#EFF2F7',
  },
  codeLabel: { fontSize: fs(12), color: '#6B7280', marginBottom: ms(8), fontWeight: '600' },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    borderRadius: ms(12),
    paddingVertical: ms(12),
    paddingHorizontal: ms(14),
    marginBottom: ms(12),
  },
  codeValue: { fontSize: fs(22), fontWeight: '900', color: '#1E40AF', letterSpacing: ms(3) },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  copyBtnText: { fontSize: fs(13), fontWeight: '700', color: '#2563EB' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: ms(13),
  },
  shareBtnText: { fontSize: fs(15), fontWeight: '700', color: '#FFFFFF' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    paddingVertical: ms(16),
    borderWidth: 1,
    borderColor: '#EFF2F7',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: ms(28), backgroundColor: '#EEF2F6' },
  statValue: { fontSize: fs(20), fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: fs(11), color: '#6B7280', marginTop: ms(2) },

  // How it works
  howCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#EFF2F7',
  },
  sectionTitle: { fontSize: fs(15), fontWeight: '800', color: '#111827', marginBottom: ms(12) },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: ms(12), marginBottom: ms(12) },
  stepNum: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: { fontSize: fs(12), fontWeight: '800', color: '#2563EB' },
  stepText: { flex: 1, fontSize: fs(13), color: '#374151', lineHeight: fs(18) },

  // Referral list
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#EFF2F7',
  },
  emptyWrap: { alignItems: 'center', paddingVertical: ms(18), gap: ms(8) },
  emptyText: { fontSize: fs(12), color: '#94A3B8', textAlign: 'center', paddingHorizontal: ms(20) },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingVertical: ms(10),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  refAvatar: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refAvatarText: { fontSize: fs(15), fontWeight: '800', color: '#2563EB' },
  refName: { fontSize: fs(13), fontWeight: '700', color: '#111827' },
  refPhone: { fontSize: fs(11), color: '#6B7280', marginTop: ms(1) },
  refRight: { alignItems: 'flex-end', gap: ms(3) },
  statusBadge: { borderRadius: ms(8), paddingHorizontal: ms(8), paddingVertical: ms(3) },
  statusText: { fontSize: fs(10), fontWeight: '700' },
  refCoins: { fontSize: fs(12), fontWeight: '800', color: '#D97706' },

  // Apply
  applyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: '#EFF2F7',
    overflow: 'hidden',
  },
  applyToggle: { flexDirection: 'row', alignItems: 'center', gap: ms(8), padding: ms(16) },
  applyToggleText: { fontSize: fs(14), fontWeight: '700', color: '#111827' },
  applyBody: { paddingHorizontal: ms(16), paddingBottom: ms(16), gap: ms(10) },
  applyHint: { fontSize: fs(12), color: '#6B7280' },
  applyInputRow: { flexDirection: 'row', gap: ms(10) },
  applyInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(11),
    fontSize: fs(15),
    fontWeight: '700',
    color: '#111827',
    letterSpacing: ms(2),
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingHorizontal: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: ms(84),
  },
  applyBtnText: { fontSize: fs(14), fontWeight: '700', color: '#FFFFFF' },
});

export default ReferEarn;
