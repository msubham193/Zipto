import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs, SCREEN_WIDTH } from '../utils/metrics';

// ─── Brand Colors ─────────────────────────────────────────────────────────────
const BRAND_ORANGE = '#e45c33';
const BRAND_BLUE   = '#4c89dd';
const SLATE_900    = '#0F172A';
const SLATE_600    = '#475569';
const SLATE_400    = '#94A3B8';
const SLATE_200    = '#E2E8F0';
const SLATE_100    = '#F1F5F9';
const WHITE        = '#FFFFFF';
const BG           = '#F8FAFC';

// ─── Social Links Data ────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  {
    id:       'linkedin',
    label:    'LinkedIn',
    handle:   'ridezipto',
    icon:     'logo-linkedin',
    xLogo:    false,
    iconBg:   '#E8F0FE',
    iconColor:'#0A66C2',
    url:      'https://www.linkedin.com/company/zipto-com/',
  },
  {
    id:       'instagram',
    label:    'Instagram',
    handle:   '@ridezipto',
    icon:     'logo-instagram',
    xLogo:    false,
    iconBg:   '#FDF2F8',
    iconColor:'#C2185B',
    url:      'https://www.instagram.com/ridezipto?igsh=ZDNldGp6YjN2YXZx',
  },
  {
    id:       'twitter',
    label:    'X (Twitter)',
    handle:   '@ridezipto',
    icon:     null,
    xLogo:    true,
    iconBg:   '#000000',
    iconColor:'#FFFFFF',
    url:      'https://x.com/ridezipto',
  },
];

