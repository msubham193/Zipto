import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  Animated,
  PanResponder,
} from 'react-native';
import {
  startOtpAutoRead,
  readOtpFromClipboard,
  logOtpHash,
} from '../../utils/otpAutoRead';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import {
  horizontalScale as hs,
  verticalScale as vs,
  moderateScale as ms,
  fontScale as fs,
} from '../../utils/metrics';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;
const THUMB = ms(56);

// ─── Slide to Verify ──────────────────────────────────────────────────────────
interface SlideButtonHandle {
  reset: () => void;
}

interface SlideButtonProps {
  onSlideComplete: () => void;
  disabled: boolean;
  loading: boolean;
}

const SlideButton = forwardRef<SlideButtonHandle, SlideButtonProps>(
  ({ onSlideComplete, disabled, loading }, ref) => {
    const panX = useRef(new Animated.Value(0)).current;
    const trackWidth = useRef(0);
    const completed = useRef(false);

    const reset = useCallback(() => {
      completed.current = false;
      Animated.spring(panX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }, [panX]);

    useImperativeHandle(ref, () => ({ reset }), [reset]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && !loading,
        onMoveShouldSetPanResponder: () => !disabled && !loading && !completed.current,
        onPanResponderMove: (_, { dx }) => {
          if (completed.current) return;
          const max = Math.max(0, trackWidth.current - THUMB - ms(4));
          panX.setValue(Math.max(0, Math.min(dx, max)));
        },
        onPanResponderRelease: (_, { dx }) => {
          if (completed.current) return;
          const max = Math.max(0, trackWidth.current - THUMB - ms(4));
          if (dx >= max * 0.8) {
            completed.current = true;
            Animated.spring(panX, {
              toValue: max,
              useNativeDriver: true,
              tension: 60,
              friction: 8,
            }).start(() => onSlideComplete());
          } else {
            reset();
          }
        },
      })
    ).current;

    const labelOpacity = panX.interpolate({
      inputRange: [0, 70],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const isDisabled = disabled || loading;

    return (
      <View
        style={[slide.track, isDisabled && slide.trackDisabled]}
        onLayout={e => { trackWidth.current = e.nativeEvent.layout.width; }}
      >
        <Animated.Text style={[slide.label, { opacity: labelOpacity }]}>
          Slide to verify
        </Animated.Text>
        <MaterialIcons
          name="chevron-right"
          size={ms(22)}
          color="rgba(37,99,235,0.3)"
          style={slide.arrow}
        />
        <Animated.View
          style={[slide.thumb, isDisabled && slide.thumbDisabled, { transform: [{ translateX: panX }] }]}
          {...panResponder.panHandlers}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <MaterialIcons name="security" size={ms(24)} color={isDisabled ? '#94A3B8' : '#2563EB'} />
          )}
        </Animated.View>
      </View>
    );
  }
);

