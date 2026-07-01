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
import { AppStackParamList } from '../../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../../utils/metrics';

const CancellationPolicy = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancellation & Refund</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.legalContent}>
            <Text style={styles.legalTitle}>Bookfleet Cancellation & Refund Policy</Text>
            <Text style={styles.legalUpdate}>Last Updated: June 2026</Text>

            {/* 1. Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Introduction</Text>
              <Text style={styles.sectionText}>
                This Cancellation & Refund Policy outlines the rules governing booking cancellations, cancellation charges, refunds, and related processes for services offered through the Bookfleet Customer App, website, and related platforms operated by Zipto Hyperlogistics Private Limited ("Bookfleet", "Company", "we", "our", or "us").{'\n\n'}
                By using Bookfleet, you agree to this Cancellation & Refund Policy.
              </Text>
            </View>

            {/* 2. Customer Cancellation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Customer Cancellation</Text>
              <Text style={styles.sectionText}>Customers may cancel a booking at any time through the Bookfleet App, subject to the following conditions:</Text>

              <Text style={styles.subSectionTitle}>Before a Delivery Partner is Assigned</Text>
              <Text style={styles.bulletText}>• Cancellation is free of charge.</Text>
              <Text style={styles.bulletText}>• No cancellation fee will be applied.</Text>

              <Text style={styles.subSectionTitle}>After a Delivery Partner is Assigned</Text>
              <Text style={styles.sectionText}>A cancellation fee may apply depending on:</Text>
              <Text style={styles.bulletText}>• Distance travelled by the delivery partner.</Text>
              <Text style={styles.bulletText}>• Time spent reaching the pickup location.</Text>
              <Text style={styles.bulletText}>• Operational costs incurred.</Text>

              <Text style={styles.subSectionTitle}>After Pickup</Text>
              <Text style={styles.importantNote}>⚠️ Once the shipment has been picked up by the delivery partner, the booking generally cannot be cancelled unless approved by Bookfleet under exceptional circumstances.</Text>
            </View>

            {/* 3. Cancellation by Bookfleet */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Cancellation by Bookfleet</Text>
              <Text style={styles.sectionText}>Bookfleet reserves the right to cancel any booking due to:</Text>
              <Text style={styles.bulletText}>• Rider unavailability</Text>
              <Text style={styles.bulletText}>• Vehicle unavailability</Text>
              <Text style={styles.bulletText}>• Incorrect pickup or delivery details</Text>
              <Text style={styles.bulletText}>• Safety concerns</Text>
              <Text style={styles.bulletText}>• Suspected fraudulent activity</Text>
              <Text style={styles.bulletText}>• Technical issues</Text>
              <Text style={styles.bulletText}>• Force majeure events</Text>
              <Text style={styles.bulletText}>• Violation of Bookfleet policies</Text>
              <Text style={styles.sectionText}>Where applicable, eligible refunds will be processed.</Text>
            </View>

            {/* 4. Cancellation by Delivery Partner */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Cancellation by Delivery Partner</Text>
              <Text style={styles.sectionText}>A delivery partner may cancel a booking due to:</Text>
              <Text style={styles.bulletText}>• Vehicle breakdown</Text>
              <Text style={styles.bulletText}>• Personal emergency</Text>
              <Text style={styles.bulletText}>• Safety concerns</Text>
              <Text style={styles.bulletText}>• Incorrect booking details</Text>
              <Text style={styles.bulletText}>• Other valid operational reasons</Text>
              <Text style={styles.sectionText}>Bookfleet will make reasonable efforts to assign another available delivery partner.</Text>
            </View>

            {/* 5. Refund Eligibility */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Refund Eligibility</Text>
              <Text style={styles.sectionText}>Refunds may be provided in situations including but not limited to:</Text>
              <Text style={styles.bulletText}>• Payment successfully completed but booking not created.</Text>
              <Text style={styles.bulletText}>• Duplicate payment.</Text>
              <Text style={styles.bulletText}>• Booking cancelled by bookfleet.</Text>
              <Text style={styles.bulletText}>• Service could not be provided.</Text>
              <Text style={styles.bulletText}>• Payment charged incorrectly.</Text>
              <Text style={styles.bulletText}>• Any other case approved by Bookfleet after review.</Text>
              <Text style={styles.importantNote}>👉 Refunds are not guaranteed for every cancelled booking.</Text>
            </View>

            {/* 6. Non-Refundable Situations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Non-Refundable Situations</Text>
              <Text style={styles.sectionText}>Refunds may not be provided if:</Text>
              <Text style={styles.bulletText}>• The customer entered incorrect booking details.</Text>
              <Text style={styles.bulletText}>• The customer was unavailable at pickup or delivery.</Text>
              <Text style={styles.bulletText}>• The shipment violated Bookfleet policies.</Text>
              <Text style={styles.bulletText}>• Cancellation occurred after pickup without valid reason.</Text>
              <Text style={styles.bulletText}>• The service was successfully completed.</Text>
            </View>

            {/* 7. Refund Processing Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Refund Processing Time</Text>
              <Text style={styles.sectionText}>
                Approved refunds are generally processed within 5–10 business days, depending on the payment method and banking partner.{'\n\n'}
                Actual credit timelines may vary depending on your bank or payment service provider.
              </Text>
            </View>

            {/* 8. Refund Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Refund Method</Text>
              <Text style={styles.sectionText}>
                Refunds will normally be issued to the original payment method used during booking.{'\n\n'}
                Where this is not possible, Bookfleet may process the refund through another suitable method permitted by law.
              </Text>
            </View>

            {/* 9. Failed or Pending Payments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Failed or Pending Payments</Text>
              <Text style={styles.sectionText}>
                If a payment fails or remains pending, customers should first verify the transaction with their bank or payment provider.{'\n\n'}
                If the amount has been debited but the booking was not created, customers may contact Bookfleet Support for assistance.
              </Text>
            </View>

            {/* 10. Disputes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Disputes</Text>
              <Text style={styles.sectionText}>
                Any cancellation or refund dispute will be reviewed by bookfleet.{'\n\n'}
                Bookfleet's decision regarding refunds, after reviewing the relevant facts and applicable policies, shall be final to the extent permitted by law.
              </Text>
            </View>

            {/* 11. Policy Updates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. Policy Updates</Text>
              <Text style={styles.sectionText}>
                Bookfleet may modify this Cancellation & Refund Policy from time to time.{'\n\n'}
                The latest version will always be available on the Bookfleet website and application.
              </Text>
            </View>

            {/* 12. Contact Us */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. Contact Us</Text>
              <Text style={styles.sectionText}>For cancellation or refund-related assistance, please contact:</Text>
              <Text style={styles.sectionText}>Bookfleet Support</Text>
              <Text style={styles.contactText}>📧 support@bookfleet.in</Text>
              <Text style={styles.contactText}>🌐 www.bookfleet.in</Text>
              <Text style={styles.sectionText}>Legal Entity: Zipto Hyperlogistics Private Limited</Text>
              <Text style={styles.sectionText}>Registered Office:</Text>
              <Text style={styles.contactText}>📍 781, Shaheed Nagar,{'\n'}    780 Maharishi College Road,{'\n'}    Bhubaneswar, Khordha,{'\n'}    Odisha – 751007, India</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="assignment-return" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                By using Bookfleet's services, you acknowledge that you have read and understood this Cancellation & Refund Policy. © 2026 Zipto Hyperlogistics Private Limited.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const backBtnSize = ms(40);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea:  { flex: 1 },

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

  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: vs(24) },
  legalContent:  { padding: hs(20) },

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

export default CancellationPolicy;
