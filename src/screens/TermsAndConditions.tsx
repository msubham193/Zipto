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
            <Text style={styles.legalTitle}>Terms and Conditions</Text>
            <Text style={styles.legalUpdate}>Last updated: January 15, 2026</Text>

            <Text style={styles.welcomeText}>
              Welcome to Zipto. Please read these Terms and Conditions carefully before using our delivery services.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.sectionText}>
                By accessing and using Zipto's services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.
              </Text>
              <Text style={styles.sectionText}>
                These terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Use of Service</Text>
              <Text style={styles.sectionText}>
                You agree to use our delivery services only for lawful purposes. You must not use our services:
              </Text>
              <Text style={styles.bulletText}>• In any way that breaches any applicable local, national, or international law or regulation</Text>
              <Text style={styles.bulletText}>• To transmit, or procure the sending of, any unsolicited or unauthorized advertising or promotional material</Text>
              <Text style={styles.bulletText}>• To knowingly transmit any data or send or upload any material that contains viruses or any other harmful programs</Text>
              <Text style={styles.bulletText}>• For the delivery of illegal, prohibited, or dangerous items</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Account Responsibilities</Text>
              <Text style={styles.sectionText}>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.
              </Text>
              <Text style={styles.sectionText}>
                You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Delivery Terms</Text>
              <Text style={styles.sectionText}>
                Delivery times are estimates and not guaranteed. Zipto will make reasonable efforts to deliver within the estimated timeframe, but delays may occur due to traffic, weather, or other unforeseen circumstances.
              </Text>
              <Text style={styles.sectionText}>
                You must provide accurate delivery addresses. Zipto is not responsible for failed deliveries due to incorrect address information provided by you.
              </Text>
              <Text style={styles.sectionText}>
                The recipient must be available to receive the delivery. If the recipient is unavailable, the delivery agent may attempt to contact you or return the item.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Payment Terms</Text>
              <Text style={styles.sectionText}>
                All fees are payable in Indian Rupees (INR). You agree to pay all charges incurred under your account including delivery fees, service charges, and any applicable taxes.
              </Text>
              <Text style={styles.sectionText}>
                Payment can be made through various methods including Cash on Delivery, UPI, Credit/Debit Cards, Net Banking, or Wallet balance.
              </Text>
              <Text style={styles.sectionText}>
                All prices and charges are subject to change without notice. However, changes will not affect orders already placed.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Cancellation Policy</Text>
              <Text style={styles.sectionText}>
                Orders can be cancelled before pickup without any cancellation charges. Once an order has been picked up by a delivery agent, cancellations may incur fees as follows:
              </Text>
              <Text style={styles.bulletText}>• Cancellation after pickup but before delivery: 50% of delivery fee</Text>
              <Text style={styles.bulletText}>• Multiple cancellations may result in temporary account suspension</Text>
              <Text style={styles.sectionText}>
                Refunds for cancelled orders will be processed within 24-48 hours to the original payment method.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Prohibited Items</Text>
              <Text style={styles.sectionText}>
                The following items are strictly prohibited from being delivered through our service:
              </Text>
              <Text style={styles.bulletText}>• Illegal drugs, narcotics, or controlled substances</Text>
              <Text style={styles.bulletText}>• Weapons, firearms, or explosives</Text>
              <Text style={styles.bulletText}>• Hazardous materials or dangerous goods</Text>
              <Text style={styles.bulletText}>• Stolen goods or counterfeit items</Text>
              <Text style={styles.bulletText}>• Live animals (except as specifically permitted)</Text>
              <Text style={styles.bulletText}>• Perishable items without proper packaging</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
              <Text style={styles.sectionText}>
                Zipto shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
              </Text>
              <Text style={styles.bulletText}>• Your access to or use of or inability to access or use the service</Text>
              <Text style={styles.bulletText}>• Any conduct or content of any third party on the service</Text>
              <Text style={styles.bulletText}>• Unauthorized access, use, or alteration of your transmissions or content</Text>
              <Text style={styles.sectionText}>
                Our total liability shall not exceed the amount you paid for the specific delivery service.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Indemnification</Text>
              <Text style={styles.sectionText}>
                You agree to indemnify and hold Zipto, its affiliates, officers, agents, and employees harmless from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of your breach of these Terms or your violation of any law or the rights of a third party.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Modifications to Service</Text>
              <Text style={styles.sectionText}>
                We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice. You agree that Zipto shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the service.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. Governing Law</Text>
              <Text style={styles.sectionText}>
                These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms will be subject to the exclusive jurisdiction of the courts in Bhubaneswar, Odisha.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
              <Text style={styles.sectionText}>
                We reserve the right to update or change these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date.
              </Text>
              <Text style={styles.sectionText}>
                Your continued use of the service after any such changes constitutes your acceptance of the new Terms.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>13. Contact Information</Text>
              <Text style={styles.sectionText}>
                If you have any questions about these Terms, please contact us:
              </Text>
              <Text style={styles.contactText}>Email: legal@zipto.com</Text>
              <Text style={styles.contactText}>Phone: 1800-123-4567</Text>
              <Text style={styles.contactText}>Address: 123 Business Park, Bhubaneswar, Odisha 751001</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="info-outline" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                By using Zipto's services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
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
  scrollView: { flex: 1 },
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
    backgroundColor: '#DCFCE7',
    padding: ms(16),
    borderRadius: ms(12),
    gap: scaleW(12),
    marginTop: scaleH(8),
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