import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../store';

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
      {/* Decorative circles - no animations */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <View style={styles.heroCard}>
          <Image
            source={require('../assets/images/heroimg1.jpg')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Decorative circles (soft, subtle) */
  decorCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    top: -150,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    bottom: 120,
    left: -100,
  },
  decorCircle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    top: '50%',
    right: -60,
  },

  /* Hero */
  heroContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroCard: {
    height: 250,
    borderRadius: 16,
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
    top: 16,
    left: 16,
    right: 16,
  },
  heroText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  /* Content */
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
  },

  /* Logo icon */
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    top: -10,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5F5',
  },
  logoImage: {
    width: 80,
    height: 80,
  },

  /* Titles */
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },

  /* Language buttons */
  buttonContainer: {
    gap: 16,
  },
  languageButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  languageIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flagIcon: {
    fontSize: 28,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: 2,
  },
  languageSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },
  checkIcon: {
    fontSize: 24,
    fontFamily: 'Poppins-Regular',
    color: '#2563EB',
    fontWeight: 'bold',
  },
arrowIcon: {
  width: 22,
  height: 22,
  tintColor: '#2563EB', // optional if icon is black
},
  /* Footer text */
  termsText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  link: {
    color: '#2563EB',
  },
});

export default LanguageSelection;
