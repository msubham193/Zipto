import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/useAuthStore';
import BottomTabBar from './BottomTabBar';

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

const Profile = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

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

  const menuSections = [
    {
      title: 'Account',
      items: [
        { id: 1,  title: 'Edit Profile',       icon: 'person-outline',           color: '#3B82F6', onPress: () => navigation.navigate('EditProfile') },
        { id: 2,  title: 'Saved Addresses',     icon: 'location-on',              color: '#10B981', onPress: () => navigation.navigate('SavedAddresses') },
        { id: 3,  title: 'Wallet',              icon: 'account-balance-wallet',   color: '#8B5CF6', onPress: () => navigation.navigate('Wallet') },
      ],
    },
    {
      title: 'Support & Help',
      items: [
        { id: 4,  title: 'Support',             icon: 'support-agent',            color: '#F59E0B', onPress: () => navigation.navigate('Support') },
        { id: 5,  title: 'FAQs',                icon: 'help-outline',             color: '#06B6D4', onPress: () => navigation.navigate('FAQs') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 6,  title: 'Settings',            icon: 'settings',                 color: '#64748B', onPress: () => navigation.navigate('Settings') },
        { id: 7,  title: 'Notifications',       icon: 'notifications',            color: '#EC4899', onPress: () => navigation.navigate('NotificationSettings') },
      ],
    },
    {
      title: 'Legal',
      items: [
        { id: 8,  title: 'Terms & Conditions',  icon: 'description',              color: '#0EA5E9', onPress: () => navigation.navigate('TermsAndConditions') },
        { id: 9,  title: 'Privacy Policy',      icon: 'privacy-tip',              color: '#14B8A6', onPress: () => navigation.navigate('PrivacyPolicy') },
      ],
    },
    {
      title: 'About',
      items: [
        { id: 10, title: 'About Us',            icon: 'info',                     color: '#6366F1', onPress: () => navigation.navigate('AboutUs') },
        { id: 11, title: 'Rate Our App',        icon: 'star',                     color: '#F59E0B', onPress: () => Alert.alert('Rate Us', 'Thank you for your interest! This feature will redirect to the app store.') },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <MaterialIcons name="person" size={ms(50)} color="#FFFFFF" />
              <TouchableOpacity style={styles.editAvatarButton}>
                <MaterialIcons name="camera-alt" size={ms(14)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* User info */}
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
              <Text style={styles.userPhone}>{user?.phone || 'No phone'}</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <MaterialIcons name="account-balance-wallet" size={ms(24)} color="#3B82F6" />
                <Text style={styles.statValue}>₹0</Text>
                <Text style={styles.statLabel}>Wallet</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <MaterialIcons name="local-shipping" size={ms(24)} color="#10B981" />
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
            </View>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                        <MaterialIcons name={item.icon} size={ms(22)} color={item.color} />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      <MaterialIcons name="chevron-right" size={ms(24)} color="#94A3B8" />
                    </TouchableOpacity>
                    {index < section.items.length - 1 && (
                      <View style={styles.menuDivider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          {/* Logout */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              activeOpacity={0.8}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <MaterialIcons name="logout" size={ms(22)} color="#EF4444" />
              )}
              <Text style={styles.logoutText}>
                {loggingOut ? 'Logging out...' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* App version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Zipto v1.0.0</Text>
            <Text style={styles.copyrightText}>© 2025 Zipto. All rights reserved.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabBar />
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize      = ms(40);
const avatarSize       = ms(100);
const editAvatarSize   = ms(32);
const menuIconContSize = ms(44);
// menuDivider indent = icon container + marginRight
const menuDividerLeft  = menuIconContSize + scaleW(14) + scaleW(16); // container + gap + card padding

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
  placeholder: { width: backBtnSize },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: scaleH(100) },

  // ── Profile card ──
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: scaleW(16),
    marginBottom: scaleH(12),
    padding: ms(20),
    borderRadius: ms(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarContainer: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(16),
    borderWidth: 3,
    borderColor: '#60A5FA',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: editAvatarSize,
    height: editAvatarSize,
    borderRadius: editAvatarSize / 2,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: scaleH(20),
  },
  userName: {
    fontSize: fs(24),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(6),
  },
  userEmail: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginBottom: scaleH(4),
  },
  userPhone: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: scaleH(20),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statBox:     { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#E2E8F0' },
  statValue: {
    fontSize: fs(18),
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: scaleH(8),
  },
  statLabel: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: scaleH(4),
  },

  // ── Menu sections ──
  menuSection: {
    marginBottom: scaleH(16),
    paddingHorizontal: scaleW(16),
  },
  sectionTitle: {
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginBottom: scaleH(10),
    marginLeft: scaleW(4),
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleH(14),
    paddingHorizontal: scaleW(16),
  },
  menuIconContainer: {
    width: menuIconContSize,
    height: menuIconContSize,
    borderRadius: menuIconContSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(14),
    flexShrink: 0,
  },
  menuItemText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: fs(15),
    color: '#0F172A',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: menuDividerLeft,
  },

  // ── Logout ──
  logoutSection: {
    paddingHorizontal: scaleW(16),
    marginTop: scaleH(8),
    marginBottom: scaleH(16),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleW(8),
    backgroundColor: '#FFFFFF',
    paddingVertical: scaleH(16),
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#EF4444',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutText: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#EF4444',
  },

  // ── Version ──
  versionContainer: {
    paddingVertical: scaleH(24),
    alignItems: 'center',
  },
  versionText: {
    fontSize: fs(13),
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: scaleH(4),
  },
  copyrightText: {
    fontSize: fs(11),
    fontWeight: '400',
    color: '#CBD5E1',
  },
});

export default Profile;