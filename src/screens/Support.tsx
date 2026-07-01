import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
} from 'react-native';
import { showAlert } from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F0F4FF',
  border:       '#E8ECF4',
  borderLight:  '#F1F5F9',
  ink:          '#111827',
  inkMid:       '#4B5563',
  inkLight:     '#9CA3AF',
  accent:       '#2563EB',
  accentLight:  '#EEF3FF',
  green:        '#059669',
  greenLight:   '#ECFDF5',
  amber:        '#D97706',
  amberLight:   '#FFFBEB',
  whatsapp:     '#16A34A',
  whatsappLt:   '#F0FDF4',
  purple:       '#7C3AED',
  purpleLight:  '#F5F3FF',
  rose:         '#E11D48',
  roseLight:    '#FFF1F2',
  pink:         '#DB2777',
  pinkLight:    '#FDF4FF',
};
// ─────────────────────────────────────────────────────────────────────────────

const FadeInView = ({ delay = 0, children }: { delay?: number; children: React.ReactNode }) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Pill badge ───────────────────────────────────────────────────────────────
const Badge = ({ label, color }: { label: string; color: string }) => (
  <View style={[badgeStyle.wrap, { backgroundColor: color + '18' }]}>
    <View style={[badgeStyle.dot, { backgroundColor: color }]} />
    <Text style={[badgeStyle.text, { color }]}>{label}</Text>
  </View>
);
const badgeStyle = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: hs(10), paddingVertical: vs(4),
    borderRadius: 999, gap: hs(5),
  },
  dot:  { width: ms(6), height: ms(6), borderRadius: 99 },
  text: { fontSize: fs(11), fontFamily: 'Poppins-SemiBold', letterSpacing: 0.3 },
});
// ─────────────────────────────────────────────────────────────────────────────

