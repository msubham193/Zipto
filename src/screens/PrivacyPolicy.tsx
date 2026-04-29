import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
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

const PrivacyPolicy = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.legalContent}>
            <Text style={styles.legalTitle}>Privacy Policy</Text>
            <Text style={styles.legalUpdate}>Effective: 11 April 2026 · Last updated: 11 April 2026</Text>

            {/* 1. Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. INTRODUCTION</Text>
              <Text style={styles.sectionText}>
                This Privacy Policy describes how Zipto Hyperlogistics Private Limited (“Zipto”, “Company”, “We”, “Us”) collects, uses, and protects your information when you use the Zipto customer application, website, and related services.{'\n\n'}
                Zipto acts solely as a logistics facilitator and does not sell or own any products.{'\n\n'}
                By using Zipto, you consent to the practices described in this policy.
              </Text>
            </View>

            {/* 2. Company Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. COMPANY DETAILS</Text>
              <Text style={styles.sectionText}>
                Company Name: Zipto Hyperlogistics Private Limited{'\n'}
                Registered Office: 781, Saheed Nagar, Maharishi College Road, Bhubaneswar, Khordha, Odisha – 751007, India{'\n'}
                Operating Location: Bhubaneswar, Odisha, India
              </Text>
            </View>

            {/* 3. Information We Collect */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. INFORMATION WE COLLECT</Text>

              <Text style={styles.subSectionTitle}>A. Personal Information</Text>
              <Text style={styles.bulletText}>• Full Name</Text>
              <Text style={styles.bulletText}>• Mobile Number</Text>
              <Text style={styles.bulletText}>• Email Address</Text>

              <Text style={styles.subSectionTitle}>B. Location Data</Text>
              <Text style={styles.sectionText}>We collect location data to:</Text>
              <Text style={styles.bulletText}>• Enable pickup and delivery</Text>
              <Text style={styles.bulletText}>• Provide live tracking</Text>
              <Text style={styles.bulletText}>• Improve service efficiency</Text>
              <Text style={styles.importantNote}>📍 Location is collected only when required for active services.</Text>

              <Text style={styles.subSectionTitle}>C. Order & Transaction Data</Text>
              <Text style={styles.bulletText}>• Pickup & drop addresses</Text>
              <Text style={styles.bulletText}>• Delivery instructions</Text>
              <Text style={styles.bulletText}>• Order details</Text>
              <Text style={styles.bulletText}>• Payment method (UPI / COD / etc.)</Text>

              <Text style={styles.subSectionTitle}>D. Device Information</Text>
              <Text style={styles.bulletText}>• Device type</Text>
              <Text style={styles.bulletText}>• IP address</Text>
              <Text style={styles.bulletText}>• App usage data</Text>
            </View>

            {/* 4. How We Use Your Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. HOW WE USE YOUR INFORMATION</Text>
              <Text style={styles.sectionText}>We use your data to:</Text>
              <Text style={styles.bulletText}>• Provide delivery services</Text>
              <Text style={styles.bulletText}>• Assign delivery partners</Text>
              <Text style={styles.bulletText}>• Process orders and payments</Text>
              <Text style={styles.bulletText}>• Send notifications and updates</Text>
              <Text style={styles.bulletText}>• Improve platform performance</Text>
            </View>

            {/* 5. Nature of Service */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. NATURE OF SERVICE (IMPORTANT)</Text>
              <Text style={styles.sectionText}>
                Zipto is a logistics platform that facilitates pickup and delivery services.
              </Text>
              <Text style={styles.bulletText}>• Zipto does not sell, manufacture, or own any products</Text>
              <Text style={styles.bulletText}>• Zipto only enables movement of items</Text>
              <Text style={styles.importantNote}>👉 Product quality, accuracy, and legality are the responsibility of:{'\n'}• Sender{'\n'}• Seller{'\n'}• Third-party provider</Text>
            </View>

            {/* 6. Data Sharing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. DATA SHARING</Text>
              <Text style={styles.sectionText}>We may share limited data with:</Text>
              <Text style={styles.bulletText}>• Delivery partners (for order execution)</Text>
              <Text style={styles.bulletText}>• Payment gateways</Text>
              <Text style={styles.bulletText}>• Service providers (analytics/support)</Text>
              <Text style={styles.bulletText}>• Authorities (if legally required)</Text>
              <Text style={styles.importantNote}>⚠️ We do not sell your personal data</Text>
            </View>

            {/* 7. Payment Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. PAYMENT SECURITY</Text>
              <Text style={styles.sectionText}>
                All payments are handled by secure third-party providers. Zipto does not store:
              </Text>
              <Text style={styles.bulletText}>• Card details</Text>
              <Text style={styles.bulletText}>• UPI PIN</Text>
              <Text style={styles.bulletText}>• OTP</Text>
            </View>

            {/* 8. Data Retention */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. DATA RETENTION</Text>
              <Text style={styles.sectionText}>We retain data:</Text>
              <Text style={styles.bulletText}>• While your account is active</Text>
              <Text style={styles.bulletText}>• As required by applicable laws</Text>
            </View>

            {/* 9. User Responsibility */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. USER RESPONSIBILITY</Text>
              <Text style={styles.sectionText}>Users must ensure:</Text>
              <Text style={styles.bulletText}>• Accurate pickup & delivery details</Text>
              <Text style={styles.bulletText}>• Correct item description</Text>
              <Text style={styles.bulletText}>• Items are legal and safe for transport</Text>
              <Text style={styles.importantNote}>Zipto reserves the right to refuse unsafe or restricted items.</Text>
            </View>

            {/* 10. Limitation of Liability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. LIMITATION OF LIABILITY</Text>
              <Text style={styles.sectionText}>Zipto shall not be responsible for:</Text>
              <Text style={styles.bulletText}>• Product quality or condition</Text>
              <Text style={styles.bulletText}>• Wrong or incomplete items from sellers</Text>
              <Text style={styles.bulletText}>• Expired or damaged goods (including food or medicine)</Text>
              <Text style={styles.bulletText}>• Indirect or consequential losses</Text>
              <Text style={styles.importantNote}>👉 Zipto’s responsibility is limited strictly to pickup and delivery</Text>
            </View>

            {/* 11. Disputes & Claims */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. DISPUTES & CLAIMS</Text>
              <Text style={styles.sectionText}>
                Any disputes related to product quality must be resolved between:{'\n'}👉 User and seller/provider{'\n\n'}
                Zipto will assist only in delivery-related issues.
              </Text>
            </View>

            {/* 12. User Rights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. USER RIGHTS</Text>
              <Text style={styles.sectionText}>You may:</Text>
              <Text style={styles.bulletText}>• Access your data</Text>
              <Text style={styles.bulletText}>• Update your information</Text>
              <Text style={styles.bulletText}>• Request account deletion</Text>
              <Text style={styles.contactText}>📩 Email: support@ridezipto.com</Text>
            </View>

            {/* 13. Account Deletion */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>13. ACCOUNT DELETION</Text>
              <Text style={styles.sectionText}>
                Users may request deletion via email.{'\n'}
                Data will be removed within a reasonable timeframe, subject to legal obligations.
              </Text>
            </View>

            {/* 14. Cookies */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>14. COOKIES</Text>
              <Text style={styles.sectionText}>
                We may use cookies to improve user experience and performance.
              </Text>
            </View>

            {/* 15. Children's Privacy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>15. CHILDREN’S PRIVACY</Text>
              <Text style={styles.sectionText}>
                Zipto is not intended for users under 18 years.
              </Text>
            </View>

            {/* 16. Changes to Policy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>16. CHANGES TO POLICY</Text>
              <Text style={styles.sectionText}>
                We may update this policy from time to time.
              </Text>
            </View>

            {/* 17. Contact */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>17. CONTACT</Text>
              <Text style={styles.contactText}>📧 support@ridezipto.com</Text>
              <Text style={styles.contactText}>📍 Bhubaneswar, Odisha, India</Text>
            </View>

            {/* 18. Grievance Officer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>18. GRIEVANCE OFFICER</Text>
              <Text style={styles.contactText}>Zipto Support Team</Text>
              <Text style={styles.contactText}>Response Time: Within 48 hours.</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="security" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                Your privacy is important to us. By using Zipto, you acknowledge that you have read and understood this Privacy Policy and consent to our data practices as described herein. © 2026 Zipto Hyperlogistics Pvt. Ltd.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize = ms(40);

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

  // ── Scroll ──
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: scaleH(24) },
  legalContent:  { padding: scaleW(20) },

  // ── Title block ──
  legalTitle: {
    fontSize: fs(26),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(8),
  },
  legalUpdate: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginBottom: scaleH(20),
  },
  welcomeText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: fs(14) * 1.6,
    marginBottom: scaleH(24),
    padding: ms(16),
    backgroundColor: '#EFF6FF',
    borderRadius: ms(10),
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },

  // ── Sections ──
  section: { marginBottom: scaleH(24) },
  sectionTitle: {
    fontSize: fs(17),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(12),
  },
  subSectionTitle: {
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#1E40AF',
    marginBottom: scaleH(8),
    marginTop: scaleH(8),
  },
  sectionText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: fs(14) * 1.7,
    marginBottom: scaleH(12),
  },
  bulletText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: fs(14) * 1.7,
    marginBottom: scaleH(8),
    paddingLeft: scaleW(8),
  },
  importantNote: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#16A34A',
    lineHeight: fs(14) * 1.6,
    marginTop: scaleH(12),
    padding: ms(12),
    backgroundColor: '#F0FDF4',
    borderRadius: ms(8),
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  contactText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
    lineHeight: fs(14) * 1.7,
    marginBottom: scaleH(6),
  },

  // ── Acknowledgement card ──
  acknowledgementCard: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    padding: ms(16),
    borderRadius: ms(12),
    gap: scaleW(12),
    marginTop: scaleH(8),
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    alignItems: 'flex-start',
  },
  acknowledgementText: {
    flex: 1,
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#1E40AF',
    lineHeight: fs(13) * 1.55,
  },
});

export default PrivacyPolicy;