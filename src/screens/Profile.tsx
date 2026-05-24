import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/useAuthStore';
import BottomTabBar from './BottomTabBar';
import { vehicleApi } from '../api/vehicle';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#F8FAFC',
  surface:    '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  primary:    '#2563EB',
  text:       '#0F172A',
  textSub:    '#475569',
  textMuted:  '#94A3B8',
  border:     '#E2E8F0',
  red:        '#EF4444',
  shadow:     '#000000',
};

const Profile = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut]   = useState(false);
  const [orderCount, setOrderCount]   = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // wallet state & walletApi removed — wallet option removed from this screen
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const ordersRes = await vehicleApi.getCustomerHistory(1, 1).catch(() => null);
      const data = ordersRes?.data;
      if (typeof data?.total === 'number') setOrderCount(data.total);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { fetchStats(); }, [fetchStats]),
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
          } catch (err) {
            console.error('Logout error:', err);
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  // Wallet item removed from Account section
  const menuSections = [
    {
      title: 'Account',
      items: [
        { id: 1,  title: 'Edit Profile',      icon: 'person-outline',  color: '#3B82F6', onPress: () => navigation.navigate('EditProfile') },
        { id: 2,  title: 'Saved Addresses',   icon: 'location-on',     color: '#10B981', onPress: () => navigation.navigate('SavedAddresses') },
        { id: 12, title: 'My Orders',         icon: 'local-shipping',  color: '#F97316', onPress: () => navigation.navigate('MyOrders') },
      ],
    },
    {
      title: 'Support & Help',
      items: [
        { id: 4, title: 'Support', icon: 'support-agent', color: '#F59E0B', onPress: () => navigation.navigate('Support') },
        { id: 5, title: 'FAQs',    icon: 'help-outline',  color: '#06B6D4', onPress: () => navigation.navigate('FAQs') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 6, title: 'Settings', icon: 'settings', color: '#64748B', onPress: () => navigation.navigate('Settings') },
      ],
    },
    {
      title: 'Legal',
      items: [
        { id: 8, title: 'Terms & Conditions', icon: 'description',  color: '#0EA5E9', onPress: () => navigation.navigate('TermsAndConditions') },
        { id: 9, title: 'Privacy Policy',     icon: 'privacy-tip',  color: '#14B8A6', onPress: () => navigation.navigate('PrivacyPolicy') },
      ],
    },
    {
      title: 'About',
      items: [
        { id: 10, title: 'About Us',     icon: 'info', color: '#6366F1', onPress: () => navigation.navigate('AboutUs') },
        { id: 11, title: 'Rate Our App', icon: 'star', color: '#F59E0B', onPress: () => Alert.alert('Rate Us', 'Thank you for your interest! This feature will redirect to the app store.') },
      ],
    },
  ];

  // Get initials for avatar
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} translucent />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
        >
          <MaterialIcons name="arrow-back" size={ms(20)} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, vs(16)) + vs(80) }]}
      >
        {/* ── Hero Profile Card ── */}
        <View style={styles.heroCard}>
          {/* Gradient-style avatar with initials */}
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{user?.name || 'User'}</Text>
          {user?.email ? <Text style={styles.heroEmail}>{user.email}</Text> : null}
          <Text style={styles.heroPhone}>{user?.phone || 'No phone'}</Text>

          {/* Edit profile pill */}
          <TouchableOpacity
            style={styles.editPill}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="edit" size={ms(13)} color={C.primary} />
            <Text style={styles.editPillText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* ── Single stat — Orders only (wallet removed) ── */}
          {/* <View style={styles.statStrip}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('MyOrders')}
              activeOpacity={0.7}
            >
              <View style={styles.statIconBox}>
                <MaterialIcons name="local-shipping" size={ms(22)} color="#F97316" />
              </View>
              {statsLoading ? (
                <ActivityIndicator size="small" color="#F97316" style={{ marginTop: vs(6) }} />
              ) : (
                <Text style={styles.statValue}>{orderCount ?? 0}</Text>
              )}
              <Text style={styles.statLabel}>My Orders</Text>
            </TouchableOpacity>
          </View> */}
        </View>

        {/* ── Menu Sections ── */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.color + '18' }]}>
                      <MaterialIcons name={item.icon as any} size={ms(20)} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.title}</Text>
                    <MaterialIcons name="chevron-right" size={ms(22)} color={C.textMuted} />
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* ── Logout ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, loggingOut && { opacity: 0.6 }]}
            onPress={handleLogout}
            activeOpacity={0.8}
            disabled={loggingOut}
          >
            {loggingOut
              ? <ActivityIndicator size="small" color={C.red} />
              : <MaterialIcons name="logout" size={ms(20)} color={C.red} />
            }
            <Text style={styles.logoutText}>
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Version ── */}
        <View style={styles.versionBlock}>
          <Text style={styles.versionText}>Zipto v1.0.0</Text>
          <Text style={styles.copyright}>© 2025 Zipto. All rights reserved.</Text>
        </View>
      </ScrollView>

      <BottomTabBar />
    </View>
  );
};

