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

const DataDeletionPolicy = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Deletion Policy</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.legalContent}>
            <Text style={styles.legalTitle}>Bookfleet Data Deletion Policy</Text>
            <Text style={styles.legalUpdate}>Last Updated: June 2026</Text>

            {/* 1. Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Introduction</Text>
              <Text style={styles.sectionText}>
                This Data Deletion Policy explains how Bookfleet, operated by Zipto Hyperlogistics Private Limited ("Bookfleet", "Company", "we", "our", or "us"), handles requests for deletion of personal information and user accounts.{'\n\n'}
                We respect your privacy and provide users with the ability to request deletion of their personal information, subject to applicable laws and our legitimate business obligations.
              </Text>
            </View>

            {/* 2. Who Can Request */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Who Can Request Data Deletion</Text>
              <Text style={styles.sectionText}>The following users may request deletion of their Bookfleet account and associated personal information:</Text>
              <Text style={styles.bulletText}>• Customers</Text>
              <Text style={styles.bulletText}>• Delivery Partners (Riders)</Text>
            </View>

            {/* 3. How to Request */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. How to Request Data Deletion</Text>
              <Text style={styles.sectionText}>You may request deletion of your Bookfleet account by:</Text>
              <Text style={styles.bulletText}>• Using the Delete Account option available within the Bookfleet App (where available), or</Text>
              <Text style={styles.bulletText}>• Contacting our support team.</Text>
              <Text style={styles.contactText}>📧 support@bookfleet.in</Text>
              <Text style={styles.importantNote}>👉 Please include your registered mobile number and account details when submitting a request.</Text>
            </View>

            {/* 4. What Happens After */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. What Happens After Your Request</Text>
              <Text style={styles.sectionText}>Once your request is received:</Text>
              <Text style={styles.bulletText}>• Your identity may be verified.</Text>
              <Text style={styles.bulletText}>• Your account will be reviewed.</Text>
              <Text style={styles.bulletText}>• Eligible personal information will be deleted or anonymized.</Text>
              <Text style={styles.bulletText}>• You may receive confirmation once the deletion process is completed.</Text>
            </View>

            {/* 5. Information That May Be Retained */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Information That May Be Retained</Text>
              <Text style={styles.sectionText}>Certain information may continue to be retained where required for:</Text>
              <Text style={styles.bulletText}>• Legal compliance</Text>
              <Text style={styles.bulletText}>• Tax and accounting obligations</Text>
              <Text style={styles.bulletText}>• Fraud prevention</Text>
              <Text style={styles.bulletText}>• Dispute resolution</Text>
              <Text style={styles.bulletText}>• Regulatory requirements</Text>
              <Text style={styles.bulletText}>• Law enforcement requests</Text>
              <Text style={styles.bulletText}>• Internal record keeping</Text>
              <Text style={styles.sectionText}>Such information will only be retained for the period required by applicable law.</Text>
            </View>

            {/* 6. Effect of Account Deletion */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Effect of Account Deletion</Text>
              <Text style={styles.sectionText}>After account deletion:</Text>
              <Text style={styles.bulletText}>• You will lose access to your Bookfleet account.</Text>
              <Text style={styles.bulletText}>• Booking history may no longer be accessible.</Text>
              <Text style={styles.bulletText}>• Saved addresses and preferences will be removed.</Text>
              <Text style={styles.bulletText}>• Wallet balance (if applicable) may be forfeited unless otherwise required by law or Bookfleet policy.</Text>
              <Text style={styles.importantNote}>⚠️ The deletion process cannot generally be reversed.</Text>
            </View>

            {/* 7. Processing Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Processing Time</Text>
              <Text style={styles.sectionText}>
                Bookfleet will make reasonable efforts to process eligible data deletion requests within 30 days from successful identity verification, unless a longer period is required by applicable law or exceptional circumstances.
              </Text>
            </View>

            {/* 8. Third-Party Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
              <Text style={styles.sectionText}>
                Where your information has been shared with authorized service providers (such as payment processors or technology partners), deletion of such information will be subject to their respective legal and contractual obligations.
              </Text>
            </View>

            {/* 9. Policy Updates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Policy Updates</Text>
              <Text style={styles.sectionText}>
                Bookfleet may update this Data Deletion Policy from time to time.{'\n\n'}
                Any changes will be published on the Bookfleet website and applications.
              </Text>
            </View>

            {/* 10. Contact Us */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Contact Us</Text>
              <Text style={styles.sectionText}>For account deletion or privacy-related requests, please contact:</Text>
              <Text style={styles.sectionText}>Bookfleet Support</Text>
              <Text style={styles.contactText}>📧 support@bookfleet.in</Text>
              <Text style={styles.contactText}>🌐 www.bookfleet.in</Text>
              <Text style={styles.sectionText}>Legal Entity: Zipto Hyperlogistics Private Limited</Text>
              <Text style={styles.sectionText}>Registered Office:</Text>
              <Text style={styles.contactText}>📍 781, Shaheed Nagar,{'\n'}    780 Maharishi College Road,{'\n'}    Bhubaneswar, Khordha,{'\n'}    Odisha – 751007, India</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="delete-outline" size={ms(24)} color="#3B82F6" />
              <Text style={styles.acknowledgementText}>
                By using Bookfleet's services, you acknowledge that you have read and understood this Data Deletion Policy. © 2026 Zipto Hyperlogistics Private Limited.
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

export default DataDeletionPolicy;
