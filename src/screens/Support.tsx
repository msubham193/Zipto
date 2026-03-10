import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
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

const Support = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const supportOptions = [
    { id: 1, title: 'Live Chat',  icon: 'chat-bubble-outline', desc: 'Chat with our support team',   color: '#3B82F6', onPress: () => console.log('Open chat') },
    { id: 2, title: 'Call Us',    icon: 'phone',               desc: '1800-123-4567 (Toll Free)',    color: '#10B981', onPress: () => Linking.openURL('tel:18001234567') },
    { id: 3, title: 'Email Us',   icon: 'email',               desc: 'support@zipto.com',            color: '#F59E0B', onPress: () => Linking.openURL('mailto:support@zipto.com') },
    { id: 4, title: 'WhatsApp',   icon: 'whatsapp',            desc: 'Message us on WhatsApp',       color: '#16A34A', onPress: () => Linking.openURL('https://wa.me/918001234567') },
  ];

  const quickHelp = [
    { id: 1, icon: 'help-outline', title: 'Help Center',    desc: 'Browse FAQs and guides',    color: '#8B5CF6' },
    { id: 2, icon: 'rate-review',  title: 'Report an Issue',desc: 'Let us know your problem',  color: '#EF4444' },
    { id: 3, icon: 'feedback',     title: 'Share Feedback', desc: 'Help us improve',           color: '#EC4899' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Support Hero */}
          <View style={styles.supportHeader}>
            <View style={styles.supportIconContainer}>
              <MaterialIcons name="support-agent" size={ms(64)} color="#3B82F6" />
            </View>
            <Text style={styles.supportTitle}>How can we help you?</Text>
            <Text style={styles.supportSubtitle}>We're here 24/7 to assist you</Text>
          </View>

          {/* Contact Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            {supportOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.supportCard}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: `${option.color}15` }]}>
                  <MaterialIcons name={option.icon} size={ms(28)} color={option.color} />
                </View>
                <View style={styles.supportContent}>
                  <Text style={styles.supportCardTitle}>{option.title}</Text>
                  <Text style={styles.supportCardDesc}>{option.desc}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={ms(24)} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Help */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Help</Text>
            <View style={styles.quickHelpGrid}>
              {quickHelp.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickHelpCard}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickHelpIcon, { backgroundColor: `${item.color}15` }]}>
                    <MaterialIcons name={item.icon} size={ms(28)} color={item.color} />
                  </View>
                  <Text style={styles.quickHelpTitle}>{item.title}</Text>
                  <Text style={styles.quickHelpDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Working Hours */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="schedule" size={ms(24)} color="#3B82F6" />
              <Text style={styles.infoTitle}>Support Hours</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Monday - Friday:</Text>
              <Text style={styles.infoValue}>9:00 AM - 8:00 PM</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Saturday - Sunday:</Text>
              <Text style={styles.infoValue}>10:00 AM - 6:00 PM</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.infoLabel}>Emergency Support:</Text>
              <Text style={styles.infoValue}>24/7 Available</Text>
            </View>
          </View>

          {/* Office Address */}
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <MaterialIcons name="location-on" size={ms(24)} color="#EF4444" />
              <Text style={styles.addressTitle}>Office Address</Text>
            </View>
            <Text style={styles.addressText}>
              Zipto Headquarters{'\n'}
              123 Business Park, 2nd Floor{'\n'}
              Chandrasekharpur, Bhubaneswar{'\n'}
              Odisha - 751001, India
            </Text>
            <TouchableOpacity style={styles.directionsButton}>
              <MaterialIcons name="directions" size={ms(18)} color="#3B82F6" />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize      = ms(40);
const heroIconSize     = ms(120);
const cardIconSize     = ms(56);
const quickHelpIconSz  = ms(56);

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

  // ── Hero ──
  supportHeader: {
    alignItems: 'center',
    paddingVertical: scaleH(32),
    marginBottom: scaleH(8),
  },
  supportIconContainer: {
    width: heroIconSize,
    height: heroIconSize,
    borderRadius: heroIconSize / 2,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(20),
  },
  supportTitle: {
    fontSize: fs(24),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(8),
  },
  supportSubtitle: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },

  // ── Section ──
  section: { marginBottom: scaleH(24) },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(12),
  },

  // ── Support card (list) ──
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ms(16),
    borderRadius: ms(12),
    marginBottom: scaleH(10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardIconContainer: {
    width: cardIconSize,
    height: cardIconSize,
    borderRadius: cardIconSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(14),
    flexShrink: 0,
  },
  supportContent:   { flex: 1 },
  supportCardTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(4),
  },
  supportCardDesc: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },

  // ── Quick help grid ──
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleW(12),
  },
  quickHelpCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    padding: ms(14),
    borderRadius: ms(12),
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickHelpIcon: {
    width: quickHelpIconSz,
    height: quickHelpIconSz,
    borderRadius: quickHelpIconSz / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(12),
  },
  quickHelpTitle: {
    fontSize: fs(13),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(4),
    textAlign: 'center',
  },
  quickHelpDesc: {
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
  },

  // ── Info card (hours) ──
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: ms(18),
    borderRadius: ms(12),
    marginBottom: scaleH(16),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(10),
    marginBottom: scaleH(16),
  },
  infoTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scaleH(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },
  infoValue: {
    fontSize: fs(14),
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },

  // ── Address card ──
  addressCard: {
    backgroundColor: '#FFFFFF',
    padding: ms(18),
    borderRadius: ms(12),
    marginBottom: scaleH(16),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(10),
    marginBottom: scaleH(12),
  },
  addressTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  addressText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    lineHeight: fs(14) * 1.6,
    marginBottom: scaleH(14),
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleW(6),
    paddingVertical: scaleH(10),
    paddingHorizontal: scaleW(16),
    backgroundColor: '#EFF6FF',
    borderRadius: ms(8),
  },
  directionsText: {
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },
});

export default Support;