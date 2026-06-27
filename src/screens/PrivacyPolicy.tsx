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
            <Text style={styles.legalTitle}>Privacy Policy</Text>
            <Text style={styles.legalUpdate}>Last Updated: May 2026</Text>

            {/* Intro */}
            <View style={styles.section}>
              <Text style={styles.sectionText}>
                This Privacy Policy describes how ZIPTO HYPERLOGISTICS PRIVATE LIMITED ("bookfleet", "Company", "we", "our", or "us") collects, processes, stores, uses, and protects user information through the bookfleet mobile application, website, and related services ("Platform").{'\n\n'}
                By accessing or using the Platform, users agree to the practices described in this Privacy Policy.
              </Text>
            </View>

            {/* 1. Information We Collect */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. INFORMATION WE COLLECT</Text>
              <Text style={styles.sectionText}>We may collect the following categories of information:</Text>

              <Text style={styles.subSectionTitle}>a) Personal Information</Text>
              <Text style={styles.bulletText}>• Full Name</Text>
              <Text style={styles.bulletText}>• Mobile Number</Text>
              <Text style={styles.bulletText}>• Email Address (if required)</Text>
              <Text style={styles.bulletText}>• Government-issued identification details where required</Text>

              <Text style={styles.subSectionTitle}>b) Location Information</Text>
              <Text style={styles.bulletText}>• Precise GPS location</Text>
              <Text style={styles.bulletText}>• Pickup and drop locations</Text>
              <Text style={styles.bulletText}>• Saved addresses</Text>
              <Text style={styles.bulletText}>• Route and navigation information</Text>

              <Text style={styles.subSectionTitle}>c) Device & Technical Information</Text>
              <Text style={styles.bulletText}>• Device type and model</Text>
              <Text style={styles.bulletText}>• Operating system version</Text>
              <Text style={styles.bulletText}>• IP address</Text>
              <Text style={styles.bulletText}>• Device identifiers</Text>
              <Text style={styles.bulletText}>• App version</Text>
              <Text style={styles.bulletText}>• Mobile network information</Text>

              <Text style={styles.subSectionTitle}>d) Payment Information</Text>
              <Text style={styles.bulletText}>• UPI details</Text>
              <Text style={styles.bulletText}>• Transaction history</Text>
              <Text style={styles.bulletText}>• Payment status</Text>
              <Text style={styles.importantNote}>⚠️ bookfleet does not store debit or credit card details on its own servers.</Text>

              <Text style={styles.subSectionTitle}>e) Usage Information</Text>
              <Text style={styles.bulletText}>• Ride and booking history</Text>
              <Text style={styles.bulletText}>• Delivery activity</Text>
              <Text style={styles.bulletText}>• Search preferences</Text>
              <Text style={styles.bulletText}>• Customer support interactions</Text>
              <Text style={styles.bulletText}>• App usage analytics</Text>
            </View>

            {/* 2. Purpose of Data Collection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. PURPOSE OF DATA COLLECTION</Text>
              <Text style={styles.sectionText}>User information may be collected and processed for the following purposes:</Text>
              <Text style={styles.bulletText}>• Providing transportation and delivery services</Text>
              <Text style={styles.bulletText}>• Connecting users with nearby rider or delivery partners</Text>
              <Text style={styles.bulletText}>• Processing bookings and payments</Text>
              <Text style={styles.bulletText}>• Improving platform functionality and customer experience</Text>
              <Text style={styles.bulletText}>• Fraud detection and prevention</Text>
              <Text style={styles.bulletText}>• Customer support and dispute resolution</Text>
              <Text style={styles.bulletText}>• Sending OTPs, alerts, notifications, and service updates</Text>
              <Text style={styles.bulletText}>• Compliance with applicable legal obligations</Text>
            </View>

            {/* 3. Location Data Usage */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. LOCATION DATA USAGE</Text>
              <Text style={styles.sectionText}>bookfleet collects and processes precise location data to:</Text>
              <Text style={styles.bulletText}>• Enable ride and delivery booking functionality</Text>
              <Text style={styles.bulletText}>• Match nearby rider and delivery partners</Text>
              <Text style={styles.bulletText}>• Provide real-time tracking</Text>
              <Text style={styles.bulletText}>• Calculate fares and estimated arrival times</Text>
              <Text style={styles.bulletText}>• Improve service availability and operational efficiency</Text>
              <Text style={styles.importantNote}>📍 Location access may continue while the application is running in foreground for active service tracking purposes.</Text>
            </View>

            {/* 4. Camera, Storage & Media Access */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. CAMERA, STORAGE & MEDIA ACCESS</Text>
              <Text style={styles.sectionText}>The Platform may request access to:</Text>
              <Text style={styles.bulletText}>• Gallery or storage for image uploads</Text>
              <Text style={styles.bulletText}>• Documents for customer support or verification purposes</Text>
              <Text style={styles.bulletText}>• Delivery proof uploads</Text>
            </View>

            {/* 5. Information Sharing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. INFORMATION SHARING</Text>
              <Text style={styles.sectionText}>bookfleet may share limited information with:</Text>
              <Text style={styles.bulletText}>• Independent rider and delivery partners</Text>
              <Text style={styles.bulletText}>• Payment gateway providers</Text>
              <Text style={styles.bulletText}>• Cloud communication and storage providers</Text>
              <Text style={styles.bulletText}>• Government authorities or regulatory bodies where legally required</Text>
              <Text style={styles.bulletText}>• Customer support and operational teams</Text>
              <Text style={styles.importantNote}>⚠️ bookfleet does not sell user personal information to third parties.</Text>
            </View>

            {/* 6. Data Retention */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. DATA RETENTION</Text>
              <Text style={styles.sectionText}>User information may be retained for as long as necessary to:</Text>
              <Text style={styles.bulletText}>• Provide services</Text>
              <Text style={styles.bulletText}>• Maintain legal compliance</Text>
              <Text style={styles.bulletText}>• Resolve disputes</Text>
              <Text style={styles.bulletText}>• Prevent fraudulent activities</Text>
              <Text style={styles.bulletText}>• Enforce company policies</Text>
            </View>

            {/* 7. Data Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. DATA SECURITY</Text>
              <Text style={styles.sectionText}>
                bookfleet implements commercially reasonable technical, administrative, and organizational security measures to protect user information from unauthorized access, misuse, alteration, disclosure, or destruction.{'\n\n'}
                However, no digital platform can guarantee complete security.
              </Text>
            </View>

            {/* 8. User Rights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. USER RIGHTS</Text>
              <Text style={styles.sectionText}>Users may:</Text>
              <Text style={styles.bulletText}>• Access and update profile information</Text>
              <Text style={styles.bulletText}>• Request account deletion</Text>
              <Text style={styles.bulletText}>• Contact customer support regarding privacy concerns</Text>
              <Text style={styles.importantNote}>👉 bookfleet reserves the right to retain certain information where legally required.</Text>
            </View>

            {/* 9. Third-Party Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. THIRD-PARTY SERVICES</Text>
              <Text style={styles.sectionText}>The Platform may integrate with third-party services including:</Text>
              <Text style={styles.bulletText}>• Payment gateways</Text>
              <Text style={styles.bulletText}>• Maps and navigation providers</Text>
              <Text style={styles.bulletText}>• Analytics providers</Text>
              <Text style={styles.bulletText}>• Communication service providers</Text>
              <Text style={styles.sectionText}>Such third-party services may operate under their own privacy policies.</Text>
            </View>

            {/* 10. Children's Privacy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. CHILDREN'S PRIVACY</Text>
              <Text style={styles.sectionText}>
                The Platform is intended only for individuals above 18 years of age.{'\n\n'}
                bookfleet does not knowingly collect personal information from minors.
              </Text>
            </View>

            {/* 11. Policy Modifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. POLICY MODIFICATIONS</Text>
              <Text style={styles.sectionText}>
                bookfleet reserves the right to modify or update this Privacy Policy at any time without prior notice.{'\n\n'}
                Continued use of the Platform after such updates constitutes acceptance of the revised Privacy Policy.
              </Text>
            </View>

            {/* 12. Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. CONTACT INFORMATION</Text>
              <Text style={styles.sectionText}>ZIPTO HYPERLOGISTICS PRIVATE LIMITED</Text>
              <Text style={styles.sectionText}>Registered Office:</Text>
              <Text style={styles.contactText}>📍 781, Saheed Nagar, Maharishi College Road,{'\n'}    Bhubaneswar, Khordha – 751007, Odisha, India</Text>
              <Text style={styles.contactText}>📧 support@bookfleet.com</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="security" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                Your privacy is important to us. By using bookfleet, you acknowledge that you have read and understood this Privacy Policy and consent to our data practices as described herein. © 2026 Zipto Hyperlogistics Pvt. Ltd.
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