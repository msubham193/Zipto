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
            <Text style={styles.legalUpdate}>Last updated: January 15, 2026</Text>

            <Text style={styles.welcomeText}>
              At Zipto, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our delivery services.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Information We Collect</Text>
              <Text style={styles.sectionText}>
                We collect information that you provide directly to us when you create an account, place an order, or communicate with us. This includes:
              </Text>
              <Text style={styles.bulletText}>• Personal information (name, email address, phone number)</Text>
              <Text style={styles.bulletText}>• Delivery addresses (home, work, or other locations)</Text>
              <Text style={styles.bulletText}>• Payment information (credit card details, UPI IDs, wallet information)</Text>
              <Text style={styles.bulletText}>• Order history and preferences</Text>
              <Text style={styles.bulletText}>• Communication history with our support team</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Location Data</Text>
              <Text style={styles.sectionText}>
                With your permission, we collect precise or approximate location data from your mobile device to:
              </Text>
              <Text style={styles.bulletText}>• Provide accurate delivery services</Text>
              <Text style={styles.bulletText}>• Show nearby delivery options and estimated delivery times</Text>
              <Text style={styles.bulletText}>• Enable real-time order tracking</Text>
              <Text style={styles.bulletText}>• Improve our services and optimize delivery routes</Text>
              <Text style={styles.sectionText}>
                You can disable location services at any time through your device settings, but this may limit certain features of our service.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Automatically Collected Information</Text>
              <Text style={styles.sectionText}>
                When you use our app, we automatically collect certain information about your device and usage patterns:
              </Text>
              <Text style={styles.bulletText}>• Device information (model, operating system, unique device identifiers)</Text>
              <Text style={styles.bulletText}>• Log data (IP address, browser type, access times)</Text>
              <Text style={styles.bulletText}>• Usage data (features used, pages viewed, time spent on app)</Text>
              <Text style={styles.bulletText}>• Crash reports and performance data</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. How We Use Your Information</Text>
              <Text style={styles.sectionText}>We use the collected information for various purposes:</Text>
              <Text style={styles.bulletText}>• To process and deliver your orders</Text>
              <Text style={styles.bulletText}>• To communicate with you about your orders and our services</Text>
              <Text style={styles.bulletText}>• To process payments and prevent fraudulent transactions</Text>
              <Text style={styles.bulletText}>• To provide customer support and respond to your inquiries</Text>
              <Text style={styles.bulletText}>• To improve our services and develop new features</Text>
              <Text style={styles.bulletText}>• To send you promotional materials and offers (with your consent)</Text>
              <Text style={styles.bulletText}>• To comply with legal obligations and enforce our terms</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Information Sharing and Disclosure</Text>
              <Text style={styles.sectionText}>We may share your information in the following situations:</Text>

              <Text style={styles.subSectionTitle}>With Delivery Partners:</Text>
              <Text style={styles.sectionText}>
                We share necessary information (name, phone number, delivery address) with delivery agents only to the extent required to complete your delivery.
              </Text>

              <Text style={styles.subSectionTitle}>With Service Providers:</Text>
              <Text style={styles.sectionText}>
                We may share information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, and customer service.
              </Text>

              <Text style={styles.subSectionTitle}>Legal Requirements:</Text>
              <Text style={styles.sectionText}>
                We may disclose your information if required by law or in response to valid requests by public authorities.
              </Text>

              <Text style={styles.importantNote}>
                We do not sell your personal information to third parties for their marketing purposes.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Data Security</Text>
              <Text style={styles.sectionText}>
                We implement appropriate technical and organizational security measures to protect your personal information:
              </Text>
              <Text style={styles.bulletText}>• Encryption of data in transit and at rest</Text>
              <Text style={styles.bulletText}>• Secure payment processing through PCI-DSS compliant providers</Text>
              <Text style={styles.bulletText}>• Regular security audits and vulnerability assessments</Text>
              <Text style={styles.bulletText}>• Limited access to personal data on a need-to-know basis</Text>
              <Text style={styles.sectionText}>
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Data Retention</Text>
              <Text style={styles.sectionText}>
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. When your information is no longer needed, we will securely delete or anonymize it.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Your Rights and Choices</Text>
              <Text style={styles.sectionText}>You have certain rights regarding your personal information:</Text>
              <Text style={styles.bulletText}>• Access: Request access to the personal information we hold about you</Text>
              <Text style={styles.bulletText}>• Correction: Request correction of inaccurate or incomplete information</Text>
              <Text style={styles.bulletText}>• Deletion: Request deletion of your personal information</Text>
              <Text style={styles.bulletText}>• Opt-out: Unsubscribe from marketing communications</Text>
              <Text style={styles.bulletText}>• Data portability: Request a copy of your data in a portable format</Text>
              <Text style={styles.sectionText}>
                You can manage your data and preferences through your account settings or by contacting us at privacy@zipto.com
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Cookies and Tracking Technologies</Text>
              <Text style={styles.sectionText}>
                We use cookies and similar tracking technologies to improve your experience, analyze usage patterns, and deliver personalized content. You can control cookie preferences through your browser settings.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Children's Privacy</Text>
              <Text style={styles.sectionText}>
                Our services are not directed to children under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. Third-Party Links</Text>
              <Text style={styles.sectionText}>
                Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. International Data Transfers</Text>
              <Text style={styles.sectionText}>
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>13. Changes to This Privacy Policy</Text>
              <Text style={styles.sectionText}>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>14. Contact Us</Text>
              <Text style={styles.sectionText}>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </Text>
              <Text style={styles.contactText}>Email: legal@ridezipto.com</Text>
              <Text style={styles.contactText}>Phone: +919090029996</Text>
              <Text style={styles.contactText}>Address: Plot No-781, Maharishi College Rd, in front of DN Kingsland, Saheed Nagar, Bhubaneswar, Odisha 751007</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="security" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                Your privacy is important to us. By using Zipto, you acknowledge that you have read and understood this Privacy Policy and consent to our data practices as described herein.
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