const slide = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: ms(50),
    height: ms(64),
    paddingHorizontal: ms(4),
    overflow: 'hidden',
  },
  trackDisabled: { opacity: 0.5 },
  label: {
    flex: 1,
    textAlign: 'center',
    color: '#475569',
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    marginLeft: THUMB,
  },
  arrow: {
    position: 'absolute',
    right: ms(18),
  },
  thumb: {
    position: 'absolute',
    left: ms(4),
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  thumbDisabled: { shadowOpacity: 0, elevation: 0 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OTPVerification = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mobile, confirmSwitch } = route.params ?? {};

  const { verifyOtp, login, isLoading, error: authError, clearError } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const inputRef = useRef<TextInput | null>(null);
  const autoFilledRef = useRef(false);
  const sliderRef = useRef<SlideButtonHandle>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    return () => { clearError(); };
  }, []);

  const submitOtp = useCallback(async (code: string) => {
    if (code.length !== OTP_LENGTH) return;
    setError('');
    try {
      await verifyOtp(mobile, code, undefined, confirmSwitch);
    } catch {
      autoFilledRef.current = false;
      sliderRef.current?.reset();
    }
  }, [mobile, confirmSwitch, verifyOtp]);

  const fillOtp = useCallback((code: string) => {
    const digits = code.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (digits.length !== OTP_LENGTH || autoFilledRef.current) return;
    autoFilledRef.current = true;
    setOtp(digits);
    setError('');
    Keyboard.dismiss();
    setTimeout(() => submitOtp(digits), 250);
  }, [submitOtp]);

  useEffect(() => {
    logOtpHash();
    const stop = startOtpAutoRead(fillOtp);
    const t = setTimeout(async () => {
      const fromClip = await readOtpFromClipboard();
      if (fromClip) fillOtp(fromClip);
    }, 400);
    return () => { stop(); clearTimeout(t); };
  }, [fillOtp]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(cleaned);
    setError('');
    if (cleaned.length === OTP_LENGTH) Keyboard.dismiss();
  };

  const isComplete = otp.length === OTP_LENGTH;

  const handleVerify = useCallback(async () => {
    if (!isComplete) {
      setError('Please enter the 6-digit OTP');
      sliderRef.current?.reset();
      return;
    }
    await submitOtp(otp);
  }, [isComplete, otp, submitOtp]);

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      await login(mobile);
      setOtp('');
      autoFilledRef.current = false;
      setError('');
      setResendTimer(RESEND_COOLDOWN);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      // authError from store shown below
    } finally {
      setResending(false);
    }
  };

  const displayError = error || authError || '';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#1A1DB9', '#131699', '#0D1080']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Background decorations */}
      <View style={[s.circle, s.circleTR]} />
      <View style={[s.circle, s.circleTL]} />
      <View style={[s.circle, s.circleBL]} />

      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={s.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={s.flex1}
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top row */}
            <View style={s.topRow}>
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
                <MaterialIcons name="arrow-back" size={ms(20)} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
                <MaterialIcons name="phone-iphone" size={ms(20)} color="#FFFFFF" />
              </View>
            </View>

            {/* Heading */}
            <Text style={s.heading}>Verify your{'\n'}phone</Text>
            <Text style={s.subheading}>Enter the 6-digit code sent to</Text>
            <View style={s.phoneBadge}>
              <Text style={s.phoneBadgeText}>{mobile}</Text>
            </View>

            {/* OTP boxes */}
            <Text style={s.otpLabel}>Enter 6-digit code</Text>
            <TouchableOpacity
              activeOpacity={1}
              style={s.boxRow}
              onPress={() => inputRef.current?.focus()}
            >
              {Array(OTP_LENGTH).fill(null).map((_, i) => {
                const char = otp[i] ?? '';
                const isActive = focused && (
                  i === otp.length || (otp.length === OTP_LENGTH && i === OTP_LENGTH - 1)
                );
                return (
                  <View
                    key={i}
                    style={[s.digitBox, isActive && s.digitBoxFocused, char ? s.digitBoxFilled : null]}
                  >
                    <Text style={s.digitText}>{char}</Text>
                  </View>
                );
              })}
              <TextInput
                ref={inputRef}
                style={s.hiddenInput}
                value={otp}
                onChangeText={handleChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                selectionColor="transparent"
                underlineColorAndroid="transparent"
                caretHidden
                textContentType="oneTimeCode"
                autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                importantForAutofill="yes"
                autoFocus
              />
            </TouchableOpacity>

            {/* Progress dots */}
            <View style={s.dotsRow}>
              {Array(OTP_LENGTH).fill(null).map((_, i) => (
                <View key={i} style={[s.dot, i < otp.length && s.dotFilled]} />
              ))}
            </View>

            {!!displayError && <Text style={s.errorText}>{displayError}</Text>}

            {/* Resend */}
            <TouchableOpacity
              style={[s.resendBtn, resendTimer > 0 && s.resendBtnDisabled]}
              onPress={handleResend}
              disabled={resendTimer > 0 || resending}
              activeOpacity={0.75}
            >
              <MaterialIcons
                name="timer"
                size={ms(16)}
                color={resendTimer > 0 ? 'rgba(255,255,255,0.45)' : '#FFFFFF'}
              />
              <Text style={[s.resendText, resendTimer > 0 && s.resendTextDisabled]}>
                {resendTimer > 0
                  ? `Resend available in ${resendTimer}s`
                  : resending ? 'Sending…' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>

            <View style={s.spacer} />

            {/* Slide to verify — no border/line above it */}
            <SlideButton
              ref={sliderRef}
              onSlideComplete={handleVerify}
              disabled={!isComplete}
              loading={isLoading}
            />

            {/* Wrong number */}
            <TouchableOpacity style={s.wrongRow} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <MaterialIcons name="edit" size={ms(13)} color="rgba(255,255,255,0.55)" />
              <Text style={s.wrongText}>
                Wrong number?{' '}
                <Text style={s.wrongChange}>Change</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  flex1: { flex: 1 },
  safeArea: { flex: 1 },

  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleTR: { width: ms(220), height: ms(220), top: -ms(70), right: -ms(60) },
  circleTL: { width: ms(120), height: ms(120), top: ms(50), left: -ms(45), backgroundColor: 'rgba(255,255,255,0.05)' },
  circleBL: { width: ms(180), height: ms(180), bottom: ms(70), left: -ms(80), backgroundColor: 'rgba(255,255,255,0.05)' },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: hs(24),
    paddingTop: vs(14),
    paddingBottom: vs(32),
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(28),
  },
  iconBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heading: {
    fontSize: fs(34),
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    lineHeight: fs(42),
    marginBottom: vs(10),
  },
  subheading: {
    fontSize: fs(14),
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins-Regular',
    marginBottom: vs(10),
  },
  phoneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: ms(20),
    paddingHorizontal: hs(16),
    paddingVertical: vs(6),
    marginBottom: vs(30),
  },
  phoneBadgeText: {
    color: '#FFFFFF',
    fontSize: fs(14),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
  },

  otpLabel: {
    fontSize: fs(13),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Poppins-Regular',
    marginBottom: vs(14),
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: hs(8),
    position: 'relative',
    marginBottom: vs(14),
  },
  digitBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  digitBoxFilled: {
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  digitText: {
    fontSize: fs(22),
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.02,
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: fs(20),
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: hs(8),
    marginBottom: vs(6),
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  dotFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },

  errorText: {
    color: '#FCA5A5',
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: vs(6),
    marginBottom: vs(4),
  },

  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: ms(50),
    paddingVertical: vs(14),
    paddingHorizontal: hs(24),
    marginTop: vs(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  resendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  resendText: {
    color: '#FFFFFF',
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
  resendTextDisabled: { color: 'rgba(255,255,255,0.45)' },

  spacer: { flex: 1, minHeight: vs(28) },

  wrongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    marginTop: vs(18),
    paddingVertical: vs(6),
  },
  wrongText: {
    fontSize: fs(13),
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Poppins-Regular',
  },
  wrongChange: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default OTPVerification;
