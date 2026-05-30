import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/client';
import { referralApi } from '../api/referral';
import { popReferralCode } from '../utils/referral';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

const ProfileSetup = () => {
  const navigation = useNavigation<any>();
  const { user, fetchProfile, setNeedsProfileSetup } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [referral, setReferral] = useState('');
  const [referralError, setReferralError] = useState('');

  // Pre-fill a referral code captured from a deep link (zipto://refer?code=…)
  useEffect(() => {
    popReferralCode().then(code => { if (code) setReferral(code); });
  }, []);

  const avatarScale = useRef(new Animated.Value(0)).current;

  // ── Text-only animations: native driver is safe here (no interactive children) ──
  const textFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(-30)).current;

  // ── Interactive area slide-up: native driver safe (translateY never blocks touches on Android) ──
  const inputTranslateY = useRef(new Animated.Value(40)).current;

  // Ref to manually focus the input (makes the whole input container tappable)
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.sequence([
      // 1. Avatar pops in
      Animated.spring(avatarScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      // 2. Title + subtitle slide up (native driver — Text is non-interactive)
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 3. Input + button slide up — native driver (translateY is 100% safe for touches)
      Animated.timing(inputTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [avatarScale, textFade, textSlide, inputTranslateY]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.trim().substring(0, 2).toUpperCase() || 'U';
  };

  const handleSave = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setError('Please enter your name');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    Keyboard.dismiss();
    setSaving(true);
    setError('');

    try {
      await authApi.updateCustomerProfile({ name: trimmed });

      // Apply referral code if entered — block navigation only on a real
      // referral error so the user can correct or clear it. The profile save
      // above is idempotent, so retrying is safe.
      const code = referral.trim().toUpperCase();
      if (code) {
        try {
          await referralApi.apply(code);
        } catch (refErr: any) {
          const raw =
            refErr?.response?.data?.message ?? refErr?.message ?? 'Invalid referral code';
          setReferralError(Array.isArray(raw) ? raw.join('\n') : String(raw));
          setSaving(false);
          return;
        }
      }

      await fetchProfile();
      setNeedsProfileSetup(false);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update profile';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    setNeedsProfileSetup(false);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Skip — on root container so it never competes with scroll/input touches */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar: scale only, native driver safe ── */}
          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: avatarScale }] },
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(fullName || user?.name || 'U')}
              </Text>
            </View>
            <View style={styles.avatarBadge}>
              <Icon name="edit" size={ms(14)} color="#FFFFFF" />
            </View>
          </Animated.View>

          {/* ── Title + Subtitle ONLY — no interactive children, native driver safe ── */}
          <Animated.View
            style={[
              styles.textContent,
              { opacity: textFade, transform: [{ translateY: textSlide }] },
            ]}
            pointerEvents="box-none"
          >
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>
              Let us know your real name so drivers{'\n'}can identify you easily
            </Text>
          </Animated.View>

          {/* ── Interactive area: slide-up animation (native driver) + whole container is now tappable ── */}
          <Animated.View
            style={[
              styles.interactiveArea,
              { transform: [{ translateY: inputTranslateY }] },
            ]}
          >
            {/* Input — whole container is now TouchableOpacity so tapping anywhere focuses it */}
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  isFocused && styles.inputContainerFocused,
                  !!error && styles.inputContainerError,
                ]}
                activeOpacity={1}
                disabled={saving}
                onPress={() => inputRef.current?.focus()}
              >
                <Icon
                  name="person-outline"
                  size={ms(22)}
                  color={isFocused ? '#2563EB' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={t => {
                    setFullName(t);
                    if (error) setError('');
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  maxLength={50}
                  editable={!saving}
                />
                {fullName.length > 0 && !saving && (
                  <TouchableOpacity
                    onPress={() => {
                      setFullName('');
                      setError('');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={ms(20)} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {!!error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Referral code (optional) */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  !!referralError && styles.inputContainerError,
                ]}
              >
                <Icon
                  name="card-giftcard"
                  size={ms(22)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Referral code (optional)"
                  placeholderTextColor="#94A3B8"
                  value={referral}
                  onChangeText={t => {
                    setReferral(t.toUpperCase());
                    if (referralError) setReferralError('');
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={12}
                  editable={!saving}
                />
                {referral.length > 0 && !saving && (
                  <TouchableOpacity
                    onPress={() => {
                      setReferral('');
                      setReferralError('');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={ms(20)} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
              {referralError ? (
                <Text style={styles.errorText}>{referralError}</Text>
              ) : (
                <Text style={styles.referralHint}>
                  Have a code? Earn bonus coins after your first order.
                </Text>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Continue</Text>
                  <Icon name="arrow-forward" size={ms(20)} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const avatarSize = ms(96);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: hs(24),
    paddingTop: vs(60),
    alignItems: 'center',
  },

  // ── Skip ──
  skipButton: {
    position: 'absolute',
    top: vs(52),
    right: hs(24),
    zIndex: 10,
    paddingHorizontal: hs(16),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    backgroundColor: '#F1F5F9',
  },
  skipText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#64748B',
  },

  // ── Avatar ──
  avatarContainer: {
    marginTop: vs(40),
    marginBottom: vs(32),
    position: 'relative',
  },
  avatar: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: '#EFF6FF',
    borderWidth: 3,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fs(32),
    fontWeight: '700',
    color: '#2563EB',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // ── Text-only animated block ──
  textContent: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: fs(26),
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: vs(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fs(15),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(15) * 1.5,
    marginBottom: vs(36),
  },

  // ── Interactive area — now uses translateY (native driver) ──
  interactiveArea: {
    width: '100%',
    alignItems: 'center',
  },

  // ── Input ──
  inputWrapper: {
    width: '100%',
    marginBottom: vs(24),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: hs(16),
    height: vs(56),
  },
  inputContainerFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: hs(12),
  },
  input: {
    flex: 1,
    fontSize: fs(16),
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    marginTop: vs(8),
    marginLeft: hs(4),
  },
  referralHint: {
    color: '#64748B',
    fontSize: fs(12),
    marginTop: vs(8),
    marginLeft: hs(4),
  },

  // ── Button ──
  saveButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: ms(14),
    paddingVertical: vs(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: hs(8),
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: fs(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileSetup;