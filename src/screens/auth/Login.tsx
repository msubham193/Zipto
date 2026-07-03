import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { showAlert } from '../../components/CustomAlert';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import {
  horizontalScale as hs,
  verticalScale as vs,
  moderateScale as ms,
  fontScale as fs,
} from '../../utils/metrics';

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
      navigation.navigate('OTPVerification', { mobile: trimmed });
    } catch {
      // authError from store shown below
    }
  };

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
      <View style={[s.circle, s.circleBR]} />

      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={s.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top hero area — flex: 1 fills the space above the card */}
            <View style={s.heroArea}>
              {/* App icon */}
              <View style={s.logoWrap}>
                <MaterialIcons name="local-shipping" size={ms(42)} color="#FFFFFF" />
              </View>
              <Text style={s.appName}>Bookfleet</Text>
              <Text style={s.heading}>Welcome back!</Text>
              <Text style={s.subheading}>
                Fast, reliable delivery at your fingertips.{'\n'}Sign in to continue.
              </Text>
            </View>

            {/* Input card — sits at the bottom, natural height (no flex:1 → no empty space) */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Enter your mobile number</Text>
              <Text style={s.cardSubtitle}>We'll send a one-time password to verify.</Text>

              {/* Phone input */}
              <Text style={s.label}>Mobile Number</Text>
              <View style={[s.inputRow, !!(error && !phone) && s.inputRowError]}>
                <View style={s.countryPill}>
                  <Text style={s.countryFlag}>🇮🇳</Text>
                  <Text style={s.countryCode}>+91</Text>
                </View>
                <View style={s.divider} />
                <TextInput
                  style={s.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={t => { setPhone(t); setError(''); }}
                  returnKeyType="done"
                  onSubmitEditing={handleGetOTP}
                />
              </View>

              {!!(error || authError) && (
                <Text style={s.errorText}>{error || authError}</Text>
              )}

              {/* Terms */}
              <TouchableOpacity
                style={s.termsRow}
                onPress={() => setTermsAgreed(p => !p)}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, termsAgreed && s.checkboxChecked]}>
                  {termsAgreed && (
                    <MaterialIcons name="check" size={ms(13)} color="#FFFFFF" />
                  )}
                </View>
                <Text style={s.termsText}>
                  I agree to the{' '}
                  <Text
                    style={s.termsLink}
                    onPress={() => Linking.openURL('https://bookfleet.in/terms-of-service')}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={s.termsLink}
                    onPress={() => Linking.openURL('https://bookfleet.in/privacy-policy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Get OTP button */}
              <TouchableOpacity
                style={[s.btn, !isButtonEnabled && s.btnDisabled]}
                onPress={handleGetOTP}
                activeOpacity={isButtonEnabled ? 0.85 : 1}
                disabled={!isButtonEnabled || isLoading}
              >
                <Text style={[s.btnText, !isButtonEnabled && s.btnTextDisabled]}>
                  {isLoading ? 'Sending OTP…' : 'Get OTP'}
                </Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={ms(20)}
                  color={isButtonEnabled ? '#FFFFFF' : '#94A3B8'}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const CHECKBOX = ms(20);

const s = StyleSheet.create({
  root: { flex: 1 },
  flex1: { flex: 1 },
  safeArea: { flex: 1 },

  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleTR: { width: ms(230), height: ms(230), top: -ms(80), right: -ms(60) },
  circleTL: { width: ms(130), height: ms(130), top: ms(80), left: -ms(50), backgroundColor: 'rgba(255,255,255,0.05)' },
  circleBR: { width: ms(160), height: ms(160), bottom: ms(60), right: -ms(60), backgroundColor: 'rgba(255,255,255,0.05)' },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: hs(20),
    paddingTop: vs(20),
    paddingBottom: vs(20),
  },

  // ── Hero (flexible — fills remaining height above the card) ──
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(24),
  },
  logoWrap: {
    width: ms(88),
    height: ms(88),
    borderRadius: ms(24),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  appName: {
    fontSize: fs(18),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 1.5,
    marginBottom: vs(8),
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: fs(30),
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: vs(10),
  },
  subheading: {
    fontSize: fs(13),
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: fs(20),
  },

  // ── Input card ──────────────────────────────────────────────────────────────
  // No flex:1 → natural height → no dead space at the bottom
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(24),
    paddingHorizontal: hs(20),
    paddingTop: vs(24),
    paddingBottom: vs(20),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  cardTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Poppins-Regular',
    marginBottom: vs(4),
  },
  cardSubtitle: {
    fontSize: fs(12),
    color: '#64748B',
    fontFamily: 'Poppins-Regular',
    marginBottom: vs(20),
  },

  label: {
    fontSize: fs(12),
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Poppins-Regular',
    marginBottom: vs(8),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: ms(54),
    overflow: 'hidden',
  },
  inputRowError: { borderColor: '#EF4444' },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hs(12),
    gap: hs(4),
  },
  countryFlag: { fontSize: fs(16) },
  countryCode: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Poppins-Regular',
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingHorizontal: hs(14),
    fontSize: fs(15),
    color: '#0F172A',
    paddingVertical: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    marginTop: vs(6),
    marginBottom: vs(2),
  },

  // ── Terms ────────────────────────────────────────────────────────────────────
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: hs(10),
    marginTop: vs(16),
    marginBottom: vs(2),
  },
  checkbox: {
    width: CHECKBOX,
    height: CHECKBOX,
    borderRadius: ms(5),
    borderWidth: 1.8,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(1),
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  termsText: {
    flex: 1,
    fontSize: fs(12),
    color: '#475569',
    fontFamily: 'Poppins-Regular',
    lineHeight: fs(18),
  },
  termsLink: { color: '#2563EB', fontWeight: '700' },

  // ── Button ────────────────────────────────────────────────────────────────────
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    backgroundColor: '#2563EB',
    borderRadius: ms(14),
    paddingVertical: vs(15),
    marginTop: vs(20),
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
  },
  btnTextDisabled: { color: '#94A3B8' },
});

export default Login;
