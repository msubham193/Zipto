import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
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

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize = ms(40);
// desc indent = icon size + gap
const descIndent  = ms(20) + scaleW(8);

// ─── Reusable row component ───────────────────────────────────────────────────
const SwitchRow = ({
  icon, iconColor, title, desc, value, onValueChange, disabled,
}: {
  icon: string; iconColor: string; title: string; desc: string;
  value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean;
}) => (
  <View style={[styles.settingItem, disabled && { opacity: 0.45 }]}>
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
      disabled={disabled}
    />
  </View>
);

const NotificationSettings = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  // Order
  const [orderUpdates,    setOrderUpdates]    = useState(true);
  const [orderPickedUp,   setOrderPickedUp]   = useState(true);
  const [orderDelivered,  setOrderDelivered]  = useState(true);
  const [orderCancelled,  setOrderCancelled]  = useState(true);

  // Promotional
  const [promotions,   setPromotions]   = useState(true);
  const [specialOffers,setSpecialOffers]= useState(false);
  const [newFeatures,  setNewFeatures]  = useState(false);

  // Wallet & Payments
  const [walletUpdates,     setWalletUpdates]     = useState(true);
  const [paymentSuccessful, setPaymentSuccessful] = useState(true);
  const [paymentFailed,     setPaymentFailed]     = useState(true);
  const [cashbackReceived,  setCashbackReceived]  = useState(true);

  // Alert Preferences
  const [sound,     setSound]     = useState(true);
  const [vibration, setVibration] = useState(true);
  const [ledLight,  setLedLight]  = useState(false);

  // Communication
  const [emailNotifications,    setEmailNotifications]    = useState(false);
  const [smsNotifications,      setSmsNotifications]      = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Info banner */}
          <View style={styles.infoCard}>
            <MaterialIcons name="notifications-active" size={ms(24)} color="#3B82F6" />
            <Text style={styles.infoText}>
              Customize your notification preferences to stay updated on what matters most to you.
            </Text>
          </View>

          {/* ── Order Notifications ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Notifications</Text>
            <View style={styles.settingsCard}>
              <SwitchRow icon="shopping-bag"    iconColor="#3B82F6" title="All Order Updates" desc="Status changes and updates"         value={orderUpdates}   onValueChange={setOrderUpdates} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="local-shipping"  iconColor="#10B981" title="Order Picked Up"   desc="When delivery agent picks up"      value={orderPickedUp}  onValueChange={setOrderPickedUp}  disabled={!orderUpdates} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="check-circle"    iconColor="#10B981" title="Order Delivered"   desc="When order is delivered"           value={orderDelivered} onValueChange={setOrderDelivered} disabled={!orderUpdates} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="cancel"          iconColor="#EF4444" title="Order Cancelled"   desc="Cancellation confirmations"        value={orderCancelled} onValueChange={setOrderCancelled} disabled={!orderUpdates} />
            </View>
          </View>

          {/* ── Promotions & Offers ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Promotions & Offers</Text>
            <View style={styles.settingsCard}>
              <SwitchRow icon="local-offer"    iconColor="#F59E0B" title="Promotions"    desc="Deals and discounts"     value={promotions}    onValueChange={setPromotions} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="card-giftcard"  iconColor="#EC4899" title="Special Offers" desc="Limited time offers"   value={specialOffers} onValueChange={setSpecialOffers} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="new-releases"   iconColor="#8B5CF6" title="New Features"  desc="App updates and features" value={newFeatures}  onValueChange={setNewFeatures} />
            </View>
          </View>

          {/* ── Wallet & Payments ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet & Payments</Text>
            <View style={styles.settingsCard}>
              <SwitchRow icon="account-balance-wallet" iconColor="#3B82F6" title="Wallet Updates"     desc="Money added or deducted"       value={walletUpdates}     onValueChange={setWalletUpdates} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="check-circle"           iconColor="#10B981" title="Payment Successful" desc="Payment confirmations"          value={paymentSuccessful} onValueChange={setPaymentSuccessful} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="error"                  iconColor="#EF4444" title="Payment Failed"     desc="Failed payment alerts"          value={paymentFailed}     onValueChange={setPaymentFailed} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="stars"                  iconColor="#F59E0B" title="Cashback Received"  desc="Cashback credit notifications"  value={cashbackReceived}  onValueChange={setCashbackReceived} />
            </View>
          </View>

          {/* ── Alert Preferences ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alert Preferences</Text>
            <View style={styles.settingsCard}>
              <SwitchRow icon="volume-up"        iconColor="#3B82F6" title="Sound"     desc="Play notification sound"     value={sound}     onValueChange={setSound} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="vibration"        iconColor="#10B981" title="Vibration" desc="Vibrate on notifications"    value={vibration} onValueChange={setVibration} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="lightbulb-outline" iconColor="#F59E0B" title="LED Light" desc="Blink LED for notifications" value={ledLight}  onValueChange={setLedLight} />
            </View>
          </View>

          {/* ── Communication Channels ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communication Channels</Text>
            <View style={styles.settingsCard}>
              <SwitchRow icon="email"    iconColor="#3B82F6" title="Email"    desc="Receive updates via email" value={emailNotifications}    onValueChange={setEmailNotifications} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="sms"      iconColor="#10B981" title="SMS"      desc="Receive SMS alerts"        value={smsNotifications}      onValueChange={setSmsNotifications} />
              <View style={styles.settingDivider} />
              <SwitchRow icon="whatsapp" iconColor="#16A34A" title="WhatsApp" desc="Updates on WhatsApp"       value={whatsappNotifications} onValueChange={setWhatsappNotifications} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

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

  scrollView:    { flex: 1 },
  scrollContent: { padding: scaleW(16) },

  // ── Info banner ──
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: ms(14),
    borderRadius: ms(12),
    gap: scaleW(12),
    marginBottom: scaleH(24),
  },
  infoText: {
    flex: 1,
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#1E40AF',
    lineHeight: fs(13) * 1.55,
  },

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
    marginLeft: descIndent,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: scaleW(16),
  },
});

export default NotificationSettings;