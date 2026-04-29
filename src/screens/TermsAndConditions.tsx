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
            <Text style={styles.legalUpdate}>Effective: 11 April 2026 · Last updated: 11 April 2026</Text>

            {/* 1. Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. INTRODUCTION</Text>
              <Text style={styles.sectionText}>
                Welcome to Zipto — your on-demand intra-city delivery platform.{'\n\n'}
                These Terms & Conditions (“Terms”) govern your use of the Zipto application, website, and services operated by Zipto Hyperlogistics Private Limited (“Zipto”, “we”, “our”, “us”).{'\n\n'}
                By using Zipto, you agree to these Terms.
              </Text>
            </View>

            {/* 2. About Zipto */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. ABOUT ZIPTO</Text>
              <Text style={styles.sectionText}>
                Zipto is a technology platform that enables users to send anything within their city through independent delivery partners.
              </Text>
              <Text style={styles.importantNote}>👉 We don’t sell products — we deliver what you need.</Text>
              <Text style={styles.sectionText}>Zipto:</Text>
              <Text style={styles.bulletText}>• Does NOT own products</Text>
              <Text style={styles.bulletText}>• Does NOT act as a seller</Text>
              <Text style={styles.bulletText}>• Does NOT control third-party goods</Text>
              <Text style={styles.sectionText}>Our role is limited to facilitating pickup and delivery.</Text>
            </View>

            {/* 3. Eligibility */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. ELIGIBILITY</Text>
              <Text style={styles.sectionText}>To use Zipto:</Text>
              <Text style={styles.bulletText}>• You must be 18 years or older</Text>
              <Text style={styles.bulletText}>• You must provide accurate information</Text>
            </View>

            {/* 4. Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. SERVICES</Text>
              <Text style={styles.sectionText}>Zipto allows users to request delivery of:</Text>
              <Text style={styles.bulletText}>• 🍔 Items from any restaurant</Text>
              <Text style={styles.bulletText}>• 💊 Items from any pharmacy</Text>
              <Text style={styles.bulletText}>• 📦 Parcels & packages</Text>
              <Text style={styles.bulletText}>• 🚚 Goods & bulk items</Text>
              <Text style={styles.importantNote}>👉 Zipto does NOT provide product listings or marketplace services.</Text>
            </View>

            {/* 5. User Responsibilities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. USER RESPONSIBILITIES</Text>
              <Text style={styles.sectionText}>By using Zipto, you agree to:</Text>
              <Text style={styles.bulletText}>• Provide correct pickup & drop details</Text>
              <Text style={styles.bulletText}>• Clearly describe the item</Text>
              <Text style={styles.bulletText}>• Ensure proper packaging</Text>
              <Text style={styles.bulletText}>• Ensure items are legal and safe</Text>
              <Text style={styles.importantNote}>⚠️ You are fully responsible for the contents being shipped.</Text>
            </View>

            {/* 6. Pricing & Payments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. PRICING & PAYMENTS</Text>
              <Text style={styles.bulletText}>• Delivery charges are dynamic (distance, time, demand)</Text>
              <Text style={styles.bulletText}>• Payments may be made via UPI, cash, or other supported methods</Text>
            </View>

            {/* 7. Cancellation Policy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. CANCELLATION POLICY</Text>
              <Text style={styles.bulletText}>• Before rider assignment → Free</Text>
              <Text style={styles.bulletText}>• After rider assignment → Cancellation charges apply</Text>
              <Text style={styles.bulletText}>• After pickup → Cancellation not allowed</Text>
            </View>

            {/* 8. Refunds */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. REFUNDS</Text>
              <Text style={styles.sectionText}>Refunds are applicable only in:</Text>
              <Text style={styles.bulletText}>• Failed transactions</Text>
              <Text style={styles.bulletText}>• Duplicate payments</Text>
              <Text style={styles.bulletText}>• Service failure by Zipto</Text>
              <Text style={styles.sectionText}>Refunds are processed within 5–7 business days.</Text>
            </View>

            {/* 9. Prohibited Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. PROHIBITED ITEMS</Text>
              <Text style={styles.sectionText}>You must NOT send:</Text>
              <Text style={styles.bulletText}>• Illegal items (drugs, weapons)</Text>
              <Text style={styles.bulletText}>• Hazardous or flammable materials</Text>
              <Text style={styles.bulletText}>• Explosives or toxic substances</Text>
              <Text style={styles.bulletText}>• Restricted items under law</Text>
              <Text style={styles.importantNote}>🚫 Violation may result in account suspension and legal action.</Text>
            </View>

            {/* 10. Damage & Loss */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. DAMAGE & LOSS</Text>
              <Text style={styles.sectionText}>Zipto is not responsible for:</Text>
              <Text style={styles.bulletText}>• Damage due to improper packaging</Text>
              <Text style={styles.bulletText}>• Spoilage of perishable items (food/medicine)</Text>
              <Text style={styles.bulletText}>• Loss due to incorrect information</Text>
              <Text style={styles.importantNote}>👉 Any compensation, if applicable, is limited and at Zipto’s discretion.</Text>
            </View>

            {/* 11. Limitation of Liability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. LIMITATION OF LIABILITY</Text>
              <Text style={styles.sectionText}>To the maximum extent permitted by law, Zipto shall not be liable for:</Text>
              <Text style={styles.bulletText}>• Product quality or condition</Text>
              <Text style={styles.bulletText}>• Wrong or incomplete items from third parties</Text>
              <Text style={styles.bulletText}>• Delivery delays due to external factors</Text>
              <Text style={styles.bulletText}>• Indirect or consequential losses</Text>
              <Text style={styles.importantNote}>👉 Zipto’s responsibility is strictly limited to facilitating delivery.</Text>
            </View>

            {/* 12. Third-Party Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. THIRD-PARTY SERVICES</Text>
              <Text style={styles.sectionText}>
                Zipto may use third-party services (payments, maps, etc.).{'\n'}
                We are not responsible for their performance.
              </Text>
            </View>

            {/* 13. Account & Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>13. ACCOUNT & SECURITY</Text>
              <Text style={styles.sectionText}>
                You are responsible for maintaining the confidentiality of your account.
              </Text>
            </View>

            {/* 14. Termination */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>14. TERMINATION</Text>
              <Text style={styles.sectionText}>Zipto may suspend or terminate accounts in case of:</Text>
              <Text style={styles.bulletText}>• Fraud</Text>
              <Text style={styles.bulletText}>• Abuse</Text>
              <Text style={styles.bulletText}>• Policy violations</Text>
            </View>

            {/* 15. Indemnification */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>15. INDEMNIFICATION</Text>
              <Text style={styles.sectionText}>
                You agree to indemnify Zipto against any claims arising from misuse, illegal activity, or violations of these Terms.
              </Text>
            </View>

            {/* 16. Privacy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>16. PRIVACY</Text>
              <Text style={styles.sectionText}>
                Your use of Zipto is governed by our Privacy Policy.
              </Text>
            </View>

            {/* 17. Force Majeure */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>17. FORCE MAJEURE</Text>
              <Text style={styles.sectionText}>
                Zipto is not liable for delays or failures caused by events beyond our control.
              </Text>
            </View>

            {/* 18. Governing Law */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>18. GOVERNING LAW</Text>
              <Text style={styles.sectionText}>
                These Terms are governed by Indian law.{'\n'}
                Jurisdiction: Bhubaneswar, Odisha.
              </Text>
            </View>

            {/* 19. Changes to Terms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>19. CHANGES TO TERMS</Text>
              <Text style={styles.sectionText}>
                Zipto may update these Terms at any time.
              </Text>
            </View>

            {/* 20. Contact & Support */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>20. CONTACT & SUPPORT</Text>
              <Text style={styles.contactText}>📧 support@ridezipto.com</Text>
              <Text style={styles.contactText}>📍 Bhubaneswar, Odisha, India.</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="info-outline" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                By using Zipto's services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. © 2026 Zipto Hyperlogistics Pvt. Ltd.
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