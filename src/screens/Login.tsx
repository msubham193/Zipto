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
  Keyboard,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import {
  horizontalScale as hs,
  verticalScale as vs,
  moderateScale as ms,
  fontScale as fs,
} from '../utils/metrics';

const HERO_H_OPEN   = vs(300);
const HERO_H_CLOSED = vs(130);
const CARD_RADIUS   = ms(28);

const Login = () => {
  const navigation = useNavigation<any>();
  const [phone, setPhone]         = useState('');
  const [error, setError]         = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const heroHeight = useRef(new Animated.Value(HERO_H_OPEN)).current;

  const { login, isLoading, error: authError, clearError } = useAuthStore();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(heroHeight, {
        toValue: HERO_H_CLOSED,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(heroHeight, {
        toValue: HERO_H_OPEN,
        duration: 220,
        useNativeDriver: false,
      }).start();
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E22AD" translucent={false} />

      {/* Hero image — full width, no border or card */}
      <Animated.Image
        source={require('../assets/images/number.png')}
        style={[styles.heroImage, { height: heroHeight }]}
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
            <Text style={styles.title}>Welcome to Zipto</Text>
            <Text style={styles.subtitle}>Enter your mobile number to get started.</Text>

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
                  onPress={() => Alert.alert('Terms of Service', 'Terms content here.')}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.checkboxLink}
                  onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content here.')}
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
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const phoneIconSize = ms(28);
const arrowIconSize = ms(22);
const checkboxSize  = ms(20);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E22AD',
  },
  heroImage: {
    width: '100%',
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
    paddingTop: vs(28),
    paddingBottom: vs(32),
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
  },
  label: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '600',
    marginBottom: vs(8),
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    paddingHorizontal: hs(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    width: phoneIconSize,
    height: phoneIconSize,
    marginRight: hs(8),
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: fs(15),
    paddingVertical: vs(16),
  },
  inputError: { borderColor: '#EF4444' },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    marginTop: vs(6),
    marginBottom: vs(4),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vs(18),
    marginBottom: vs(4),
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
  checkboxLink: { color: '#2563EB', fontWeight: '600' },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: vs(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(20),
    marginBottom: vs(12),
  },
  loginButtonDisabled: { backgroundColor: '#93C5FD' },
  loginButtonText: {
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
});

export default Login;
