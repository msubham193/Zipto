import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

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
            <Text style={styles.legalTitle}>Bookfleet Customer Privacy Policy</Text>
            <Text style={styles.legalUpdate}>Last Updated: June 2026</Text>

            {/* 1. Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Introduction</Text>
              <Text style={styles.sectionText}>
                Welcome to bookfleet.{'\n\n'}
                Bookfleet is a technology platform owned and operated by Zipto Hyperlogistics Private Limited ("Bookfleet", "Company", "we", "our", or "us"). We are committed to protecting your privacy and ensuring that your personal information is handled responsibly, securely, and transparently.{'\n\n'}
                This Privacy Policy explains how we collect, use, store, process, share, and protect your personal information when you access or use the Bookfleet Customer App, Bookfleet Website, and any related products or services offered by bookfleet.{'\n\n'}
                By accessing or using the Bookfleet Platform, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
              </Text>
            </View>

            {/* 2. Company Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Company Details</Text>
              <Text style={styles.subSectionTitle}>Legal Entity</Text>
              <Text style={styles.sectionText}>Zipto Hyperlogistics Private Limited</Text>
              <Text style={styles.subSectionTitle}>Brand Name</Text>
              <Text style={styles.sectionText}>Bookfleet</Text>
              <Text style={styles.subSectionTitle}>Registered Office</Text>
              <Text style={styles.sectionText}>781, Shaheed Nagar,{'\n'}780 Maharishi College Road,{'\n'}Bhubaneswar, Khordha,{'\n'}Odisha – 751007, India</Text>
              <Text style={styles.subSectionTitle}>Website</Text>
              <Text style={styles.contactText}>🌐 www.bookfleet.in</Text>
              <Text style={styles.subSectionTitle}>Support Email</Text>
              <Text style={styles.contactText}>📧 support@bookfleet.in</Text>
            </View>

            {/* 3. Scope */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Scope of this Privacy Policy</Text>
              <Text style={styles.sectionText}>This Privacy Policy applies to:</Text>
              <Text style={styles.bulletText}>• Bookfleet Customer App</Text>
              <Text style={styles.bulletText}>• Bookfleet Website</Text>
              <Text style={styles.bulletText}>• Customer Support Services</Text>
              <Text style={styles.bulletText}>• Online Booking Platform</Text>
              <Text style={styles.bulletText}>• Payment Services</Text>
              <Text style={styles.bulletText}>• Promotional Communications</Text>
              <Text style={styles.bulletText}>• Any other services provided by Bookfleet</Text>
            </View>

            {/* 4. Information We Collect */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Information We Collect</Text>
              <Text style={styles.sectionText}>To provide reliable logistics services, we may collect the following information:</Text>

              <Text style={styles.subSectionTitle}>Personal Information</Text>
              <Text style={styles.bulletText}>• Full Name</Text>
              <Text style={styles.bulletText}>• Mobile Number</Text>
              <Text style={styles.bulletText}>• Email Address (if provided)</Text>
              <Text style={styles.bulletText}>• Profile Photo (optional)</Text>

              <Text style={styles.subSectionTitle}>Location Information</Text>
              <Text style={styles.bulletText}>• Pickup Address</Text>
              <Text style={styles.bulletText}>• Delivery Address</Text>
              <Text style={styles.bulletText}>• Live GPS Location (during active bookings)</Text>
              <Text style={styles.bulletText}>• Saved Addresses</Text>

              <Text style={styles.subSectionTitle}>Booking Information</Text>
              <Text style={styles.bulletText}>• Booking ID</Text>
              <Text style={styles.bulletText}>• Vehicle Category</Text>
              <Text style={styles.bulletText}>• Delivery Details</Text>
              <Text style={styles.bulletText}>• Order History</Text>
              <Text style={styles.bulletText}>• Delivery Status</Text>

              <Text style={styles.subSectionTitle}>Payment Information</Text>
              <Text style={styles.bulletText}>• Payment Method</Text>
              <Text style={styles.bulletText}>• Transaction Details</Text>
              <Text style={styles.bulletText}>• Invoice Details</Text>
              <Text style={styles.bulletText}>• Refund Information</Text>
              <Text style={styles.importantNote}>⚠️ Bookfleet does not store complete debit or credit card information.</Text>

              <Text style={styles.subSectionTitle}>Device Information</Text>
              <Text style={styles.bulletText}>• Device Model</Text>
              <Text style={styles.bulletText}>• Device Identifier</Text>
              <Text style={styles.bulletText}>• Operating System</Text>
              <Text style={styles.bulletText}>• App Version</Text>
              <Text style={styles.bulletText}>• IP Address</Text>
              <Text style={styles.bulletText}>• Diagnostic Information</Text>
              <Text style={styles.bulletText}>• Crash Reports</Text>

              <Text style={styles.subSectionTitle}>Communication Information</Text>
              <Text style={styles.bulletText}>• Customer Support Requests</Text>
              <Text style={styles.bulletText}>• Ratings & Reviews</Text>
              <Text style={styles.bulletText}>• Feedback</Text>
              <Text style={styles.bulletText}>• Complaint Details</Text>
            </View>

            {/* 5. How We Use Your Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. How We Use Your Information</Text>
              <Text style={styles.sectionText}>We use your information to:</Text>
              <Text style={styles.bulletText}>• Process bookings</Text>
              <Text style={styles.bulletText}>• Assign delivery partners</Text>
              <Text style={styles.bulletText}>• Provide real-time tracking</Text>
              <Text style={styles.bulletText}>• Calculate delivery charges</Text>
              <Text style={styles.bulletText}>• Process payments</Text>
              <Text style={styles.bulletText}>• Generate invoices</Text>
              <Text style={styles.bulletText}>• Improve customer support</Text>
              <Text style={styles.bulletText}>• Prevent fraud and misuse</Text>
              <Text style={styles.bulletText}>• Enhance platform security</Text>
              <Text style={styles.bulletText}>• Improve our products and services</Text>
              <Text style={styles.bulletText}>• Send important service notifications</Text>
              <Text style={styles.bulletText}>• Comply with applicable laws and regulations</Text>
            </View>

            {/* 6. Permissions We Request */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Permissions We Request</Text>
              <Text style={styles.sectionText}>Bookfleet may request access to:</Text>
              <Text style={styles.bulletText}>• Device Location</Text>
              <Text style={styles.bulletText}>• Camera</Text>
              <Text style={styles.bulletText}>• Photos & Media</Text>
              <Text style={styles.bulletText}>• Notifications</Text>
              <Text style={styles.bulletText}>• Phone (where required)</Text>
              <Text style={styles.sectionText}>These permissions are requested only to enable platform features and improve your experience.</Text>
            </View>

            {/* 7. Sharing of Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Sharing of Information</Text>
              <Text style={styles.sectionText}>Bookfleet may share limited information with:</Text>
              <Text style={styles.bulletText}>• Delivery Partners</Text>
              <Text style={styles.bulletText}>• Payment Service Providers</Text>
              <Text style={styles.bulletText}>• Technology Service Providers</Text>
              <Text style={styles.bulletText}>• Government Authorities (where required by law)</Text>
              <Text style={styles.importantNote}>⚠️ Bookfleet does not sell your personal information to third parties.</Text>
            </View>

            {/* 8. Data Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Data Security</Text>
              <Text style={styles.sectionText}>
                We use appropriate technical, administrative, and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, loss, or misuse.
              </Text>
            </View>

            {/* 9. Data Retention */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Data Retention</Text>
              <Text style={styles.sectionText}>
                We retain your information only for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our policies.
              </Text>
            </View>

            {/* 10. Your Rights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Your Rights</Text>
              <Text style={styles.sectionText}>Depending on applicable laws, you may have the right to:</Text>
              <Text style={styles.bulletText}>• Access your information</Text>
              <Text style={styles.bulletText}>• Update your information</Text>
              <Text style={styles.bulletText}>• Request correction of inaccurate information</Text>
              <Text style={styles.bulletText}>• Request deletion of your account</Text>
              <Text style={styles.bulletText}>• Withdraw consent where applicable</Text>
            </View>

            {/* 11. Account Deletion */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. Account Deletion</Text>
              <Text style={styles.sectionText}>
                You may request deletion of your Bookfleet account by contacting our support team.{'\n\n'}
                Certain information may be retained where required by law or for legitimate business purposes.
              </Text>
            </View>

            {/* 12. Children's Privacy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. Children's Privacy</Text>
              <Text style={styles.sectionText}>
                Bookfleet services are intended only for individuals who are legally eligible to use our platform.{'\n\n'}
                We do not knowingly collect personal information from children.
              </Text>
            </View>

            {/* 13. Changes to this Privacy Policy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>13. Changes to this Privacy Policy</Text>
              <Text style={styles.sectionText}>
                We may update this Privacy Policy from time to time.{'\n\n'}
                Any changes will be published on our website and/or application and will become effective immediately upon publication unless otherwise stated.
              </Text>
            </View>

            {/* 14. Contact Us */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>14. Contact Us</Text>
              <Text style={styles.sectionText}>If you have any questions regarding this Privacy Policy or your personal information, please contact us:</Text>
              <Text style={styles.sectionText}>Bookfleet Support</Text>
              <Text style={styles.contactText}>📧 support@bookfleet.in</Text>
              <Text style={styles.contactText}>🌐 www.bookfleet.in</Text>
              <Text style={styles.sectionText}>Registered Office:</Text>
              <Text style={styles.contactText}>📍 Zipto Hyperlogistics Private Limited{'\n'}    781, Shaheed Nagar,{'\n'}    780 Maharishi College Road,{'\n'}    Bhubaneswar, Khordha, Odisha – 751007, India</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="security" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                Your privacy is important to us. By using Bookfleet, you acknowledge that you have read and understood this Privacy Policy and consent to our data practices as described herein. © 2026 Zipto Hyperlogistics Private Limited.
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
    paddingHorizontal: hs(16),
    paddingVertical: vs(16),
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
  scrollContent: { paddingBottom: vs(24) },
  legalContent:  { padding: hs(20) },

  // ── Title block ──
  legalTitle: {
    fontSize: fs(26),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: vs(8),
  },
  legalUpdate: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginBottom: vs(20),
  },

  // ── Sections ──
  section: { marginBottom: vs(24) },
  sectionTitle: {
    fontSize: fs(17),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: vs(12),
  },
  subSectionTitle: {
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#1E40AF',
    marginBottom: vs(8),
    marginTop: vs(8),
  },
  sectionText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: fs(14) * 1.7,
    marginBottom: vs(12),
  },
  bulletText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: fs(14) * 1.7,
    marginBottom: vs(8),
    paddingLeft: hs(8),
  },
  importantNote: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#16A34A',
    lineHeight: fs(14) * 1.6,
    marginTop: vs(12),
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
    marginBottom: vs(6),
  },

  // ── Acknowledgement card ──
  acknowledgementCard: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    padding: ms(16),
    borderRadius: ms(12),
    gap: hs(12),
    marginTop: vs(8),
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