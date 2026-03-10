import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
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

const Settings = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [pushNotifications,    setPushNotifications]    = useState(true);
  const [emailNotifications,   setEmailNotifications]   = useState(false);
  const [smsNotifications,     setSmsNotifications]     = useState(true);
  const [locationServices,     setLocationServices]     = useState(true);
  const [shareDataForAnalytics,setShareDataForAnalytics]= useState(false);
  const [darkMode,             setDarkMode]             = useState(false);
  const [autoPlayVideos,       setAutoPlayVideos]       = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear app cache? This will free up storage space.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Cache cleared successfully!') },
      ]
    );
  };

  const handleChangePassword = () => navigation.navigate('ChangePassword');

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Account deletion initiated') },
      ]
    );
  };

  // ── Reusable row components ─────────────────────────────────────────────
  const SwitchRow = ({
    icon, iconColor, title, desc, value, onValueChange,
  }: {
    icon: string; iconColor: string; title: string; desc: string;
    value: boolean; onValueChange: (v: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <MaterialIcons name={icon} size={ms(20)} color={iconColor} />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
        thumbColor={value ? '#3B82F6' : '#CBD5E1'}
      />
    </View>
  );

  const ChevronRow = ({
    icon, iconColor, title, desc, titleColor, onPress,
  }: {
    icon: string; iconColor: string; title: string; desc: string;
    titleColor?: string; onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <MaterialIcons name={icon} size={ms(20)} color={iconColor} />
          <Text style={[styles.settingTitle, titleColor ? { color: titleColor } : undefined]}>
            {title}
          </Text>
        </View>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={ms(24)} color="#94A3B8" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Notifications ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.settingsCard}>
              <SwitchRow
                icon="notifications" iconColor="#3B82F6"
                title="Push Notifications" desc="Receive order updates and alerts"
                value={pushNotifications} onValueChange={setPushNotifications}
              />
              <View style={styles.settingDivider} />
              <SwitchRow
                icon="email" iconColor="#10B981"
                title="Email Notifications" desc="Promotional emails and updates"
                value={emailNotifications} onValueChange={setEmailNotifications}
              />
              <View style={styles.settingDivider} />
              <SwitchRow
                icon="sms" iconColor="#F59E0B"
                title="SMS Notifications" desc="Important order alerts via SMS"
                value={smsNotifications} onValueChange={setSmsNotifications}
              />
            </View>
          </View>

          {/* ── Privacy & Security ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
            <View style={styles.settingsCard}>
              <SwitchRow
                icon="location-on" iconColor="#EF4444"
                title="Location Services" desc="Required for accurate delivery"
                value={locationServices} onValueChange={setLocationServices}
              />
              <View style={styles.settingDivider} />
              <SwitchRow
                icon="analytics" iconColor="#8B5CF6"
                title="Share Analytics Data" desc="Help us improve the app"
                value={shareDataForAnalytics} onValueChange={setShareDataForAnalytics}
              />
            </View>
          </View>

          {/* ── App Preferences ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Preferences</Text>
            <View style={styles.settingsCard}>
              <SwitchRow
                icon="dark-mode" iconColor="#64748B"
                title="Dark Mode" desc="Switch to dark theme"
                value={darkMode} onValueChange={setDarkMode}
              />
              <View style={styles.settingDivider} />
              <SwitchRow
                icon="play-circle-outline" iconColor="#EC4899"
                title="Auto-play Videos" desc="Auto-play promotional videos"
                value={autoPlayVideos} onValueChange={setAutoPlayVideos}
              />
              <View style={styles.settingDivider} />
              <ChevronRow
                icon="language" iconColor="#0EA5E9"
                title="Language" desc="English (US)"
              />
            </View>
          </View>

          {/* ── Account ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.settingsCard}>
              <ChevronRow
                icon="lock-outline" iconColor="#3B82F6"
                title="Change Password" desc="Update your password"
                onPress={handleChangePassword}
              />
              <View style={styles.settingDivider} />
              <ChevronRow
                icon="cleaning-services" iconColor="#F59E0B"
                title="Clear Cache" desc="Free up storage space"
                onPress={handleClearCache}
              />
              <View style={styles.settingDivider} />
              <ChevronRow
                icon="delete-forever" iconColor="#EF4444"
                title="Delete Account" desc="Permanently delete your account"
                titleColor="#EF4444"
                onPress={handleDeleteAccount}
              />
            </View>
          </View>

          {/* ── App Info ── */}
          <View style={styles.appInfoCard}>
            <MaterialIcons name="info-outline" size={ms(20)} color="#64748B" />
            <View style={styles.appInfoText}>
              <Text style={styles.appInfoTitle}>App Version</Text>
              <Text style={styles.appInfoVersion}>Zipto v1.0.0 (Build 100)</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize   = ms(40);
// settingDesc indented to align with title text: icon size + gap
const descIndent    = ms(20) + scaleW(8);

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
  scrollContent: { padding: scaleW(16) },

  // ── Section ──
  section: { marginBottom: scaleH(24) },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(12),
  },

  // ── Card ──
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  // ── Row ──
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(14),
  },
  settingInfo:   { flex: 1, marginRight: scaleW(12) },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(8),
    marginBottom: scaleH(4),
  },
  settingTitle: {
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  settingDesc: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginLeft: descIndent,   // aligns under title text, not icon
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: scaleW(16),
  },

  // ── App info ──
  appInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ms(16),
    borderRadius: ms(12),
    gap: scaleW(12),
    marginBottom: scaleH(16),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  appInfoText: { flex: 1 },
  appInfoTitle: {
    fontSize: fs(14),
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(2),
  },
  appInfoVersion: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },
});

export default Settings;