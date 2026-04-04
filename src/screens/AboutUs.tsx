import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
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

// Base dimensions (designed on 390×844 – iPhone 14)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/** Scale a size relative to screen width */
const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;

/** Scale a size relative to screen height */
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

/**
 * Moderate scale – less aggressive than linear scaling.
 * factor 0.5 = halfway between fixed and fully-scaled.
 */
const ms = (size: number, factor = 0.45) =>
  size + (scaleW(size) - size) * factor;

/** Scale font sizes and round to nearest pixel */
const fs = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));

// ─────────────────────────────────────────────────────────────────────────────

const AboutUs = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const stats = [
    { icon: 'local-shipping', label: 'Deliveries', value: '1M+', color: '#3B82F6' },
    { icon: 'people', label: 'Active Users', value: '50K+', color: '#10B981' },
    { icon: 'location-city', label: 'Cities', value: '25+', color: '#F59E0B' },
    { icon: 'store', label: 'Partners', value: '5K+', color: '#8B5CF6' },
  ];

  const features = [
    { icon: 'track-changes', text: 'Real-time tracking for all deliveries' },
    { icon: 'verified-user', text: 'Verified and trained delivery partners' },
    { icon: 'attach-money', text: 'Competitive pricing with no hidden fees' },
    { icon: 'support-agent', text: '24/7 customer support' },
    { icon: 'security', text: 'Secure and encrypted transactions' },
    { icon: 'speed', text: 'Fast and reliable delivery service' },
  ];

  const team = [
    { name: 'Leadership Team', role: 'Driving innovation in delivery', icon: 'groups' },
    { name: 'Technology', role: 'Building cutting-edge solutions', icon: 'code' },
    { name: 'Operations', role: 'Ensuring smooth deliveries', icon: 'settings' },
    { name: 'Support', role: 'Always here to help you', icon: 'headset-mic' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About Us</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/logo_zipto.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Zipto</Text>
            <Text style={styles.tagline}>Fast. Reliable. Everywhere.</Text>
          </View>

          {/* Mission Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="flag" size={ms(24)} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Our Mission</Text>
            </View>
            <Text style={styles.sectionText}>
              At Zipto, we're revolutionizing last-mile delivery across India. Our mission is to
              provide fast, reliable, and affordable delivery services that connect businesses and
              customers seamlessly. We believe in empowering local economies while delivering
              exceptional service.
            </Text>
          </View>

          {/* What We Do Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="info" size={ms(24)} color="#10B981" />
              <Text style={styles.sectionTitle}>What We Do</Text>
            </View>
            <Text style={styles.sectionText}>
              We offer on-demand pickup and delivery services for packages, documents, food,
              groceries, and more. With our network of verified delivery partners and advanced
              technology, we ensure your items reach their destination safely and on time, every
              time.
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="trending-up" size={ms(24)} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Our Impact</Text>
            </View>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: `${stat.color}15` },
                    ]}
                  >
                    <MaterialIcons name={stat.icon} size={ms(32)} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Why Choose Us Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="star" size={ms(24)} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Why Choose Zipto?</Text>
            </View>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <MaterialIcons name={feature.icon} size={ms(20)} color="#10B981" />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Our Team Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="people" size={ms(24)} color="#EC4899" />
              <Text style={styles.sectionTitle}>Our Team</Text>
            </View>
            <View style={styles.teamGrid}>
              {team.map((member, index) => (
                <View key={index} style={styles.teamCard}>
                  <View style={styles.teamIconContainer}>
                    <MaterialIcons name={member.icon} size={ms(28)} color="#3B82F6" />
                  </View>
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="contact-mail" size={ms(24)} color="#0EA5E9" />
              <Text style={styles.sectionTitle}>Get In Touch</Text>
            </View>
            <View style={styles.contactCard}>
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL('mailto:support@zipto.com')}
              >
                <View style={styles.contactIconContainer}>
                  <MaterialIcons name="email" size={ms(20)} color="#3B82F6" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>contact@ridezipto.com</Text>
                </View>
                <MaterialIcons name="chevron-right" size={ms(24)} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.contactDivider} />

              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL('tel:+919090029996')}
              >
                <View style={styles.contactIconContainer}>
                  <MaterialIcons name="phone" size={ms(20)} color="#10B981" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>+91 9090029996</Text>
                </View>
                <MaterialIcons name="chevron-right" size={ms(24)} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.contactDivider} />

              <TouchableOpacity style={styles.contactItem}>
                <View style={styles.contactIconContainer}>
                  <MaterialIcons name="location-on" size={ms(20)} color="#EF4444" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Address</Text>
                  <Text style={styles.contactValue}>
                   Plot No-781, Maharishi College Rd, in front of DN Kingsland, Saheed Nagar, Bhubaneswar, Odisha 751007
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={ms(24)} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="share" size={ms(24)} color="#EC4899" />
              <Text style={styles.sectionTitle}>Follow Us</Text>
            </View>
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
              >
                <MaterialIcons name="facebook" size={ms(24)} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]}
              >
                <MaterialIcons name="twitter" size={ms(24)} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
              >
                <MaterialIcons name="instagram" size={ms(24)} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#0A66C2' }]}
              >
                <MaterialIcons name="linkedin" size={ms(24)} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#25D366' }]}
              >
                <MaterialIcons name="whatsapp" size={ms(24)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Values Section */}
          <View style={styles.valuesCard}>
            <Text style={styles.valuesTitle}>Our Core Values</Text>
            <View style={styles.valueItem}>
              <MaterialIcons name="verified" size={ms(20)} color="#3B82F6" />
              <Text style={styles.valueText}>Reliability & Trust</Text>
            </View>
            <View style={styles.valueItem}>
              <MaterialIcons name="favorite" size={ms(20)} color="#EF4444" />
              <Text style={styles.valueText}>Customer First</Text>
            </View>
            <View style={styles.valueItem}>
              <MaterialIcons name="flash-on" size={ms(20)} color="#F59E0B" />
              <Text style={styles.valueText}>Speed & Efficiency</Text>
            </View>
            <View style={styles.valueItem}>
              <MaterialIcons name="emoji-people" size={ms(20)} color="#10B981" />
              <Text style={styles.valueText}>Empowering Communities</Text>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.versionText}>Zipto v1.0.0</Text>
            <Text style={styles.copyrightText}>© 2025 Zipto Technologies Pvt. Ltd.</Text>
            <Text style={styles.copyrightText}>All rights reserved.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const logoSize        = ms(140);
const statCardMinW    = (SCREEN_WIDTH - scaleW(20) * 2 - scaleW(12)) / 2; // 2-col grid
const teamCardMinW    = statCardMinW;
const socialBtnSize   = ms(56);
const statIconSize    = ms(64);
const teamIconSize    = ms(56);
const contactIconSize = ms(44);
const featureIconSize = ms(36);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
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
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
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
  placeholder: {
    width: ms(40),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scaleW(20),
  },

  // ── Logo ──
  logoSection: {
    alignItems: 'center',
    paddingVertical: scaleH(32),
    marginBottom: scaleH(16),
  },
  logoContainer: {
    width: logoSize,
    height: logoSize,
    borderRadius: logoSize / 2,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(20),
    borderWidth: ms(4),
    borderColor: '#BFDBFE',
    padding: ms(30),
  },
  logoImage: {
    width: '140%',
    height: '140%',
  },
  appName: {
    fontSize: fs(36),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#e45c33',
    marginBottom: scaleH(8),
  },
  tagline: {
    fontSize: fs(16),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#4c89dd',
    fontStyle: 'italic',
  },

  // ── Sections ──
  section: {
    marginBottom: scaleH(28),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(10),
    marginBottom: scaleH(14),
  },
  sectionTitle: {
    fontSize: fs(20),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  sectionText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: fs(14) * 1.7,
  },

  // ── Stats ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleW(12),
    marginTop: scaleH(8),
  },
  statCard: {
    flex: 1,
    minWidth: statCardMinW,
    backgroundColor: '#FFFFFF',
    padding: ms(20),
    borderRadius: ms(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: statIconSize,
    height: statIconSize,
    borderRadius: statIconSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(12),
  },
  statValue: {
    fontSize: fs(28),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(4),
  },
  statLabel: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },

  // ── Features ──
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(12),
    marginBottom: scaleH(14),
    backgroundColor: '#FFFFFF',
    padding: ms(14),
    borderRadius: ms(10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featureIconContainer: {
    width: featureIconSize,
    height: featureIconSize,
    borderRadius: featureIconSize / 2,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '500',
  },

  // ── Team ──
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleW(12),
    marginTop: scaleH(8),
  },
  teamCard: {
    flex: 1,
    minWidth: teamCardMinW,
    backgroundColor: '#FFFFFF',
    padding: ms(18),
    borderRadius: ms(12),
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  teamIconContainer: {
    width: teamIconSize,
    height: teamIconSize,
    borderRadius: teamIconSize / 2,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(12),
  },
  teamName: {
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(4),
    textAlign: 'center',
  },
  teamRole: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
  },

  // ── Contact ──
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(16),
  },
  contactIconContainer: {
    width: contactIconSize,
    height: contactIconSize,
    borderRadius: contactIconSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(14),
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginBottom: scaleH(2),
  },
  contactValue: {
    fontSize: fs(14),
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: contactIconSize + scaleW(14),
  },

  // ── Social ──
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleW(16),
    marginTop: scaleH(8),
  },
  socialButton: {
    width: socialBtnSize,
    height: socialBtnSize,
    borderRadius: socialBtnSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // ── Values ──
  valuesCard: {
    backgroundColor: '#FFFFFF',
    padding: ms(20),
    borderRadius: ms(16),
    marginBottom: scaleH(24),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  valuesTitle: {
    fontSize: fs(18),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(16),
    textAlign: 'center',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(12),
    paddingVertical: scaleH(10),
  },
  valueText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '500',
  },

  // ── App Info ──
  appInfo: {
    alignItems: 'center',
    paddingVertical: scaleH(24),
  },
  versionText: {
    fontSize: fs(14),
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
    marginBottom: scaleH(8),
  },
  copyrightText: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#CBD5E1',
    marginBottom: scaleH(2),
  },
});

export default AboutUs;