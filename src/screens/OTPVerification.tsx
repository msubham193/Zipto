import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
  PixelRatio,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

const ms = (size: number, factor = 0.45) =>
  size + (scaleW(size) - size) * factor;

const fs = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(ms(size)));
// ─────────────────────────────────────────────────────────────────────────────

// Hero heights scaled to screen
const HERO_HEIGHT_OPEN = scaleH(250);
const HERO_HEIGHT_CLOSED = scaleH(120);

/* ─── OTP Input ─────────────────────────────────────────────────────────────── */
const OTPInput = ({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) => {
  const inputRef = useRef<TextInput>(null);
  const digits = value.split('');

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={styles.otpBoxesWrapper}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.hiddenInput}
        caretHidden={true}
        autoCorrect={false}
      />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <View
          key={i}
          style={[
            styles.otpBox,
            hasError && styles.otpBoxError,
            digits[i] ? styles.otpBoxFilled : null,
            value.length === i && styles.otpBoxActive,
          ]}
        >
          <Text style={styles.otpBoxText}>{digits[i] || ''}</Text>
        </View>
      ))}
    </TouchableOpacity>
  );
};

/* ─── Screen ────────────────────────────────────────────────────────────────── */
const OTPVerification = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { verifyOtp, login, isLoading, error: authError } = useAuthStore();

  const { mobile, fullMobile } = route.params || { mobile: '', fullMobile: '' };

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [heroHeight, setHeroHeight] = useState(HERO_HEIGHT_OPEN);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    setError('');
    try {
      const phoneToVerify = fullMobile || mobile;
      await verifyOtp(phoneToVerify, otp);
      // Navigation is handled automatically by RootNavigator
      // when isAuthenticated becomes true in the auth store.
      // AppNavigator uses needsProfileSetup to pick the initial screen.
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      await login(fullMobile || mobile);
      startResendCooldown();
      Alert.alert('OTP Sent', 'A new OTP has been sent to your number.');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
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
          <Animated.View
            style={[
              styles.heroContainer,
              { transform: [{ scale: heroScale }] },
            ]}
          >
            <View style={[styles.heroCard, { height: heroHeight }]}>
              <Image
                source={require('../assets/images/OTP.png')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <View style={styles.contentWrapper}>
            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.formSection}>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit code to {'\n'}+91 {mobile}
                </Text>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <OTPInput
                    value={otp}
                    onChange={text => {
                      setOtp(text);
                      setError('');
                    }}
                    hasError={!!error}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  {authError ? (
                    <Text style={styles.errorText}>{authError}</Text>
                  ) : null}
                </View>

                {/* Resend OTP */}
                <TouchableOpacity
                  onPress={handleResendOTP}
                  style={styles.resendButton}
                  activeOpacity={resendCooldown > 0 ? 1 : 0.7}
                  disabled={resendCooldown > 0}
                >
                  <Text style={styles.resendText}>
                    Didn't receive code?{' '}
                    {resendCooldown > 0
                      ? <Text style={styles.resendCooldown}>Resend in {resendCooldown}s</Text>
                      : <Text style={styles.resendLink}>Resend OTP</Text>
                    }
                  </Text>
                </TouchableOpacity>

                {/* Verify Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={handleVerify}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    <Text style={styles.verifyButtonText}>
                      {isLoading ? 'Verifying...' : 'Verify & Continue'}
                    </Text>
                    <Image
                      source={require('../assets/images/arrow.png')}
                      style={styles.arrowIcon}
                    />
                  </TouchableOpacity>
                </Animated.View>

                {!keyboardOpen && (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                  >
                    <Image
                      source={require('../assets/images/back.png')}
                      style={styles.backIcon}
                    />
                    <Text style={styles.backText}>Back to Login</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!keyboardOpen && (
                <Text style={styles.termsText}>
                  By continuing, you agree to our{' '}
                  <Text style={styles.link}>Terms of Service</Text> and{' '}
                  <Text style={styles.link}>Privacy Policy</Text>.
                </Text>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const arrowIconSize = ms(22);
const otpBoxHeight = scaleH(56);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  contentWrapper: { flex: 1, paddingHorizontal: scaleW(20) },

  // ── Hero ──
  heroContainer: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(10),
  },
  heroCard: {
    // height set dynamically via inline style
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
  content: { flex: 1, paddingTop: scaleH(20), paddingBottom: scaleH(20) },
  formSection: { flex: 1 },
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
    lineHeight: fs(16) * 1.4,
    marginBottom: scaleH(40),
  },

  // ── OTP Container ──
  otpContainer: { marginBottom: scaleH(20) },
  label: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '600',
    marginBottom: scaleH(12),
  },

  // ── OTP Boxes ──
  otpBoxesWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scaleW(8),
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpBox: {
    flex: 1,
    height: otpBoxHeight,
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  otpBoxFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  otpBoxError: { borderColor: '#EF4444' },
  otpBoxText: {
    fontSize: fs(22),
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Poppins-Regular',
  },

  arrowIcon: {
    width: arrowIconSize,
    height: arrowIconSize,
    tintColor: '#eaecf1',
  },
  backIcon: {
    width: arrowIconSize,
    height: arrowIconSize,
    tintColor: '#64748B',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    marginTop: scaleH(8),
    marginLeft: scaleW(4),
  },

  // ── Resend ──
  resendButton: { alignSelf: 'center', marginBottom: scaleH(30) },
  resendText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },
  resendLink: {
    color: '#2563EB',
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
  resendCooldown: {
    color: '#94A3B8',
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
  },

  // ── Verify Button ──
  verifyButton: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: scaleH(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(16),
  },
  verifyButtonText: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    marginRight: scaleW(8),
  },
  arrow: { fontSize: fs(18), color: '#FFFFFF' },

  // ── Back ──
  backButton: {
    alignSelf: 'center',
    paddingVertical: scaleH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(6),
  },
  backText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    fontWeight: '500',
  },

  // ── Footer ──
  termsText: {
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(11) * 1.5,
    paddingTop: scaleH(20),
    paddingBottom: scaleH(20),
  },
  link: { color: '#2563EB' },
});

export default OTPVerification;
