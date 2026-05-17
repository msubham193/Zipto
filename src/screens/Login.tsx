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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

const HERO_HEIGHT_OPEN   = scaleH(250);
const HERO_HEIGHT_CLOSED = scaleH(120);

const Login = () => {
  const navigation = useNavigation<any>();
  const [phone, setPhone]           = useState('');
  const [error, setError]           = useState('');
  const [heroHeight, setHeroHeight] = useState(HERO_HEIGHT_OPEN);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const { login, isLoading, error: authError, clearError } = useAuthStore();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setHeroHeight(HERO_HEIGHT_CLOSED);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setHeroHeight(HERO_HEIGHT_OPEN);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    return () => { clearError(); };
  }, []);

  const isButtonEnabled = phone.trim().length >= 10 && termsAgreed;

  const handleGetOTP = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    if (!termsAgreed) { setError('Please agree to the Terms & Privacy Policy to continue.'); return; }
    setError('');
    try {
      await login(trimmed);
      navigation.navigate('OTPVerification', { mobile: trimmed });
    } catch {
      // error displayed via authError from store
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
            <View style={[styles.heroCard, { height: heroHeight }]}>
              <Image
                source={require('../assets/images/number.png')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.contentWrapper}>
            <View style={styles.content}>
              <View style={styles.formSection}>
                <Text style={styles.title}>Welcome to Zipto</Text>
                <Text style={styles.subtitle}>
                  Enter your mobile number to get started.
                </Text>

                {/* Phone Number */}
                <Text style={styles.label}>Mobile Number</Text>
                <View style={[styles.inputContainer, !!error && !phone && styles.inputError]}>
                  <Image
                    source={require('../assets/images/cell-phone.png')}
                    style={styles.inputIcon}
                    resizeMode="contain"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={t => { setPhone(t); setError(''); }}
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

                {/* Terms checkbox */}
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
                    <Text style={styles.checkboxLink} onPress={() => Alert.alert('Terms of Service', 'Terms content here.')}>
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text style={styles.checkboxLink} onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content here.')}>
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
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const phoneIconSize = ms(28);
const arrowIconSize = ms(22);
const checkboxSize  = ms(20);

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView:     { flex: 1 },
  scrollContent:    { flexGrow: 1 },
  contentWrapper:   { flex: 1, paddingHorizontal: scaleW(20) },
  heroContainer: {
    paddingHorizontal: scaleW(20),
    paddingTop: scaleH(10),
  },
  heroCard: {
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
  content:     { flex: 1, paddingTop: scaleH(20), paddingBottom: scaleH(20) },
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
    marginBottom: scaleH(32),
  },
  label: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '600',
    marginBottom: scaleH(8),
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    paddingHorizontal: scaleW(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    width: phoneIconSize,
    height: phoneIconSize,
    marginRight: scaleW(8),
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: fs(15),
    paddingVertical: scaleH(16),
  },
  inputError: { borderColor: '#EF4444' },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    marginTop: scaleH(6),
    marginBottom: scaleH(4),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scaleH(18),
    marginBottom: scaleH(4),
    gap: scaleW(10),
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
    marginTop: scaleH(1),
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkmark: {
    color: '#FFFFFF',
    fontSize: fs(12),
    fontWeight: '800',
    lineHeight: fs(14),
  },
  checkboxLabel: {
    flex: 1,
    fontSize: fs(13),
    color: '#475569',
    fontFamily: 'Poppins-Regular',
    lineHeight: fs(20),
  },
  checkboxLink:    { color: '#2563EB', fontWeight: '600' },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: scaleH(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleH(20),
    marginBottom: scaleH(12),
  },
  loginButtonDisabled: { backgroundColor: '#93C5FD' },
  loginButtonText: {
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
});

export default Login;
