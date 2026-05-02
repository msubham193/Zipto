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

const Register = () => {
  const navigation = useNavigation<any>();
  const { emailRegister, isLoading, error: authError, clearError } = useAuthStore();

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [heroHeight, setHeroHeight]   = useState(HERO_HEIGHT_OPEN);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      setHeroHeight(HERO_HEIGHT_CLOSED);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
      setHeroHeight(HERO_HEIGHT_OPEN);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    return () => { clearError(); };
  }, []);

  const isButtonEnabled = name.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

  const handleRegister = async () => {
    if (!name.trim())    { setError('Please enter your name'); return; }
    if (!email.trim())   { setError('Please enter your email'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    try {
      await emailRegister(name.trim(), email.trim().toLowerCase(), password);
      // Navigation handled by RootNavigator when isAuthenticated → true
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
                source={require('../assets/images/OTP.png')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.contentWrapper}>
            <View style={styles.content}>
              <View style={styles.formSection}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Fill in your details to get started.
                </Text>

                {/* Name */}
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={t => { setName(t); setError(''); }}
                  />
                </View>

                {/* Email */}
                <Text style={[styles.label, { marginTop: scaleH(16) }]}>Email</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={t => { setEmail(t); setError(''); }}
                  />
                </View>

                {/* Password */}
                <Text style={[styles.label, { marginTop: scaleH(16) }]}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={t => { setPassword(t); setError(''); }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, !isButtonEnabled && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  activeOpacity={isButtonEnabled ? 0.8 : 1}
                  disabled={!isButtonEnabled || isLoading}
                >
                  <Text style={styles.registerButtonText}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Text>
                  <Image
                    source={require('../assets/images/arrow.png')}
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>

                {/* Back to login */}
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
                  By creating an account, you agree to our{' '}
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

const arrowIconSize = ms(22);

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView:   { flex: 1 },
  scrollContent:  { flexGrow: 1 },
  contentWrapper: { flex: 1, paddingHorizontal: scaleW(20) },
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
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: fs(15),
    paddingVertical: scaleH(16),
  },
  eyeBtn: { paddingHorizontal: scaleW(8), paddingVertical: scaleH(16) },
  eyeText: { fontSize: fs(18) },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    fontFamily: 'Poppins-Regular',
    marginTop: scaleH(8),
    marginBottom: scaleH(4),
  },
  registerButton: {
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: scaleH(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleH(24),
    marginBottom: scaleH(16),
  },
  registerButtonDisabled: { backgroundColor: '#93C5FD' },
  registerButtonText: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    marginRight: scaleW(8),
  },
  arrowIcon: {
    width: arrowIconSize,
    height: arrowIconSize,
    tintColor: '#eaecf1',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: scaleH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(6),
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

export default Register;
