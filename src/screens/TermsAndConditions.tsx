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

const TermsAndConditions = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.legalContent}>
            <Text style={styles.legalTitle}>bookfleet Customer Terms & Conditions</Text>
            <Text style={styles.legalUpdate}>Last Updated: June 2026</Text>

            {/* 1. Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Introduction</Text>
              <Text style={styles.sectionText}>
                Welcome to bookfleet.{'\n\n'}
                These Terms & Conditions ("Terms") govern your access to and use of the bookfleet Customer App, website, and all related services operated by Zipto Hyperlogistics Private Limited ("bookfleet", "Company", "we", "our", or "us").{'\n\n'}
                By accessing or using the bookfleet Platform, you agree to be legally bound by these Terms & Conditions. If you do not agree with these Terms, please do not use our Platform.
              </Text>
            </View>

            {/* 2. About bookfleet */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. About bookfleet</Text>
              <Text style={styles.sectionText}>
                bookfleet is a technology-enabled logistics platform that connects customers with independent delivery partners for on-demand transportation and delivery services.{'\n\n'}
                bookfleet provides access to multiple vehicle categories including, but not limited to:
              </Text>
              <Text style={styles.bulletText}>• Bike Delivery</Text>
              <Text style={styles.bulletText}>• Scooter Delivery</Text>
              <Text style={styles.bulletText}>• Auto Delivery</Text>
              <Text style={styles.bulletText}>• Pickup Delivery</Text>
              <Text style={styles.bulletText}>• Mini Truck Delivery</Text>
              <Text style={styles.bulletText}>• Goods Transportation</Text>
              <Text style={styles.bulletText}>• Parcel & Document Delivery</Text>
              <Text style={styles.importantNote}>👉 bookfleet acts only as a technology platform facilitating bookings between customers and independent delivery partners.</Text>
            </View>

            {/* 3. Eligibility */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Eligibility</Text>
              <Text style={styles.sectionText}>To use bookfleet services, you must:</Text>
              <Text style={styles.bulletText}>• Be at least 18 years of age.</Text>
              <Text style={styles.bulletText}>• Provide accurate and complete information.</Text>
              <Text style={styles.bulletText}>• Use a valid mobile number for verification.</Text>
              <Text style={styles.bulletText}>• Comply with all applicable laws and these Terms.</Text>
              <Text style={styles.sectionText}>bookfleet reserves the right to refuse or terminate services if incorrect, misleading, or fraudulent information is provided.</Text>
            </View>

            {/* 4. Customer Account */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Customer Account</Text>
              <Text style={styles.sectionText}>You are responsible for maintaining the confidentiality of your account and OTP verification.{'\n\n'}You agree to:</Text>
              <Text style={styles.bulletText}>• Keep your account information accurate.</Text>
              <Text style={styles.bulletText}>• Protect your login credentials.</Text>
              <Text style={styles.bulletText}>• Immediately report unauthorized access.</Text>
              <Text style={styles.bulletText}>• Be responsible for all activities conducted through your account.</Text>
              <Text style={styles.importantNote}>⚠️ bookfleet shall not be liable for losses arising from unauthorized use of your account.</Text>
            </View>

            {/* 5. Booking Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Booking Services</Text>
              <Text style={styles.sectionText}>Customers may book available logistics services through the bookfleet Platform.{'\n\n'}Bookings are subject to:</Text>
              <Text style={styles.bulletText}>• Vehicle availability</Text>
              <Text style={styles.bulletText}>• Rider availability</Text>
              <Text style={styles.bulletText}>• Serviceable locations</Text>
              <Text style={styles.bulletText}>• Operational hours</Text>
              <Text style={styles.bulletText}>• Safety guidelines</Text>
              <Text style={styles.sectionText}>bookfleet does not guarantee immediate availability of delivery partners.</Text>
            </View>

            {/* 6. Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Pricing</Text>
              <Text style={styles.sectionText}>Delivery charges may vary based on factors including:</Text>
              <Text style={styles.bulletText}>• Distance</Text>
              <Text style={styles.bulletText}>• Vehicle Type</Text>
              <Text style={styles.bulletText}>• Estimated Time</Text>
              <Text style={styles.bulletText}>• Traffic Conditions</Text>
              <Text style={styles.bulletText}>• Demand & Supply</Text>
              <Text style={styles.bulletText}>• Waiting Charges</Text>
              <Text style={styles.bulletText}>• Toll Charges (where applicable)</Text>
              <Text style={styles.bulletText}>• Platform Fee</Text>
              <Text style={styles.bulletText}>• Applicable Taxes</Text>
              <Text style={styles.sectionText}>The total payable amount will be displayed before confirming your booking.</Text>
            </View>

            {/* 7. Payments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Payments</Text>
              <Text style={styles.sectionText}>Customers may pay using available payment methods including:</Text>
              <Text style={styles.bulletText}>• UPI</Text>
              <Text style={styles.bulletText}>• Debit/Credit Cards</Text>
              <Text style={styles.bulletText}>• Net Banking</Text>
              <Text style={styles.bulletText}>• Wallets</Text>
              <Text style={styles.bulletText}>• Cash (where available)</Text>
              <Text style={styles.sectionText}>Payment processing may be handled by authorized third-party payment providers.</Text>
              <Text style={styles.importantNote}>⚠️ bookfleet does not store complete card or banking credentials.</Text>
            </View>

            {/* 8. Customer Responsibilities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Customer Responsibilities</Text>
              <Text style={styles.sectionText}>Customers agree to:</Text>
              <Text style={styles.bulletText}>• Provide accurate pickup and delivery information.</Text>
              <Text style={styles.bulletText}>• Ensure lawful shipment contents.</Text>
              <Text style={styles.bulletText}>• Cooperate with delivery partners.</Text>
              <Text style={styles.bulletText}>• Be available during pickup and delivery.</Text>
              <Text style={styles.bulletText}>• Not misuse the platform.</Text>
              <Text style={styles.bulletText}>• Comply with all applicable laws.</Text>
              <Text style={styles.sectionText}>Customers remain solely responsible for the contents of every shipment.</Text>
            </View>

            {/* 9. Prohibited Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Prohibited Items</Text>
              <Text style={styles.sectionText}>Customers must not book or transport prohibited items including but not limited to:</Text>
              <Text style={styles.bulletText}>• Illegal goods</Text>
              <Text style={styles.bulletText}>• Explosives</Text>
              <Text style={styles.bulletText}>• Firearms</Text>
              <Text style={styles.bulletText}>• Narcotics</Text>
              <Text style={styles.bulletText}>• Hazardous chemicals</Text>
              <Text style={styles.bulletText}>• Live animals (unless specifically permitted)</Text>
              <Text style={styles.bulletText}>• Counterfeit goods</Text>
              <Text style={styles.bulletText}>• Stolen property</Text>
              <Text style={styles.bulletText}>• Items prohibited by Indian law</Text>
              <Text style={styles.importantNote}>🚫 bookfleet reserves the right to refuse any booking involving prohibited goods.</Text>
            </View>

            {/* 10. Cancellation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Cancellation</Text>
              <Text style={styles.sectionText}>
                Customers may cancel bookings in accordance with the bookfleet Cancellation Policy.{'\n\n'}
                Cancellation charges may apply depending on the booking stage.{'\n\n'}
                bookfleet reserves the right to cancel bookings due to operational, safety, legal, or technical reasons.
              </Text>
            </View>

            {/* 11. Limitation of Liability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
              <Text style={styles.sectionText}>bookfleet acts solely as a technology platform connecting customers with independent delivery partners.{'\n\n'}To the maximum extent permitted by law, bookfleet shall not be liable for:</Text>
              <Text style={styles.bulletText}>• Delay caused by traffic or weather</Text>
              <Text style={styles.bulletText}>• Incorrect addresses</Text>
              <Text style={styles.bulletText}>• Customer errors</Text>
              <Text style={styles.bulletText}>• Force majeure events</Text>
              <Text style={styles.bulletText}>• Indirect or consequential damages</Text>
            </View>

            {/* 12. Suspension & Termination */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. Suspension & Termination</Text>
              <Text style={styles.sectionText}>bookfleet may suspend or permanently terminate customer accounts for:</Text>
              <Text style={styles.bulletText}>• Fraudulent activity</Text>
              <Text style={styles.bulletText}>• Misuse of the platform</Text>
              <Text style={styles.bulletText}>• Abuse towards delivery partners</Text>
              <Text style={styles.bulletText}>• Illegal activities</Text>
              <Text style={styles.bulletText}>• Violation of these Terms</Text>
            </View>

            {/* 13. Changes to Terms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
              <Text style={styles.sectionText}>
                bookfleet may revise these Terms from time to time.{'\n\n'}
                Updated Terms become effective immediately upon publication unless otherwise stated.{'\n\n'}
                Continued use of the Platform constitutes acceptance of the revised Terms.
              </Text>
            </View>

            {/* 14. Governing Law */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>14. Governing Law</Text>
              <Text style={styles.sectionText}>
                These Terms shall be governed by and interpreted in accordance with the laws of India.{'\n\n'}
                Any disputes shall be subject to the exclusive jurisdiction of the competent courts of Bhubaneswar, Odisha.
              </Text>
            </View>

            {/* 15. Contact Us */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>15. Contact Us</Text>
              <Text style={styles.sectionText}>For questions regarding these Terms & Conditions, please contact:</Text>
              <Text style={styles.sectionText}>bookfleet</Text>
              <Text style={styles.contactText}>📧 support@bookfleet.in</Text>
              <Text style={styles.contactText}>🌐 www.bookfleet.in</Text>
              <Text style={styles.sectionText}>Legal Entity: Zipto Hyperlogistics Private Limited</Text>
              <Text style={styles.sectionText}>Registered Office:</Text>
              <Text style={styles.contactText}>📍 781, Shaheed Nagar,{'\n'}    780 Maharishi College Road,{'\n'}    Bhubaneswar,{'\n'}    Khordha, Odisha – 751007, India</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="info-outline" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                By using bookfleet's services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. © 2026 Zipto Hyperlogistics Private Limited.
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
  safeArea: { flex: 1 },

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
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: vs(24) },
  legalContent: { padding: hs(20) },

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
  welcomeText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: fs(14) * 1.6,
    marginBottom: vs(24),
    padding: ms(16),
    backgroundColor: '#EFF6FF',
    borderRadius: ms(10),
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
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
    backgroundColor: '#DCFCE7',
    padding: ms(16),
    borderRadius: ms(12),
    gap: hs(12),
    marginTop: vs(8),
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
    alignItems: 'flex-start',
  },
  acknowledgementText: {
    flex: 1,
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#166534',
    lineHeight: fs(13) * 1.55,
  },
});

export default TermsAndConditions;