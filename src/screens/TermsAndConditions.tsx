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
            <Text style={styles.legalTitle}>Terms and Conditions</Text>
            <Text style={styles.legalUpdate}>Last Updated: May 2026</Text>

            {/* Intro */}
            <View style={styles.section}>
              <Text style={styles.sectionText}>
                These Terms & Conditions ("Terms") govern the access and use of the Zipto mobile application, website, and related services ("Platform") operated by ZIPTO HYPERLOGISTICS PRIVATE LIMITED ("Zipto", "Company", "we", "our", or "us").{'\n\n'}
                By accessing or using the Platform, users agree to comply with these Terms.
              </Text>
            </View>

            {/* 1. Nature of Platform */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. NATURE OF PLATFORM</Text>
              <Text style={styles.sectionText}>
                Zipto is a technology-enabled platform facilitating connections between users and independent rider partners, delivery partners, merchants, and local service providers.
              </Text>
              <Text style={styles.importantNote}>👉 Zipto does not directly provide transportation, delivery, courier, or logistics services.</Text>
            </View>

            {/* 2. Services Offered */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. SERVICES OFFERED</Text>
              <Text style={styles.sectionText}>The Platform may provide or facilitate:</Text>
              <Text style={styles.bulletText}>• Bike Taxi Services</Text>
              <Text style={styles.bulletText}>• Parcel Delivery Services</Text>
              <Text style={styles.bulletText}>• Courier Services</Text>
              <Text style={styles.bulletText}>• Hyperlocal Transportation</Text>
              <Text style={styles.bulletText}>• Local Commerce Services</Text>
              <Text style={styles.bulletText}>• Integrations including food delivery, pharmacy, and other on-demand services</Text>
              <Text style={styles.sectionText}>Services may vary depending on operational city and availability.</Text>
            </View>

            {/* 3. User Eligibility */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. USER ELIGIBILITY</Text>
              <Text style={styles.sectionText}>
                Users must be at least 18 years of age and legally competent to use the Platform.{'\n\n'}
                By using Zipto, users confirm that all information provided is accurate and valid.
              </Text>
            </View>

            {/* 4. User Account Responsibilities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. USER ACCOUNT RESPONSIBILITIES</Text>
              <Text style={styles.sectionText}>Users are responsible for:</Text>
              <Text style={styles.bulletText}>• Maintaining confidentiality of account credentials</Text>
              <Text style={styles.bulletText}>• Protecting OTPs and login details</Text>
              <Text style={styles.bulletText}>• Providing accurate booking information</Text>
              <Text style={styles.bulletText}>• Using the Platform lawfully and responsibly</Text>
              <Text style={styles.importantNote}>⚠️ Users shall not misuse the Platform in any unlawful or fraudulent manner.</Text>
            </View>

            {/* 5. Prohibited Activities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. PROHIBITED ACTIVITIES</Text>
              <Text style={styles.sectionText}>Users are strictly prohibited from:</Text>
              <Text style={styles.bulletText}>• Sending illegal or restricted items</Text>
              <Text style={styles.bulletText}>• Engaging in abusive, threatening, or fraudulent conduct</Text>
              <Text style={styles.bulletText}>• Misusing rider or delivery partner information</Text>
              <Text style={styles.bulletText}>• Attempting unauthorized access to the Platform</Text>
              <Text style={styles.bulletText}>• Disrupting platform operations or services</Text>
            </View>

            {/* 6. Restricted Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. RESTRICTED ITEMS</Text>
              <Text style={styles.sectionText}>The following items are prohibited on the Platform:</Text>
              <Text style={styles.bulletText}>• Illegal drugs or narcotics</Text>
              <Text style={styles.bulletText}>• Weapons and explosives</Text>
              <Text style={styles.bulletText}>• Hazardous chemicals</Text>
              <Text style={styles.bulletText}>• Flammable substances</Text>
              <Text style={styles.bulletText}>• Counterfeit or stolen goods</Text>
              <Text style={styles.bulletText}>• Any item prohibited under Indian law</Text>
              <Text style={styles.importantNote}>🚫 Zipto reserves the right to cancel such orders immediately without refund.</Text>
            </View>

            {/* 7. Bookings & Cancellations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. BOOKINGS & CANCELLATIONS</Text>
              <Text style={styles.sectionText}>Bookings may be cancelled subject to applicable cancellation policies.</Text>
              <Text style={styles.sectionText}>Cancellation charges may apply depending on:</Text>
              <Text style={styles.bulletText}>• Rider allocation status</Text>
              <Text style={styles.bulletText}>• Distance travelled</Text>
              <Text style={styles.bulletText}>• Operational stage of service</Text>
              <Text style={styles.importantNote}>⚠️ Repeated fake or abusive bookings may result in permanent suspension.</Text>
            </View>

            {/* 8. Pricing & Payments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. PRICING & PAYMENTS</Text>
              <Text style={styles.sectionText}>Pricing may include:</Text>
              <Text style={styles.bulletText}>• Base Fare</Text>
              <Text style={styles.bulletText}>• Distance Charges</Text>
              <Text style={styles.bulletText}>• Platform Fees</Text>
              <Text style={styles.bulletText}>• Waiting Charges</Text>
              <Text style={styles.bulletText}>• Taxes</Text>
              <Text style={styles.bulletText}>• Surge or Peak-Time Pricing</Text>
              <Text style={styles.sectionText}>Final pricing may vary depending on traffic conditions, route changes, waiting time, or operational factors.</Text>
            </View>

            {/* 9. Payment Methods */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. PAYMENT METHODS</Text>
              <Text style={styles.sectionText}>Payments may be completed through:</Text>
              <Text style={styles.bulletText}>• UPI</Text>
              <Text style={styles.bulletText}>• Debit/Credit Cards</Text>
              <Text style={styles.bulletText}>• Net Banking</Text>
              <Text style={styles.bulletText}>• Cash (where available)</Text>
              <Text style={styles.sectionText}>All transactions are processed through authorized payment service providers.</Text>
            </View>

            {/* 10. Rider & Delivery Partner Clause */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. RIDER & DELIVERY PARTNER CLAUSE</Text>
              <Text style={styles.importantNote}>👉 Rider and delivery partners available on Zipto operate independently and are not employees, agents, or representatives of Zipto.</Text>
            </View>

            {/* 11. Service Availability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. SERVICE AVAILABILITY</Text>
              <Text style={styles.sectionText}>Services are subject to:</Text>
              <Text style={styles.bulletText}>• Rider availability</Text>
              <Text style={styles.bulletText}>• Traffic conditions</Text>
              <Text style={styles.bulletText}>• Weather conditions</Text>
              <Text style={styles.bulletText}>• Technical limitations</Text>
              <Text style={styles.bulletText}>• Operational area restrictions</Text>
              <Text style={styles.sectionText}>Zipto does not guarantee uninterrupted or error-free services.</Text>
            </View>

            {/* 12. Limitation of Liability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. LIMITATION OF LIABILITY</Text>
              <Text style={styles.sectionText}>Zipto shall not be liable for:</Text>
              <Text style={styles.bulletText}>• Delays caused by weather, traffic, or unforeseen circumstances</Text>
              <Text style={styles.bulletText}>• Losses arising from user negligence</Text>
              <Text style={styles.bulletText}>• Indirect or consequential damages</Text>
              <Text style={styles.bulletText}>• Actions or omissions of independent rider or delivery partners</Text>
            </View>

            {/* 13. Account Suspension & Termination */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>13. ACCOUNT SUSPENSION & TERMINATION</Text>
              <Text style={styles.sectionText}>Zipto reserves the right to suspend or terminate accounts involved in:</Text>
              <Text style={styles.bulletText}>• Fraudulent activity</Text>
              <Text style={styles.bulletText}>• Fake bookings</Text>
              <Text style={styles.bulletText}>• Abuse or misconduct</Text>
              <Text style={styles.bulletText}>• Violation of applicable laws</Text>
              <Text style={styles.bulletText}>• Breach of these Terms</Text>
            </View>

            {/* 14. Intellectual Property Rights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>14. INTELLECTUAL PROPERTY RIGHTS</Text>
              <Text style={styles.sectionText}>
                All trademarks, logos, graphics, software, application interfaces, and branding associated with Zipto are the exclusive properties of ZIPTO HYPERLOGISTICS PRIVATE LIMITED.
              </Text>
              <Text style={styles.importantNote}>🚫 Unauthorized reproduction or misuse is strictly prohibited.</Text>
            </View>

            {/* 15. Governing Law & Jurisdiction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>15. GOVERNING LAW & JURISDICTION</Text>
              <Text style={styles.sectionText}>
                These Terms shall be governed in accordance with the laws of India.{'\n\n'}
                Any disputes arising shall be subject to the jurisdiction of competent courts in Odisha, India.
              </Text>
            </View>

            {/* 16. Modifications to Terms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>16. MODIFICATIONS TO TERMS</Text>
              <Text style={styles.sectionText}>
                Zipto reserves the right to update or modify these Terms at any time without prior notice.{'\n\n'}
                Continued use of the Platform constitutes acceptance of the revised Terms & Conditions.
              </Text>
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