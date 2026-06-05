import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { showAlert } from '../components/CustomAlert';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import {
  horizontalScale as hs,
  verticalScale as vs,
  moderateScale as ms,
  fontScale as fs,
  SCREEN_HEIGHT,
} from '../utils/metrics';

// Hero occupies 32% of screen height — scales correctly on all device sizes
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.32);
const CARD_OVERLAP = ms(24);
const CARD_RADIUS = ms(24);

const Login = () => {
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  const { login, isLoading, error: authError, clearError } = useAuthStore();

  useEffect(() => {
    return () => { clearError(); };
  }, []);

  const isButtonEnabled = phone.trim().length >= 10 && termsAgreed;

  const handleGetOTP = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!termsAgreed) {
      setError('Please agree to the Terms & Privacy Policy to continue.');
      return;
    }
    setError('');
    try {
      await login(trimmed);
      // A number registered as a Rider is switched to a customer account
      // silently (no confirmation dialog) — see authApi.verifyOtp which always
      // sends confirm_switch.
      navigation.navigate('OTPVerification', { mobile: trimmed });
    } catch {
      // authError from store is displayed below
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E22AD" translucent={false} />

      {/*
        Hero is absolutely pinned to the top of the screen.
        It is NOT in the normal layout flow, so the keyboard resizing
        the window on Android can never push or shrink it.
      */}
      <View style={styles.hero} pointerEvents="none">
        <Image
          source={require('../assets/images/login_banner.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroCircleTop} />
        <View style={styles.heroCircleBottom} />
        <View style={styles.heroLineAccent} />
      </View>

      {/*
        KeyboardAvoidingView sits in normal flow, starting just below the hero
        with a small overlap to show the curved card top.
        On iOS it adds bottom padding; on Android the OS handles window resize.
      */}
      <KeyboardAvoidingView
        style={[styles.kavWrapper, { marginTop: HERO_HEIGHT - CARD_OVERLAP }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.formCard}>
          <LinearGradient
            colors={['#2563EB25', 'transparent']}
            style={styles.cardGradient}
          />
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Welcome to Zipto</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number to access your rides quickly.
            </Text>
            <Text style={styles.helperText}>
              We will send a one-time password to this mobile number.
            </Text>

            <Text style={styles.label}>Mobile Number</Text>
            <View style={[styles.inputContainer, !!error && !phone && styles.inputError]}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={t => { setPhone(t); setError(''); }}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setTermsAgreed(prev => !prev)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}>
                {termsAgreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text
                  style={styles.checkboxLink}
                  onPress={() => Linking.openURL('https://ridezipto.com/terms-of-service')}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.checkboxLink}
                  onPress={() => Linking.openURL('https://ridezipto.com/privacy-policy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, !isButtonEnabled && styles.loginButtonDisabled]}
              onPress={handleGetOTP}
              activeOpacity={isButtonEnabled ? 0.8 : 1}
              disabled={!isButtonEnabled || isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Sending OTP...' : 'Get OTP'}
              </Text>
              <Image
                source={require('../assets/images/arrow.png')}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const phoneIconSize = ms(24);
const arrowIconSize = ms(20);
const checkboxSize = ms(20);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E22AD',
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    backgroundColor: '#0E2F9C',
    zIndex: 0,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  heroCircleTop: {
    position: 'absolute',
    top: -vs(30),
    right: -ms(30),
    width: ms(110),
    height: ms(110),
    borderRadius: ms(55),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroCircleBottom: {
    position: 'absolute',
    bottom: -vs(20),
    left: -ms(20),
    width: ms(90),
    height: ms(90),
    borderRadius: ms(45),
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroLineAccent: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    right: '20%',
    height: vs(5),
    borderRadius: ms(3),
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '0deg' }],
  },

  // ── Form card ───────────────────────────────────────────────────────────────
  kavWrapper: {
    flex: 1,
    zIndex: 1,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vs(100),
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: hs(22),
    paddingTop: vs(24),
    paddingBottom: vs(28),
  },

  // ── Typography ───────────────────────────────────────────────────────────────
  title: {
    fontSize: fs(22),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: vs(4),
  },
  subtitle: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginBottom: vs(6),
    lineHeight: fs(20),
  },
  helperText: {
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
    marginBottom: vs(18),
  },
  label: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '600',
    marginBottom: vs(8),
  },

  // ── Input ────────────────────────────────────────────────────────────────────
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: ms(14),
    paddingHorizontal: hs(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: ms(52),
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  inputIcon: {
    width: phoneIconSize,
    height: phoneIconSize,
    marginRight: hs(10),
    tintColor: '#2563EB',
  },
  countryCode: {
    color: '#334155',
    fontSize: fs(13),
    fontWeight: '700',
    marginRight: hs(10),
    fontFamily: 'Poppins-Regular',
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: fs(15),
    paddingVertical: 0,
    minHeight: vs(36),
  },
  inputError: { borderColor: '#EF4444' },
  errorText: {
    color: '#EF4444',
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    marginTop: vs(5),
    marginBottom: vs(2),
  },

  // ── Checkbox ─────────────────────────────────────────────────────────────────
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vs(14),
    marginBottom: vs(2),
    gap: hs(10),
  },
  checkbox: {
    width: checkboxSize,
    height: checkboxSize,
    borderRadius: ms(5),
    borderWidth: 1.8,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(2),
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkmark: {
    color: '#FFFFFF',
    fontSize: fs(11),
    fontWeight: '800',
    lineHeight: fs(13),
  },
  checkboxLabel: {
    flex: 1,
    fontSize: fs(12),
    color: '#475569',
    fontFamily: 'Poppins-Regular',
    lineHeight: fs(18),
  },
  checkboxLink: { color: '#2563EB', fontWeight: '600' },

  // ── Button ────────────────────────────────────────────────────────────────────
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: vs(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(20),
    marginBottom: vs(8),
    shadowColor: '#2563EB',
    shadowOpacity: 0.20,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    marginRight: hs(8),
  },
  arrowIcon: {
    width: arrowIconSize,
    height: arrowIconSize,
    tintColor: '#eaecf1',
  },
});

export default Login;
