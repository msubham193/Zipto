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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import {
  horizontalScale as hs,
  verticalScale as vs,
  moderateScale as ms,
  fontScale as fs,
} from '../utils/metrics';

const RESEND_COOLDOWN = 30;
const CARD_RADIUS     = ms(28);

const OTPVerification = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { mobile } = route.params ?? {};

  const { verifyOtp, login, isLoading, error: authError, clearError } = useAuthStore();

  const [otp, setOtp]                 = useState('');
  const [error, setError]             = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending]     = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => { clearError(); };
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP'); return; }
    setError('');
    try {
      await verifyOtp(mobile, otp);
      // Navigation handled automatically by RootNavigator when isAuthenticated → true
    } catch {
      // error displayed via authError from store
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      await login(mobile);
      setOtp('');
      setError('');
      setResendTimer(RESEND_COOLDOWN);
    } catch {
      // error displayed via authError from store
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E22AD" translucent={false} />

      {/* Hero image — full width, no border or card */}
      <Image
        source={require('../assets/images/OTP.png')}
        style={styles.heroImage}
        resizeMode="cover"
      />

      {/* White form card with curved top corners */}
      <View style={styles.formCard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
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
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              style={[styles.inputContainer, otp.length > 0 && styles.inputFocused]}
            >
              <TextInput
                ref={inputRef}
                style={styles.otpInput}
                placeholder="------"
                placeholderTextColor="#CBD5E1"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={t => { setOtp(t); setError(''); }}
                autoFocus
              />
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <TouchableOpacity
              style={[styles.verifyButton, otp.length !== 6 && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              activeOpacity={otp.length === 6 ? 0.8 : 1}
              disabled={otp.length !== 6 || isLoading}
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
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const arrowIconSize = ms(22);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E22AD',
  },
  heroImage: {
    width: '100%',
    height: vs(280),
  },
  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    marginTop: -CARD_RADIUS,
    overflow: 'hidden',
  },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: hs(24),
    paddingTop: vs(24),
    paddingBottom: vs(32),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
    marginBottom: vs(20),
    alignSelf: 'flex-start',
  },
  backIcon: {
    width: arrowIconSize,
    height: arrowIconSize,
    tintColor: '#64748B',
  },
  backText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    fontWeight: '500',
  },
  title: {
    fontSize: fs(26),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: vs(6),
  },
  subtitle: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginBottom: vs(28),
    lineHeight: fs(22),
  },
  phoneText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '600',
    marginBottom: vs(8),
  },
  inputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    paddingHorizontal: hs(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  inputFocused: { borderColor: '#2563EB' },
  otpInput: {
    color: '#0F172A',
    fontSize: fs(24),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    paddingVertical: vs(16),
    letterSpacing: hs(10),
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    marginTop: vs(6),
    marginBottom: vs(4),
  },
  verifyButton: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: vs(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(24),
    marginBottom: vs(16),
  },
  verifyButtonDisabled: { backgroundColor: '#93C5FD' },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    marginRight: hs(8),
  },
  arrowIcon: {
    width: arrowIconSize,
    height: arrowIconSize,
    tintColor: '#eaecf1',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(8),
  },
  resendLabel: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
  },
  resendTimer: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
  },
  resendLink: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default OTPVerification;