const Support = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const contactOptions = [
    {
      id: 1, title: 'Live Chat',
      icon: 'chat-bubble-outline',
      desc: 'Average response under 2 min',
      badge: 'Online Now', badgeColor: COLORS.green,
      accent: COLORS.accent, light: COLORS.accentLight,
      onPress: () => showAlert('Coming Soon', 'Live chat will be available soon.'),
    },
    {
      id: 2, title: 'Call Support',
      icon: 'phone',
      desc: '+91 90900 29996',
      badge: '10:00 AM - 7 PM', badgeColor: COLORS.green,
      accent: COLORS.green, light: COLORS.greenLight,
      onPress: () => Linking.openURL('tel:+919090029996'),
    },
    {
      id: 3, title: 'Email Us',
      icon: 'mail-outline',
      desc: 'support@bookfleet.in',
      badge: '24/7', badgeColor: COLORS.amber,
      accent: COLORS.amber, light: COLORS.amberLight,
      onPress: () => Linking.openURL('mailto:support@bookfleet.in'),
    },
    {
      id: 4, title: 'WhatsApp',
      icon: 'message',
      desc: 'Tap to Chat',
      badge: 'Quick Response', badgeColor: COLORS.whatsapp,
      accent: COLORS.whatsapp, light: COLORS.whatsappLt,
      onPress: () => Linking.openURL('https://wa.me/919090029996'),
    },
  ];

  // Self-service items — kept for easy re-enable
  /*
  const quickHelp = [
    { id: 1, icon: 'help-outline',  title: 'Help Center',      desc: 'FAQs & guides',  accent: COLORS.purple, light: COLORS.purpleLight },
    { id: 2, icon: 'flag',          title: 'Report a Problem', desc: 'Flag a problem', accent: COLORS.rose,   light: COLORS.roseLight  },
    { id: 3, icon: 'rate-review',   title: 'Feedback',         desc: 'Share thoughts', accent: COLORS.pink,   light: COLORS.pinkLight  },
  ];
  */

  const hours = [
    { label: 'Monday – Sunday',   value: '10:00 AM – 7:00 PM' },
    // { label: 'Saturday – Sunday', value: '10:00 AM – 6:00 PM' },
    { label: 'Emergency Line',    value: '24 / 7 Available' },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={ms(20)} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support</Text>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
            <MaterialIcons name="help-outline" size={ms(20)} color={COLORS.inkMid} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ── Hero ── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroIconRing}>
                <View style={styles.heroIconInner}>
                  <MaterialIcons name="support-agent" size={ms(34)} color={COLORS.accent} />
                </View>
              </View>
              <Text style={styles.heroTitle}>How can we help?</Text>
              <Text style={styles.heroSub}>Our team is available around the clock to assist you with anything you need.</Text>
              <Badge label="● All systems operational" color={COLORS.green} />
            </View>
          </FadeInView>

          {/* ── Contact channels label ── */}
          <FadeInView delay={80}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>CONTACT CHANNELS</Text>
            </View>
          </FadeInView>

          {/* ── Contact cards ── */}
          {contactOptions.map((opt, i) => (
            <FadeInView key={opt.id} delay={120 + i * 60}>
              <TouchableOpacity style={styles.contactCard} onPress={opt.onPress} activeOpacity={0.75}>
                <View style={[styles.contactIconWrap, { backgroundColor: opt.light }]}>
                  <MaterialIcons name={opt.icon} size={ms(22)} color={opt.accent} />
                </View>
                <View style={styles.contactBody}>
                  <Text style={styles.contactTitle}>{opt.title}</Text>
                  <Text style={styles.contactDesc}>{opt.desc}</Text>
                </View>
                <View style={styles.contactRight}>
                  <Badge label={opt.badge} color={opt.badgeColor} />
                  <MaterialIcons name="chevron-right" size={ms(18)} color={COLORS.inkLight} style={{ marginTop: vs(6) }} />
                </View>
              </TouchableOpacity>
            </FadeInView>
          ))}

          {/* ── Self-Service section — commented out, re-enable when Help Center,
              Report a Problem & Feedback screens are ready ──
          <FadeInView delay={380}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SELF-SERVICE</Text>
            </View>
            <View style={styles.quickRow}>
              {quickHelp.map(item => (
                <TouchableOpacity key={item.id} style={styles.quickCard} activeOpacity={0.75}>
                  <View style={[styles.quickIconWrap, { backgroundColor: item.light }]}>
                    <MaterialIcons name={item.icon} size={ms(22)} color={item.accent} />
                  </View>
                  <Text style={styles.quickTitle}>{item.title}</Text>
                  <Text style={styles.quickDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInView>
          */}

          {/* ── Hours ── */}
          <FadeInView delay={440}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconSmall, { backgroundColor: COLORS.accentLight }]}>
                  <MaterialIcons name="schedule" size={ms(16)} color={COLORS.accent} />
                </View>
                <Text style={styles.cardTitle}>Support Hours</Text>
              </View>
              {hours.map((row, i) => (
                <View
                  key={i}
                  style={[styles.hoursRow, i === hours.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}
                >
                  <Text style={styles.hoursLabel}>{row.label}</Text>
                  <Text style={[styles.hoursValue, row.label === 'Emergency Line' && { color: COLORS.green }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Address ── */}
          <FadeInView delay={500}>
            <View style={[styles.card, { marginBottom: vs(32) }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconSmall, { backgroundColor: COLORS.roseLight }]}>
                  <MaterialIcons name="location-on" size={ms(16)} color={COLORS.rose} />
                </View>
                <Text style={styles.cardTitle}>Office Address</Text>
              </View>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLine}>Bookfleet Headquarters</Text>
                <Text style={styles.addressSub}>Bhubaneswar, Odisha – 751007, India</Text>
              </View>
              {/* <TouchableOpacity style={styles.directionsBtn} activeOpacity={0.75}>
                <MaterialIcons name="directions" size={ms(16)} color={COLORS.accent} />
                <Text style={styles.directionsText}>Get Directions</Text>
              </TouchableOpacity> */}
            </View>
          </FadeInView>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived sizes ────────────────────────────────────────────────────────────
const BTN_SIZE     = ms(40);
const HERO_RING    = ms(96);
const HERO_INNER   = ms(68);
const CONTACT_ICON = ms(48);
const QUICK_ICON   = ms(52);
const CARD_ICON_SM = ms(34);

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hs(20),
    paddingVertical: vs(14),
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: BTN_SIZE, height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: fs(17),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.ink,
    letterSpacing: 0.1,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: hs(20), paddingTop: vs(28) },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    marginBottom: vs(32),
  },
  heroIconRing: {
    width: HERO_RING, height: HERO_RING,
    borderRadius: HERO_RING / 2,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(20),
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  heroIconInner: {
    width: HERO_INNER, height: HERO_INNER,
    borderRadius: HERO_INNER / 2,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: {
    fontSize: fs(26),
    fontFamily: 'Poppins-Bold',
    color: COLORS.ink,
    marginBottom: vs(10),
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: COLORS.inkMid,
    textAlign: 'center',
    lineHeight: fs(14) * 1.65,
    marginBottom: vs(18),
    paddingHorizontal: hs(12),
  },

  // ── Section label ────────────────────────────────────────────────────────────
  sectionHeader: {
    marginBottom: vs(12),
  },
  sectionLabel: {
    fontSize: fs(10),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.inkLight,
    letterSpacing: 1.4,
  },

  // ── Contact card ─────────────────────────────────────────────────────────────
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: ms(14),
    paddingVertical: vs(14),
    paddingHorizontal: hs(14),
    marginBottom: vs(10),
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  contactIconWrap: {
    width: CONTACT_ICON, height: CONTACT_ICON,
    borderRadius: ms(12),
    justifyContent: 'center', alignItems: 'center',
    marginRight: hs(14),
    flexShrink: 0,
  },
  contactBody:  { flex: 1 },
  contactTitle: {
    fontSize: fs(15),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.ink,
    marginBottom: vs(2),
  },
  contactDesc: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: COLORS.inkMid,
  },
  contactRight: {
    alignItems: 'flex-end',
    marginLeft: hs(8),
  },

  // ── Quick help styles — kept for easy re-enable ───────────────────────────────
  quickRow: {
    flexDirection: 'row',
    gap: hs(10),
    marginBottom: vs(24),
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: ms(14),
    padding: ms(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quickIconWrap: {
    width: QUICK_ICON, height: QUICK_ICON,
    borderRadius: ms(13),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(10),
  },
  quickTitle: {
    fontSize: fs(12),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: vs(3),
  },
  quickDesc: {
    fontSize: fs(10),
    fontFamily: 'Poppins-Regular',
    color: COLORS.inkLight,
    textAlign: 'center',
  },

  // ── Shared card ──────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: ms(14),
    padding: ms(18),
    marginBottom: vs(14),
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(10),
    marginBottom: vs(16),
  },
  cardIconSmall: {
    width: CARD_ICON_SM, height: CARD_ICON_SM,
    borderRadius: ms(10),
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: {
    fontSize: fs(15),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.ink,
  },

  // ── Hours ────────────────────────────────────────────────────────────────────
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(11),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  hoursLabel: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: COLORS.inkMid,
  },
  hoursValue: {
    fontSize: fs(13),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.ink,
  },

  // ── Address ──────────────────────────────────────────────────────────────────
  addressBlock: {
    marginBottom: vs(16),
    paddingLeft: hs(2),
  },
  addressLine: {
    fontSize: fs(14),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.ink,
    marginBottom: vs(4),
  },
  addressSub: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: COLORS.inkMid,
    lineHeight: fs(13) * 1.7,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    paddingVertical: vs(11),
    backgroundColor: COLORS.accentLight,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  directionsText: {
    fontSize: fs(13),
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.accent,
    letterSpacing: 0.2,
  },
});

export default Support;