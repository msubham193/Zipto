import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  StatusBar,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import {
  horizontalScale as hs,
  verticalScale as vs,
  moderateScale as ms,
  fontScale as fs,
  SCREEN_HEIGHT,
} from '../utils/metrics';

const OTP_LENGTH      = 6;
const RESEND_COOLDOWN = 30;
const HERO_HEIGHT     = Math.round(SCREEN_HEIGHT * 0.32);
const CARD_OVERLAP    = ms(24);
const CARD_RADIUS     = ms(24);

const OTPVerification = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { mobile, confirmSwitch } = route.params ?? {};

  const { verifyOtp, login, isLoading, error: authError, clearError } = useAuthStore();

  const [digits, setDigits]           = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError]             = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending]     = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return () => { clearError(); };
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    // Accept only the last character typed (handles paste on Android)
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const updated = [...digits];
      updated[index - 1] = '';
      setDigits(updated);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  const handleVerify = async () => {
    if (!isComplete) { setError('Please enter the 6-digit OTP'); return; }
    setError('');
    try {
      await verifyOtp(mobile, otp, undefined, confirmSwitch);
    } catch {
      // error displayed via authError from store
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      await login(mobile);
      setDigits(Array(OTP_LENGTH).fill(''));
      setError('');
      setResendTimer(RESEND_COOLDOWN);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      // error displayed via authError from store
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E22AD" translucent={false} />

      {/* Hero — absolutely pinned, unaffected by keyboard */}
      <View style={styles.hero} pointerEvents="none">
        <Image
          source={require('../assets/images/otp_screen.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroCircleTop} />
        <View style={styles.heroCircleBottom} />
        <View style={styles.heroLineAccent} />
      </View>

      {/* KAV wraps only the form card, starts just below the hero */}
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={require('../assets/images/back.png')}
                style={styles.backIcon}
              />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit OTP to{'\n'}
              <Text style={styles.phoneText}>{mobile}</Text>
            </Text>

            <Text style={styles.label}>Enter OTP</Text>

            {/* 6 individual digit boxes */}
            <View style={styles.boxRow}>
              {Array(OTP_LENGTH).fill(null).map((_, i) => (
                <TextInput
                  key={i}
                  ref={ref => { inputRefs.current[i] = ref; }}
                  style={[
                    styles.digitBox,
                    focusedIndex === i && styles.digitBoxFocused,
                    digits[i] ? styles.digitBoxFilled : null,
                  ]}
                  value={digits[i]}
                  onChangeText={text => handleChange(text, i)}
                  onKeyPress={e => handleKeyPress(e, i)}
                  onFocus={() => setFocusedIndex(i)}
                  onBlur={() => setFocusedIndex(-1)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectionColor="#2563EB"
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <TouchableOpacity
              style={[styles.verifyButton, !isComplete && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              activeOpacity={isComplete ? 0.8 : 1}
              disabled={!isComplete || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                  <Image
                    source={require('../assets/images/arrow.png')}
                    style={styles.arrowIcon}
                  />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive the OTP? </Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={resending}>
                  <Text style={styles.resendLink}>
                    {resending ? 'Sending...' : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const arrowIconSize = ms(20);

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

  // ── Back button ──────────────────────────────────────────────────────────────
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
    marginBottom: vs(16),
    alignSelf: 'flex-start',
  },
  backIcon: {
    width: ms(20),
    height: ms(20),
    tintColor: '#64748B',
  },
  backText: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    fontWeight: '500',
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
    marginBottom: vs(20),
    lineHeight: fs(20),
  },
  phoneText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '600',
    marginBottom: vs(12),
  },

  // ── OTP boxes ────────────────────────────────────────────────────────────────
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: hs(8),
  },
  digitBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: fs(20),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  digitBoxFocused: {
    borderColor: '#2563EB',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  digitBoxFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    marginTop: vs(10),
    marginBottom: vs(2),
  },

  // ── Verify button ─────────────────────────────────────────────────────────────
  verifyButton: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: vs(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(24),
    marginBottom: vs(8),
    shadowColor: '#2563EB',
    shadowOpacity: 0.20,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
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

  // ── Resend row ────────────────────────────────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(8),
  },
  resendLabel: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },
  resendTimer: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
  },
  resendLink: {
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default OTPVerification;
