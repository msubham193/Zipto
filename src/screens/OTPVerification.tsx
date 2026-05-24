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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

const RESEND_COOLDOWN = 30;

const OTPVerification = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mobile } = route.params ?? {};

  const { verifyOtp, login, isLoading, error: authError, clearError } = useAuthStore();

  const [otp, setOtp]             = useState('');
  const [error, setError]         = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
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
            <View style={styles.heroCard}>
              <Image
                source={require('../assets/images/OTP.png')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.contentWrapper}>
            <View style={styles.content}>
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

              {/* OTP Input */}
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

              {/* Resend */}
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
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const arrowIconSize = ms(22);

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView:     { flex: 1 },
  scrollContent:    { flexGrow: 1 },
  contentWrapper:   { flex: 1, paddingHorizontal: hs(20) },
  heroContainer: {
    paddingHorizontal: hs(20),
    paddingTop: vs(10),
  },
  heroCard: {
    height: vs(200),
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
  content: { flex: 1, paddingTop: vs(20), paddingBottom: vs(20) },
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
    fontSize: fs(28),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: vs(8),
  },
  subtitle: {
    fontSize: fs(15),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    marginBottom: vs(32),
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
    backgroundColor: '#FFFFFF',
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