// ─── Sizes ────────────────────────────────────────────────────────────────────
const GUTTER       = hs(16);
const AVATAR_SIZE  = ms(88);
const RING_SIZE    = AVATAR_SIZE + ms(8);
const BACK_SIZE    = ms(38);
const ICON_BOX     = ms(42);
const MENU_DIVIDER = ICON_BOX + hs(14) + GUTTER;

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: C.surface, // white behind translucent status bar
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: GUTTER,
    paddingTop:        vs(14),
    paddingBottom:     vs(14),
    backgroundColor:   C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap:               hs(10),
    shadowColor:       C.shadow,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.05,
    shadowRadius:      4,
    elevation:         3,
  },
  backBtn: {
    width:           BACK_SIZE,
    height:          BACK_SIZE,
    borderRadius:    BACK_SIZE / 2,
    backgroundColor: C.surfaceAlt,
    justifyContent:  'center',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     C.border,
    flexShrink:      0,
  },
  headerTitle: {
    flex:          1,
    fontSize:      fs(20),
    fontWeight:    '800',
    color:         C.text,
    letterSpacing: -0.3,
  },
  headerSpacer: { width: BACK_SIZE },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll:        { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: vs(20) },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: C.surface,
    borderRadius:    ms(20),
    alignItems:      'center',
    paddingTop:      vs(28),
    paddingBottom:   vs(20),
    paddingHorizontal: GUTTER,
    marginBottom:    vs(20),
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     C.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
  },
  avatarRing: {
    width:           RING_SIZE,
    height:          RING_SIZE,
    borderRadius:    RING_SIZE / 2,
    borderWidth:     3,
    borderColor:     '#BFDBFE',
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    vs(14),
  },
  avatar: {
    width:           AVATAR_SIZE,
    height:          AVATAR_SIZE,
    borderRadius:    AVATAR_SIZE / 2,
    backgroundColor: C.primary,
    justifyContent:  'center',
    alignItems:      'center',
  },
  avatarInitials: {
    fontSize:   fs(28),
    fontWeight: '800',
    color:      '#FFFFFF',
    letterSpacing: 1,
  },
  heroName: {
    fontSize:      fs(22),
    fontWeight:    '800',
    color:         C.text,
    letterSpacing: -0.3,
    marginBottom:  vs(4),
    textAlign:     'center',
  },
  heroEmail: {
    fontSize:     fs(13),
    color:        C.textSub,
    marginBottom: vs(2),
    textAlign:    'center',
  },
  heroPhone: {
    fontSize:     fs(13),
    color:        C.textMuted,
    marginBottom: vs(16),
    textAlign:    'center',
  },
  editPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               hs(5),
    borderRadius:      ms(20),
    borderWidth:       1.5,
    borderColor:       C.primary,
    paddingHorizontal: hs(16),
    paddingVertical:   vs(7),
    marginBottom:      vs(20),
  },
  editPillText: {
    fontSize:   fs(13),
    fontWeight: '700',
    color:      C.primary,
  },

  // Single stat strip (orders only)
  statStrip: {
    width:         '100%',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop:    vs(16),
    alignItems:    'center',
  },
  statItem: { alignItems: 'center' },
  statIconBox: {
    width:           ms(48),
    height:          ms(48),
    borderRadius:    ms(14),
    backgroundColor: '#FFF7ED',
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    vs(6),
  },
  statValue: {
    fontSize:   fs(20),
    fontWeight: '800',
    color:      C.text,
    marginTop:  vs(2),
  },
  statLabel: {
    fontSize:   fs(12),
    fontWeight: '500',
    color:      C.textMuted,
    marginTop:  vs(2),
  },

  // ── Menu sections ─────────────────────────────────────────────────────────
  section: { marginBottom: vs(16) },
  sectionTitle: {
    fontSize:     fs(12),
    fontWeight:   '700',
    color:        C.textMuted,
    marginBottom: vs(8),
    marginLeft:   hs(4),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: C.surface,
    borderRadius:    ms(14),
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     C.shadow,
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.04,
    shadowRadius:    4,
    elevation:       2,
  },
  menuRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   vs(14),
    paddingHorizontal: GUTTER,
    gap:               hs(14),
  },
  menuIconBox: {
    width:           ICON_BOX,
    height:          ICON_BOX,
    borderRadius:    ICON_BOX / 2,
    justifyContent:  'center',
    alignItems:      'center',
    flexShrink:      0,
  },
  menuLabel: {
    flex:       1,
    fontSize:   fs(15),
    fontWeight: '500',
    color:      C.text,
  },
  menuDivider: {
    height:          1,
    backgroundColor: C.surfaceAlt,
    marginLeft:      MENU_DIVIDER,
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               hs(8),
    backgroundColor:   C.surface,
    paddingVertical:   vs(16),
    borderRadius:      ms(14),
    borderWidth:       1.5,
    borderColor:       C.red,
    shadowColor:       C.shadow,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.04,
    shadowRadius:      4,
    elevation:         2,
  },
  logoutText: {
    fontSize:   fs(16),
    fontWeight: '700',
    color:      C.red,
  },

  // ── Version ───────────────────────────────────────────────────────────────
  versionBlock: {
    alignItems:     'center',
    paddingVertical: vs(24),
  },
  versionText: {
    fontSize:     fs(12),
    fontWeight:   '500',
    color:        C.textMuted,
    marginBottom: vs(4),
  },
  copyright: {
    fontSize:   fs(11),
    fontWeight: '400',
    color:      C.border,
  },
});

export default Profile;