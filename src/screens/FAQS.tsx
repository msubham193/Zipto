import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

const FAQs = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      category: '📦 Orders & Delivery',
      faqs: [
        {
          id: 1,
          question: 'How do I place an order?',
          answer:
            'To place an order, enter pickup and delivery locations, select your vehicle type, and confirm your booking. You\'ll get instant pricing before placing the order.',
        },
        {
          id: 2,
          question: 'How can I track my order?',
          answer:
            'You can track your delivery in real-time from the app. Once your order is assigned, you\'ll see live location updates of your delivery partner.',
        },
        {
          id: 3,
          question: 'How long does delivery take?',
          answer:
            'Delivery time depends on distance, traffic, and availability. Most deliveries are completed within a short time, and you\'ll see an estimated time before confirming.',
        },
        {
          id: 4,
          question: 'Can I cancel my order?',
          answer:
            'Yes, you can cancel your order before pickup without any charges. After pickup, cancellation charges may apply.',
        },
        {
          id: 5,
          question: 'What happens if I\'m not available at delivery?',
          answer:
            'If you\'re unavailable, the delivery partner will try to contact you. If unreachable, the order may be returned or cancelled.',
        },
        {
          id: 6,
          question: 'Can I contact the delivery partner?',
          answer:
            'Yes, once your order is confirmed, you\'ll be able to call or message the delivery partner directly from the app.',
        },
        {
          id: 7,
          question: 'What if my order is delayed?',
          answer:
            'Delays can happen due to traffic or weather. You can track your order live or contact support for assistance.',
        },
        {
          id: 8,
          question: 'What if my item is damaged or missing?',
          answer:
            'Please report the issue immediately through the app or support. We\'ll review and assist you as per our policy.',
        },
      ],
    },
    {
      category: '💰 Pricing & Payments',
      faqs: [
        {
          id: 9,
          question: 'What are the delivery charges?',
          answer:
            'Delivery charges depend on distance, time, and demand. You\'ll always see the final price before confirming your order.',
        },
        {
          id: 10,
          question: 'What payment methods are accepted?',
          answer:
            'We accept UPI, debit/credit cards, net banking, wallet balance, and cash on delivery (if available).',
        },
        {
          id: 11,
          question: 'How do I add money to my wallet?',
          answer:
            'You can add money through UPI, cards, or net banking directly from the wallet section in the app.',
        },
        {
          id: 12,
          question: 'Are there any hidden charges?',
          answer:
            'No. All charges are shown upfront before you confirm your order.',
        },
        {
          id: 13,
          question: 'How do refunds work?',
          answer:
            'Refunds are initiated within 24–48 hours after cancellation or issue resolution. The actual time depends on your bank or payment provider.',
        },
      ],
    },
    {
      category: '🔐 Safety & Security',
      faqs: [
        {
          id: 14,
          question: 'Is my payment information safe?',
          answer:
            'Yes, all payments are processed securely through trusted payment partners. We do not store your card details.',
        },
        {
          id: 15,
          question: 'Are delivery partners verified?',
          answer:
            'Yes, all delivery partners go through a verification and onboarding process before joining bookfleet.',
        },
        {
          id: 16,
          question: 'Is my personal data safe?',
          answer:
            'We take your privacy seriously and protect your data using industry-standard security practices.',
        },
      ],
    },
    {
      category: '👤 Account & Profile',
      faqs: [
        {
          id: 17,
          question: 'How do I change my phone number?',
          answer:
            'You can update your phone number from the profile settings or contact support for assistance.',
        },
        {
          id: 18,
          question: 'How do I delete my account?',
          answer:
            'You can request account deletion from settings or by contacting our support team.',
        },
        {
          id: 19,
          question: "I'm not receiving OTP, what should I do?",
          answer:
            'Please check your network, wait a few seconds, or try again. If the issue continues, contact support.',
        },
      ],
    },
    {
      category: '🚫 Restrictions & Policies',
      faqs: [
        {
          id: 20,
          question: 'What items are not allowed?',
          answer:
            'We do not deliver illegal, hazardous, or prohibited items such as drugs, weapons, or unsafe materials.',
        },
        {
          id: 21,
          question: 'Can I send fragile items?',
          answer:
            'Yes, but proper packaging is required. Bookfleet is not responsible for damage due to poor packaging.',
        },
      ],
    },
    {
      category: '📞 Support',
      faqs: [
        {
          id: 22,
          question: 'How can I contact Bookfleet support?',
          answer:
            'You can reach us via in-app chat, phone support, or email support.',
        },
        {
          id: 23,
          question: 'I still need help, what should I do?',
          answer:
            "If your question isn't listed here, please contact our support team. We're here to help!",
        },
      ],
    },
  ];

  const toggleFaq = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredCategories = faqCategories
    .map(category => ({
      ...category,
      faqs: category.faqs.filter(
        faq =>
          searchQuery.trim() === '' ||
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter(category => category.faqs.length > 0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQs</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={ms(20)} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for questions..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={ms(20)} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* FAQ Header */}
          <View style={styles.faqHeaderSection}>
            <Text style={styles.faqMainTitle}>Frequently Asked Questions</Text>
            <Text style={styles.faqSubtitle}>
              Find answers to common questions about using Bookfleet
            </Text>
          </View>

          {/* FAQ Categories */}
          {filteredCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              {category.faqs.map(faq => (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqCard}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqQuestion}>
                    <View style={styles.questionIconContainer}>
                      <MaterialIcons name="help-outline" size={ms(20)} color="#3B82F6" />
                    </View>
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    <MaterialIcons
                      name={expandedId === faq.id ? 'expand-less' : 'expand-more'}
                      size={ms(24)}
                      color="#64748B"
                    />
                  </View>
                  {expandedId === faq.id && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* No results */}
          {filteredCategories.length === 0 && (
            <View style={styles.noResultsContainer}>
              <MaterialIcons name="search-off" size={ms(48)} color="#CBD5E1" />
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsSubText}>
                Try a different keyword or contact support
              </Text>
            </View>
          )}

          {/* Still Have Questions Card */}
          <View style={styles.helpCard}>
            <View style={styles.helpIconContainer}>
              <MaterialIcons name="support-agent" size={ms(32)} color="#3B82F6" />
            </View>
            <Text style={styles.helpCardTitle}>Still have questions?</Text>
            <Text style={styles.helpCardDesc}>
              Our support team is here to help you 24/7
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => navigation.navigate('Support')}
            >
              <MaterialIcons name="chat" size={ms(18)} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize       = ms(40);
const questionIconSize  = ms(36);
const helpIconSize      = ms(72);
const answerPaddingLeft = questionIconSize + hs(10);

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

  scrollView: { flex: 1 },
  scrollContent: { padding: hs(16) },

  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hs(16),
    paddingVertical: vs(12),
    borderRadius: ms(12),
    marginBottom: vs(20),
    gap: hs(10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: fs(15),
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },

  // ── FAQ Header ──
  faqHeaderSection: { marginBottom: vs(24) },
  faqMainTitle: {
    fontSize: fs(22),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: vs(8),
  },
  faqSubtitle: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    lineHeight: fs(14) * 1.5,
  },

  // ── Categories ──
  categorySection: { marginBottom: vs(24) },
  categoryTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: vs(12),
  },

  // ── FAQ Card ──
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(16),
    marginBottom: vs(10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionIconContainer: {
    width: questionIconSize,
    height: questionIconSize,
    borderRadius: questionIconSize / 2,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hs(10),
  },
  faqQuestionText: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginRight: hs(8),
  },
  faqAnswerContainer: {
    marginTop: vs(12),
    paddingTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswer: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    lineHeight: fs(14) * 1.6,
    paddingLeft: answerPaddingLeft,
  },

  // ── No Results ──
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: vs(40),
  },
  noResultsText: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
    marginTop: vs(12),
  },
  noResultsSubText: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#CBD5E1',
    marginTop: vs(4),
  },

  // ── Help Card ──
  helpCard: {
    backgroundColor: '#FFFFFF',
    padding: ms(24),
    borderRadius: ms(16),
    alignItems: 'center',
    marginTop: vs(8),
    marginBottom: vs(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpIconContainer: {
    width: helpIconSize,
    height: helpIconSize,
    borderRadius: helpIconSize / 2,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  helpCardTitle: {
    fontSize: fs(18),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: vs(8),
  },
  helpCardDesc: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: vs(20),
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(8),
    backgroundColor: '#3B82F6',
    paddingHorizontal: hs(24),
    paddingVertical: vs(12),
    borderRadius: ms(10),
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  contactButtonText: {
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
});

export default FAQs;