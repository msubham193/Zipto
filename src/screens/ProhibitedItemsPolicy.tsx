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

const ProhibitedItemsPolicy = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prohibited Items</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.legalContent}>
            <Text style={styles.legalTitle}>Bookfleet Prohibited Items Policy</Text>
            <Text style={styles.legalUpdate}>Last Updated: June 2026</Text>

            {/* 1. Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Introduction</Text>
              <Text style={styles.sectionText}>
                This Prohibited Items Policy outlines the categories of goods and materials that must not be booked, transported, or delivered through the Bookfleet platform operated by Zipto Hyperlogistics Private Limited ("Bookfleet", "Company", "we", "our", or "us").{'\n\n'}
                Customers are solely responsible for ensuring that every shipment complies with applicable laws and this Policy.
              </Text>
            </View>

            {/* 2. Prohibited Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Prohibited Items</Text>
              <Text style={styles.sectionText}>The following items are strictly prohibited from being transported through Bookfleet:</Text>

              <Text style={styles.subSectionTitle}>Illegal Goods</Text>
              <Text style={styles.bulletText}>• Narcotic drugs and psychotropic substances</Text>
              <Text style={styles.bulletText}>• Counterfeit products</Text>
              <Text style={styles.bulletText}>• Smuggled goods</Text>
              <Text style={styles.bulletText}>• Stolen property</Text>
              <Text style={styles.bulletText}>• Any item prohibited under Indian law</Text>

              <Text style={styles.subSectionTitle}>Dangerous & Hazardous Materials</Text>
              <Text style={styles.bulletText}>• Explosives</Text>
              <Text style={styles.bulletText}>• Fireworks</Text>
              <Text style={styles.bulletText}>• Ammunition</Text>
              <Text style={styles.bulletText}>• Flammable liquids or gases</Text>
              <Text style={styles.bulletText}>• Toxic chemicals</Text>
              <Text style={styles.bulletText}>• Corrosive substances</Text>
              <Text style={styles.bulletText}>• Radioactive materials</Text>
              <Text style={styles.bulletText}>• Biohazardous materials</Text>

              <Text style={styles.subSectionTitle}>Weapons</Text>
              <Text style={styles.bulletText}>• Firearms</Text>
              <Text style={styles.bulletText}>• Rifles</Text>
              <Text style={styles.bulletText}>• Pistols</Text>
              <Text style={styles.bulletText}>• Air guns</Text>
              <Text style={styles.bulletText}>• Swords</Text>
              <Text style={styles.bulletText}>• Explosive devices</Text>
              <Text style={styles.bulletText}>• Weapon parts prohibited by law</Text>

              <Text style={styles.subSectionTitle}>Restricted Medicines</Text>
              <Text style={styles.bulletText}>• Prescription medicines without valid authorization (where required)</Text>
              <Text style={styles.bulletText}>• Illegal drugs</Text>
              <Text style={styles.bulletText}>• Controlled substances</Text>
              <Text style={styles.bulletText}>• Medical waste</Text>

              <Text style={styles.subSectionTitle}>Cash & Financial Instruments</Text>
              <Text style={styles.bulletText}>• Currency notes</Text>
              <Text style={styles.bulletText}>• Coins</Text>
              <Text style={styles.bulletText}>• Cheques</Text>
              <Text style={styles.bulletText}>• Demand Drafts</Text>
              <Text style={styles.bulletText}>• Credit/Debit Cards</Text>
              <Text style={styles.bulletText}>• Gift Cards</Text>
              <Text style={styles.bulletText}>• Precious securities</Text>

              <Text style={styles.subSectionTitle}>Valuable Items</Text>
              <Text style={styles.bulletText}>• Gold</Text>
              <Text style={styles.bulletText}>• Silver</Text>
              <Text style={styles.bulletText}>• Diamonds</Text>
              <Text style={styles.bulletText}>• Precious stones</Text>
              <Text style={styles.bulletText}>• Jewellery</Text>
              <Text style={styles.bulletText}>• High-value collectibles</Text>
              <Text style={styles.bulletText}>• Antiques</Text>

              <Text style={styles.subSectionTitle}>Live Animals & Wildlife</Text>
              <Text style={styles.bulletText}>• Live animals</Text>
              <Text style={styles.bulletText}>• Birds</Text>
              <Text style={styles.bulletText}>• Reptiles</Text>
              <Text style={styles.bulletText}>• Wildlife</Text>
              <Text style={styles.bulletText}>• Animal organs</Text>
              <Text style={styles.bulletText}>• Protected species</Text>

              <Text style={styles.subSectionTitle}>Human Remains</Text>
              <Text style={styles.bulletText}>• Human organs</Text>
              <Text style={styles.bulletText}>• Human remains</Text>
              <Text style={styles.bulletText}>• Biological samples</Text>
              <Text style={styles.bulletText}>• Medical specimens requiring special handling</Text>

              <Text style={styles.subSectionTitle}>Adult & Illegal Content</Text>
              <Text style={styles.bulletText}>• Obscene materials</Text>
              <Text style={styles.bulletText}>• Pornographic content</Text>
              <Text style={styles.bulletText}>• Any material prohibited under applicable laws</Text>

              <Text style={styles.subSectionTitle}>Other Restricted Items</Text>
              <Text style={styles.bulletText}>• Perishable goods requiring special storage unless specifically supported by Bookfleet</Text>
              <Text style={styles.bulletText}>• Items emitting strong odours</Text>
              <Text style={styles.bulletText}>• Leaking packages</Text>
              <Text style={styles.bulletText}>• Unsafe or improperly packed goods</Text>
              <Text style={styles.bulletText}>• Any shipment considered unsafe by Bookfleet</Text>
            </View>

            {/* 3. Customer Responsibility */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Customer Responsibility</Text>
              <Text style={styles.sectionText}>Customers are solely responsible for:</Text>
              <Text style={styles.bulletText}>• Ensuring shipment contents are lawful.</Text>
              <Text style={styles.bulletText}>• Properly packing items.</Text>
              <Text style={styles.bulletText}>• Providing accurate shipment information.</Text>
              <Text style={styles.bulletText}>• Complying with all applicable laws and regulations.</Text>
              <Text style={styles.importantNote}>⚠️ Customers must not conceal prohibited items inside other packages.</Text>
            </View>

            {/* 4. Inspection Rights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Inspection Rights</Text>
              <Text style={styles.sectionText}>Bookfleet reserves the right to:</Text>
              <Text style={styles.bulletText}>• Refuse any shipment.</Text>
              <Text style={styles.bulletText}>• Cancel any booking.</Text>
              <Text style={styles.bulletText}>• Request additional shipment information.</Text>
              <Text style={styles.bulletText}>• Report suspicious shipments to appropriate authorities where required by law.</Text>
              <Text style={styles.sectionText}>Bookfleet may refuse transportation if it reasonably believes a shipment violates this Policy or applicable laws.</Text>
            </View>

            {/* 5. Consequences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Consequences of Violation</Text>
              <Text style={styles.sectionText}>Violation of this Policy may result in:</Text>
              <Text style={styles.bulletText}>• Immediate cancellation of the booking.</Text>
              <Text style={styles.bulletText}>• Suspension or permanent termination of the customer account.</Text>
              <Text style={styles.bulletText}>• Refusal of future services.</Text>
              <Text style={styles.bulletText}>• Reporting to law enforcement or regulatory authorities where required.</Text>
              <Text style={styles.bulletText}>• Recovery of any losses or damages suffered by Bookfleet, where permitted by law.</Text>
            </View>

            {/* 6. Limitation of Liability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
              <Text style={styles.sectionText}>
                Bookfleet is a technology platform that connects customers with independent delivery partners.{'\n\n'}
                Bookfleet does not verify the contents of every shipment and shall not be liable for any prohibited or illegal items submitted by customers.{'\n\n'}
                Customers remain solely responsible for the legality, safety, and compliance of all items transported using the Bookfleet platform.
              </Text>
            </View>

            {/* 7. Policy Updates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Policy Updates</Text>
              <Text style={styles.sectionText}>
                Bookfleet may update this Prohibited Items Policy from time to time.{'\n\n'}
                The latest version will always be available on the Bookfleet website and applications.
              </Text>
            </View>

            {/* 8. Contact Us */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Contact Us</Text>
              <Text style={styles.sectionText}>For questions regarding this Prohibited Items Policy, please contact:</Text>
              <Text style={styles.sectionText}>Bookfleet Support</Text>
              <Text style={styles.contactText}>📧 support@bookfleet.in</Text>
              <Text style={styles.contactText}>🌐 www.bookfleet.in</Text>
              <Text style={styles.sectionText}>Legal Entity: Zipto Hyperlogistics Private Limited</Text>
              <Text style={styles.sectionText}>Registered Office:</Text>
              <Text style={styles.contactText}>📍 781, Shaheed Nagar,{'\n'}    780 Maharishi College Road,{'\n'}    Bhubaneswar, Khordha,{'\n'}    Odisha – 751007, India</Text>
            </View>

            <View style={styles.acknowledgementCard}>
              <MaterialIcons name="block" size={ms(24)} color="#EF4444" />
              <Text style={styles.acknowledgementText}>
                By using Bookfleet's services, you agree to comply with this Prohibited Items Policy. Violations may result in immediate account termination and legal action. © 2026 Zipto Hyperlogistics Private Limited.
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
    marginTop: vs(12),
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
    backgroundColor: '#FEF2F2',
    padding: ms(16),
    borderRadius: ms(12),
    gap: hs(12),
    marginTop: vs(8),
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    alignItems: 'flex-start',
  },
  acknowledgementText: {
    flex: 1,
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#991B1B',
    lineHeight: fs(13) * 1.55,
  },
});

export default ProhibitedItemsPolicy;
