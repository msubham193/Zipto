import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';

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

// Hero heights scaled to screen
const HERO_HEIGHT_OPEN   = scaleH(250);
const HERO_HEIGHT_CLOSED = scaleH(120);

const Login = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [heroHeight, setHeroHeight] = useState(HERO_HEIGHT_OPEN);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      setHeroHeight(HERO_HEIGHT_CLOSED);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
      setHeroHeight(HERO_HEIGHT_OPEN);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { login, isLoading, error: authError } = useAuthStore();

  const handleGetOTP = async () => {
    if (phoneNumber.length !== 10) {
      setError('Invalid mobile number');
      return;
    }
    setError('');
    try {
      await login(countryCode + phoneNumber);
      navigation.navigate('OTPVerification', {
        mobile: phoneNumber,
        fullMobile: countryCode + phoneNumber,
      });
    } catch (err) {
      console.log('Login error', err);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Login with:', provider);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO SECTION */}
          <View style={styles.heroContainer}>
            <View style={[styles.heroCard, { height: heroHeight }]}>
              <Image
                source={require('../assets/images/heroimg2.jpeg')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.contentWrapper}>
            <View style={styles.content}>
              <View style={styles.formSection}>
                <Text style={styles.title}>Let's get moving</Text>
                <Text style={styles.subtitle}>
                  Enter your mobile number to login or signup for the best
                  logistics service.
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Code</Text>
                  <Text style={[styles.label, styles.numberLabel]}>
                    Mobile Number
                  </Text>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.codeInput}>
                    {/* ── Indian flag emoji + country code ── */}
                    <Text style={styles.codeText}>🇮🇳 {countryCode}</Text>
                  </View>

                  <View
                    style={[
                      styles.phoneInputContainer,
                      error && styles.inputError,
                    ]}
                  >
                    <Image
                      source={require('../assets/images/cell-phone.png')}
                      style={styles.phoneIcon}
                      resizeMode="contain"
                    />
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="98765 43210"
                      placeholderTextColor="#6B7280"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phoneNumber}
                      onChangeText={text => {
                        setPhoneNumber(text);
                        setError('');
                      }}
                    />
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

                <View>
                  <TouchableOpacity
                    style={styles.otpButton}
                    onPress={handleGetOTP}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.otpButtonText}>
                      {isLoading ? 'Sending...' : 'Get OTP'}
                    </Text>
                    <Image
                      source={require('../assets/images/arrow.png')}
                      style={styles.arrowIcon}
                    />
                  </TouchableOpacity>
                </View>

                {!keyboardOpen && (
                  <>
                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <Text style={styles.dividerText}>Or continue with</Text>
                      <View style={styles.divider} />
                    </View>

                    <View style={styles.socialContainer}>
                      <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => handleSocialLogin('Google')}
                      >
                        {/* ── Google logo ── */}
                        <Image
                          source={require('../assets/images/google_logo1.png')}
                          style={styles.socialLogo}
                          resizeMode="contain"
                        />
                        <Text style={styles.socialButtonText}>Google</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => handleSocialLogin('Apple')}
                      >
                        {/* ── Apple logo ── */}
                        <Image
                          source={require('../assets/images/apple_logo1.png')}
                          style={styles.socialLogo}
                          resizeMode="contain"
                        />
                        <Text style={styles.socialButtonText}>Apple</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {!keyboardOpen && (
                <Text style={styles.termsText}>
                  By continuing, you agree to our{' '}
                  <Text style={styles.link}>Terms of Service</Text> and{' '}
                  <Text style={styles.link}>Privacy Policy</Text>.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const phoneIconSize = ms(28);
const arrowIconSize = ms(22);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: scaleW(20),
  },

  // ── Hero ──
  heroContainer: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(10),
  },
  heroCard: {
    // height is set dynamically via inline style
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
    fontFamily: 'Poppins-Regular',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // ── Content ──
  content: {
    flex: 1,
    paddingTop: scaleH(20),
    paddingBottom: scaleH(20),
  },
  formSection: {
    flex: 1,
  },
  title: {
    fontSize: fs(28),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(8),
  },
  subtitle: {
    fontSize: fs(16),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    marginBottom: scaleH(40),
  },

  // ── Inputs ──
  inputContainer: {
    flexDirection: 'row',
    marginBottom: scaleH(8),
  },
  label: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    flex: 2,
    fontWeight: '600',
  },
  numberLabel: {
    flex: 2.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: scaleW(12),
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    paddingVertical: scaleH(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeText: {
    color: '#0F172A',
    fontSize: fs(16),
  },
  phoneInputContainer: {
    flex: 2.5,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    paddingHorizontal: scaleW(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phoneIcon: {
    width: phoneIconSize,
    height: phoneIconSize,
  },
  phoneInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: fs(15),
    paddingVertical: scaleH(16),
    marginLeft: scaleW(8),
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    marginTop: scaleH(6),
  },

  // ── OTP Button ──
  otpButton: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: scaleH(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleH(30),
    marginBottom: scaleH(20),
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    marginRight: scaleW(8),
  },
  arrowIcon: {
    width: arrowIconSize,
    height: arrowIconSize,
    tintColor: '#eaecf1',
  },

  // ── Divider ──
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleH(16),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: scaleW(12),
    color: '#64748B',
    fontSize: fs(13),
  },

  // ── Social login ──
  socialContainer: {
    flexDirection: 'row',
    gap: scaleW(12),
    marginBottom: scaleH(20),
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: scaleH(14),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scaleW(8),
  },
  socialLogo: {
    width: ms(20),
    height: ms(20),
  },
  socialButtonText: {
    color: '#0F172A',
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },

  // ── Footer ──
  termsText: {
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    paddingTop: scaleH(20),
    paddingBottom: scaleH(20),
  },
  link: {
    color: '#2563EB',
  },
});

export default Login;