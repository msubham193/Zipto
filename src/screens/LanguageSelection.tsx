import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../store';

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

const LanguageSelection = () => {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const handleLanguageSelect = (lang: string) => {
    i18n.changeLanguage(lang);
    dispatch(setLanguage(lang));
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <View style={styles.heroCard}>
          <Image
            source={require('../assets/images/heroimg1.jpeg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <View style={styles.formSection}>
            {/* Zipto Logo */}
            <View style={styles.iconWrapper}>
              <View style={[styles.glow, { opacity: 0.5 }]} />
              <View style={styles.iconContainer}>
                <Image
                  source={require('../assets/images/logo_zipto.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{t('selectLanguage')}</Text>
            <Text style={styles.subtitle}>
              Choose your preferred language to continue
            </Text>

            {/* Language Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => handleLanguageSelect('en')}
                activeOpacity={0.8}
              >
                <View style={styles.languageIcon}>
                  <Text style={styles.flagIcon}>🇮🇳</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>English</Text>
                  <Text style={styles.languageSubtext}>English</Text>
                </View>
                <Image
                  source={require('../assets/images/arrow.png')}
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => handleLanguageSelect('or')}
                activeOpacity={0.8}
              >
                <View style={styles.languageIcon}>
                  <Text style={styles.flagIcon}>🇮🇳</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>ଓଡ଼ିଆ</Text>
                  <Text style={styles.languageSubtext}>Odia</Text>
                </View>
                <Image
                  source={require('../assets/images/arrow.png')}
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms Text */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const decorCircle1Size = ms(250);
const decorCircle2Size = ms(200);
const decorCircle3Size = ms(180);
const glowSize         = ms(120);
const iconContainerSize = ms(100);
const logoSize         = ms(80);
const langIconSize     = ms(50);
const arrowSize        = ms(22);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Decorative circles ──
  decorCircle1: {
    position: 'absolute',
    width: decorCircle1Size,
    height: decorCircle1Size,
    borderRadius: decorCircle1Size / 2,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    top: -scaleH(150),
    right: -scaleW(80),
  },
  decorCircle2: {
    position: 'absolute',
    width: decorCircle2Size,
    height: decorCircle2Size,
    borderRadius: decorCircle2Size / 2,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    bottom: scaleH(120),
    left: -scaleW(100),
  },
  decorCircle3: {
    position: 'absolute',
    width: decorCircle3Size,
    height: decorCircle3Size,
    borderRadius: decorCircle3Size / 2,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    top: '50%',
    right: -scaleW(60),
  },

  // ── Hero ──
  heroContainer: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(10),
  },
  heroCard: {
    height: scaleH(250),
    borderRadius: ms(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  heroImage: {
    width: '100%',
    height: '110%',
    position: 'absolute',
  },
  heroOverlay: {
    position: 'absolute',
    top: scaleH(16),
    left: scaleW(16),
    right: scaleW(16),
  },
  heroText: {
    fontSize: fs(20),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // ── Content ──
  contentWrapper: {
    flex: 1,
    paddingHorizontal: scaleW(20),
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: scaleH(20),
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
  },

  // ── Logo icon ──
  iconWrapper: {
    alignItems: 'center',
    marginBottom: scaleH(24),
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: glowSize,
    height: glowSize,
    top: -scaleH(10),
    borderRadius: glowSize / 2,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  iconContainer: {
    width: iconContainerSize,
    height: iconContainerSize,
    borderRadius: iconContainerSize / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5F5',
  },
  logoImage: {
    width: logoSize,
    height: logoSize,
  },

  // ── Titles ──
  title: {
    fontSize: fs(28),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: scaleH(8),
  },
  subtitle: {
    fontSize: fs(16),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    textAlign: 'center',
    lineHeight: fs(16) * 1.4,
    marginBottom: scaleH(40),
  },

  // ── Language buttons ──
  buttonContainer: {
    gap: scaleH(16),
  },
  languageButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(20),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  languageIcon: {
    width: langIconSize,
    height: langIconSize,
    borderRadius: langIconSize / 2,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(16),
  },
  flagIcon: {
    fontSize: fs(28),
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: fs(20),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(2),
  },
  languageSubtext: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },
  checkIcon: {
    fontSize: fs(24),
    fontFamily: 'Poppins-Regular',
    color: '#2563EB',
    fontWeight: 'bold',
  },
  arrowIcon: {
    width: arrowSize,
    height: arrowSize,
    tintColor: '#2563EB',
  },

  // ── Footer text ──
  termsText: {
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(11) * 1.5,
  },
  link: {
    color: '#2563EB',
  },
});

export default LanguageSelection;