// ─── Zipto Wordmark ───────────────────────────────────────────────────────────
const ZiptoWordmark = () => (
  <View style={styles.wordmark}>
    <Text style={styles.wordmarkZ}>Z</Text>
    <Text style={styles.wordmarkRest}>ipto</Text>
  </View>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
const Divider = () => <View style={styles.divider} />;

// ─────────────────────────────────────────────────────────────────────────────

const AboutUs = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const stats = [
    { icon: 'local-shipping', label: 'Deliveries',   value: 'Growing Rapidly',       color: BRAND_BLUE },
    { icon: 'people',         label: 'Active Users', value: 'Trusted by Thousands',  color: '#10B981' },
    { icon: 'location-city',  label: 'Cities',       value: 'Growing Rapidly',       color: BRAND_ORANGE },
    { icon: 'store',          label: 'Partners',     value: 'Trusted by Thousands',  color: '#8B5CF6' },
  ];

  const features = [
    { icon: 'track-changes',   text: 'Real-time tracking for all deliveries' },
    { icon: 'verified-user',   text: 'Verified and trained delivery partners' },
    { icon: 'attach-money',    text: 'Competitive pricing with no hidden fees' },
    { icon: 'support-agent',   text: '24/7 customer support' },
    { icon: 'security',        text: 'Secure and encrypted transactions' },
    { icon: 'speed',           text: 'Delivery within minutes in your city.' },
  ];

  const values = [
    { icon: 'verified',     color: BRAND_BLUE,   text: 'Reliability & Trust' },
    { icon: 'favorite',     color: '#EF4444',    text: 'Customer First' },
    { icon: 'flash-on',     color: '#F59E0B',    text: 'Speed & Efficiency' },
    { icon: 'emoji-people', color: '#10B981',    text: 'Empowering Communities' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(22)} color={SLATE_900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About Us</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ── Hero ── */}
          <View style={styles.heroSection}>
            <ZiptoWordmark />
            <Text style={styles.tagline}>Fast. Reliable. Everywhere.</Text>
            <View style={styles.taglineLine} />
          </View>

          {/* ── Mission ── */}
          <View style={styles.section}>
            <SectionHeading icon="flag" color={BRAND_BLUE} title="Our Mission" />
            <Text style={styles.bodyText}>
              We started Zipto to solve local delivery problems in India — making it faster, cheaper, and more reliable for everyday users and businesses.
            </Text>
          </View>

          {/* ── What We Do ── */}
          <View style={styles.section}>
            <SectionHeading icon="info" color="#10B981" title="What We Do" />
            <Text style={styles.bodyText}>
              We offer on-demand pickup and delivery services for packages, documents, food,
              groceries, and more. With our network of verified delivery partners and advanced
              technology, we ensure your items reach their destination safely and on time, every time.
            </Text>
          </View>

          {/* ── Stats ── */}
          <View style={styles.section}>
            <SectionHeading icon="trending-up" color="#F59E0B" title="Our Impact" />
            <View style={styles.statsGrid}>
              {stats.map((stat, i) => (
                <View key={i} style={styles.statCard}>
                  <View style={[styles.statIconRing, { borderColor: stat.color + '30' }]}>
                    <MaterialIcons name={stat.icon} size={ms(26)} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Why Choose Us ── */}
          <View style={styles.section}>
            <SectionHeading icon="star" color="#8B5CF6" title="Why Choose Zipto?" />
            <View style={styles.featureList}>
              {features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureDot} />
                  <MaterialIcons name={f.icon} size={ms(18)} color="#10B981" style={styles.featureIcon} />
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Core Values ── */}
          <View style={styles.section}>
            <SectionHeading icon="verified" color={BRAND_ORANGE} title="Core Values" />
            <View style={styles.valuesGrid}>
              {values.map((v, i) => (
                <View key={i} style={styles.valueCard}>
                  <View style={[styles.valueIconRing, { backgroundColor: v.color + '15' }]}>
                    <MaterialIcons name={v.icon} size={ms(22)} color={v.color} />
                  </View>
                  <Text style={styles.valueText}>{v.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Contact ── */}
          <View style={styles.section}>
            <SectionHeading icon="contact-mail" color="#0EA5E9" title="Get In Touch" />
            <View style={styles.contactCard}>
              <ContactRow
                icon="email"
                iconColor={BRAND_BLUE}
                label="Email"
                value="contact@ridezipto.com"
                onPress={() => Linking.openURL('mailto:contact@ridezipto.com')}
              />
              <Divider />
              <ContactRow
                icon="phone"
                iconColor="#10B981"
                label="Phone"
                value="+91 90900 29996"
                onPress={() => Linking.openURL('tel:+919090029996')}
              />
              <Divider />
              <ContactRow
                icon="location-on"
                iconColor="#EF4444"
                label="Address"
                value="Bhubaneswar, Odisha 751007"
              />
            </View>
          </View>

          {/* ── Social ── */}
          <View style={styles.section}>
            <SectionHeading icon="share" color="#EC4899" title="Follow Us" />
            <View style={styles.socialCard}>
              {SOCIAL_LINKS.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.socialRow,
                    index === SOCIAL_LINKS.length - 1 && styles.socialRowLast,
                  ]}
                  onPress={() => item.url ? Linking.openURL(item.url) : null}
                  activeOpacity={0.7}
                >
                  <View style={[styles.socialIconBox, { backgroundColor: item.iconBg }]}>
                    {item.xLogo ? (
                      <Text style={[styles.xLogoText, { color: item.iconColor }]}>𝕏</Text>
                    ) : (
                      <Ionicons name={item.icon!} size={ms(19)} color={item.iconColor} />
                    )}
                  </View>
                  <View style={styles.socialTextBlock}>
                    <Text style={styles.socialPlatform}>{item.label}</Text>
                    <Text style={styles.socialHandle}>{item.handle}</Text>
                  </View>
                  <View style={styles.socialArrow}>
                    <Ionicons name="chevron-forward" size={ms(16)} color={SLATE_400} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.versionText}>Zipto v1.0.0</Text>
            <Text style={styles.copyrightText}>© 2025 Zipto Technologies Pvt. Ltd.</Text>
            <Text style={styles.copyrightText}>All rights reserved.</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionHeading = ({
  icon, color, title,
}: { icon: string; color: string; title: string }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIconBadge, { backgroundColor: color + '15' }]}>
      <MaterialIcons name={icon} size={ms(18)} color={color} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const ContactRow = ({
  icon, iconColor, label, value, onPress,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.contactRow}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.contactIconBox, { backgroundColor: iconColor + '12' }]}>
      <MaterialIcons name={icon} size={ms(20)} color={iconColor} />
    </View>
    <View style={styles.contactTextBlock}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    {onPress && (
      <MaterialIcons name="chevron-right" size={ms(20)} color={SLATE_400} />
    )}
  </TouchableOpacity>
);

// ─── Derived layout values ────────────────────────────────────────────────────
const GUTTER       = hs(20);
const CARD_GAP     = hs(10);
const STAT_CARD_W  = (SCREEN_WIDTH - GUTTER * 2 - CARD_GAP * 3) / 2;
const VALUE_CARD_W = STAT_CARD_W;

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: BG },
  safeArea:   { flex: 1 },

  // Header
  header: {
    flexDirection:      'row',
    alignItems:         'center',
    justifyContent:     'space-between',
    paddingHorizontal:  hs(16),
    paddingVertical:    vs(14),
    backgroundColor:    WHITE,
    borderBottomWidth:  1,
    borderBottomColor:  SLATE_200,
  },
  backButton: {
    width:           ms(40),
    height:          ms(40),
    borderRadius:    ms(10),
    backgroundColor: SLATE_100,
    justifyContent:  'center',
    alignItems:      'center',
  },
  headerTitle: {
    fontSize:      fs(18),
    fontWeight:    '700',
    fontFamily:    'Poppins-Regular',
    color:         SLATE_900,
    letterSpacing: 0.3,
  },
  placeholder: { width: ms(40) },

  scrollView:    { flex: 1 },
  scrollContent: { paddingHorizontal: GUTTER, paddingBottom: vs(40) },

  // ── Hero ──
  heroSection: {
    alignItems:    'center',
    paddingTop:    vs(40),
    paddingBottom: vs(32),
  },
  wordmark: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    marginBottom:  vs(10),
  },
  wordmarkZ: {
    fontSize:   fs(54),
    fontFamily: 'Cocon-Regular',
    color:      '#3B82F6',
    lineHeight: fs(58),
  },
  wordmarkRest: {
    fontSize:   fs(54),
    fontFamily: 'Cocon-Regular',
    color:      '#3B82F6',
    lineHeight: fs(58),
  },
  tagline: {
    fontSize:      fs(13),
    fontWeight:    '600',
    fontFamily:    'Poppins-Regular',
    color:         SLATE_400,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom:  vs(16),
  },
  taglineLine: {
    width:           hs(48),
    height:          3,
    borderRadius:    2,
    backgroundColor: '#3B82F6',
  },

  // ── Section ──
  section: { marginBottom: vs(28) },
  sectionHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           hs(10),
    marginBottom:  vs(14),
  },
  sectionIconBadge: {
    width:          ms(34),
    height:         ms(34),
    borderRadius:   ms(9),
    justifyContent: 'center',
    alignItems:     'center',
  },
  sectionTitle: {
    fontSize:      fs(17),
    fontWeight:    '700',
    fontFamily:    'Poppins-Regular',
    color:         SLATE_900,
    letterSpacing: 0.2,
  },
  bodyText: {
    fontSize:   fs(14),
    fontFamily: 'Poppins-Regular',
    color:      SLATE_600,
    lineHeight: fs(14) * 1.75,
  },

  // ── Stats ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           CARD_GAP,
  },
  statCard: {
    width:           STAT_CARD_W,
    backgroundColor: WHITE,
    padding:         ms(18),
    borderRadius:    ms(14),
    alignItems:      'center',
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
  },
  statIconRing: {
    width:          ms(52),
    height:         ms(52),
    borderRadius:   ms(26),
    borderWidth:    2,
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   vs(10),
  },
  statValue: {
    fontSize:     fs(13),   // ← reduced from fs(26)
    fontWeight:   '700',    // ← reduced from '800'
    fontFamily:   'Poppins-Regular',
    marginBottom: vs(2),
    textAlign:    'center',
  },
  statLabel: {
    fontSize:   fs(12),
    fontFamily: 'Poppins-Regular',
    color:      SLATE_400,
    fontWeight: '500',
  },

  // ── Features ──
  featureList: {
    backgroundColor: WHITE,
    borderRadius:    ms(14),
    overflow:        'hidden',
    elevation:       1,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    paddingVertical: vs(4),
  },
  featureRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: ms(16),
    paddingVertical:   vs(12),
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  featureDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: BRAND_ORANGE,
    marginRight:     hs(10),
  },
  featureIcon: { marginRight: hs(10) },
  featureText: {
    flex:       1,
    fontSize:   fs(13),
    fontFamily: 'Poppins-Regular',
    color:      SLATE_600,
    fontWeight: '500',
  },

  // ── Values ──
  valuesGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           CARD_GAP,
  },
  valueCard: {
    width:           VALUE_CARD_W,
    backgroundColor: WHITE,
    padding:         ms(16),
    borderRadius:    ms(14),
    alignItems:      'center',
    elevation:       1,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
  },
  valueIconRing: {
    width:          ms(48),
    height:         ms(48),
    borderRadius:   ms(24),
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   vs(8),
  },
  valueText: {
    fontSize:   fs(12),
    fontFamily: 'Poppins-Regular',
    color:      SLATE_600,
    fontWeight: '600',
    textAlign:  'center',
  },

  // ── Contact ──
  contactCard: {
    backgroundColor: WHITE,
    borderRadius:    ms(14),
    overflow:        'hidden',
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       ms(16),
  },
  contactIconBox: {
    width:          ms(42),
    height:         ms(42),
    borderRadius:   ms(11),
    justifyContent: 'center',
    alignItems:     'center',
    marginRight:    hs(12),
  },
  contactTextBlock: { flex: 1 },
  contactLabel: {
    fontSize:      fs(11),
    fontFamily:    'Poppins-Regular',
    color:         SLATE_400,
    marginBottom:  vs(2),
    fontWeight:    '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contactValue: {
    fontSize:   fs(13),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color:      SLATE_900,
  },
  divider: {
    height:          1,
    backgroundColor: SLATE_100,
    marginLeft:      ms(42) + hs(12) + ms(16),
  },

  // ── Social ──
  socialCard: {
    backgroundColor: WHITE,
    borderRadius:    ms(14),
    borderWidth:     1,
    borderColor:     SLATE_200,
    overflow:        'hidden',
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
  },
  socialRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   vs(14),
    paddingHorizontal: ms(16),
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    minHeight:         vs(60),
  },
  socialRowLast: { borderBottomWidth: 0 },
  socialIconBox: {
    width:          ms(36),
    height:         ms(36),
    borderRadius:   ms(10),
    justifyContent: 'center',
    alignItems:     'center',
    marginRight:    hs(14),
  },
  socialTextBlock: { flex: 1, marginRight: hs(8) },
  socialPlatform: {
    fontSize:      fs(15),
    fontWeight:    '600',
    fontFamily:    'Poppins-Regular',
    color:         SLATE_900,
    letterSpacing: -0.1,
  },
  socialHandle: {
    fontSize:   fs(12),
    fontFamily: 'Poppins-Regular',
    color:      BRAND_BLUE,
    fontWeight: '500',
    marginTop:  vs(2),
  },
  socialArrow: {
    width:           ms(28),
    height:          ms(28),
    borderRadius:    ms(8),
    backgroundColor: BG,
    justifyContent:  'center',
    alignItems:      'center',
  },
  xLogoText: {
    fontSize:   ms(16),
    fontWeight: '900',
    lineHeight: ms(20),
  },

  // ── Footer ──
  footer: {
    alignItems:    'center',
    paddingTop:    vs(20),
    paddingBottom: vs(10),
  },
  footerLine: {
    width:           hs(60),
    height:          2,
    borderRadius:    1,
    backgroundColor: SLATE_200,
    marginBottom:    vs(16),
  },
  versionText: {
    fontSize:     fs(12),
    fontWeight:   '600',
    fontFamily:   'Poppins-Regular',
    color:        SLATE_400,
    marginBottom: vs(4),
  },
  copyrightText: {
    fontSize:     fs(11),
    fontFamily:   'Poppins-Regular',
    color:        '#CBD5E1',
    marginBottom: vs(2),
  },
});

export default AboutUs;