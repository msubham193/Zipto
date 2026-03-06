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
  Modal,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';

/* Success Modal Component */
const SuccessModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={() => {}}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.successIconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.modalTitle}>Verification Successful!</Text>
        <Text style={styles.modalMessage}>
          Your account has been verified successfully. Welcome to Zipto!
        </Text>
        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

/* OTP Box Component */
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
      {/* Hidden real input */}
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
      {/* 6 visual boxes */}
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

const OTPVerification = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { verifyOtp, isLoading, error: authError } = useAuthStore();

  const { mobile, fullMobile } = route.params || { mobile: '', fullMobile: '' };

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [heroHeight, setHeroHeight] = useState(250);

  const heroScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      setHeroHeight(120);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
      setHeroHeight(250);
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
      setShowSuccessModal(true);
    } catch (err: any) {
      console.log('Verification error', err);
      setError(err?.message || 'Verification failed. Please try again.');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleResendOTP = () => {
    console.log('Resend OTP');
  };

  return (
    <SafeAreaView style={styles.container}>
      <SuccessModal visible={showSuccessModal} onClose={handleSuccessModalClose} />
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
          <Animated.View style={[styles.heroContainer, { transform: [{ scale: heroScale }] }]}>
            <View style={[styles.heroCard, { height: heroHeight }]}>
              <Image
                source={require('../assets/images/heroimg3.jpg')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <View style={styles.contentWrapper}>
            <Animated.View
              style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
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
                  {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
                </View>

                {/* Resend OTP */}
                <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton} activeOpacity={0.7}>
                  <Text style={styles.resendText}>
                    Didn't receive code?{' '}
                    <Text style={styles.resendLink}>Resend OTP</Text>
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
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  contentWrapper: { flex: 1, paddingHorizontal: 20 },

  /* Hero */
  heroContainer: { paddingHorizontal: 20, paddingTop: 10 },
  heroCard: {
    height: 250,
    borderRadius: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  /* Content */
  content: { flex: 1, paddingTop: 20, paddingBottom: 20 },
  formSection: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: 22,
    marginBottom: 40,
  },

  /* OTP */
  otpContainer: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontWeight: '600',
    marginBottom: 12,
  },

  /* OTP Boxes */
  otpBoxesWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
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
  otpBoxError: {
    borderColor: '#EF4444',
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Poppins-Regular',
  },
 arrowIcon: {
    width: 22,
    height: 22,
    tintColor: '#eaecf1',
  },
  backIcon:{
      width: 22,
    height: 22,
    tintColor: '#eaecf1',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 8,
    marginLeft: 4,
  },

  /* Resend */
  resendButton: { alignSelf: 'center', marginBottom: 30 },
  resendText: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#64748B' },
  resendLink: { color: '#2563EB', fontWeight: '600', fontFamily: 'Poppins-Regular' },

  /* Verify */
  verifyButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    marginRight: 8,
  },
  arrow: { fontSize: 18, color: '#FFFFFF' },

  /* Back */
  backButton: { alignSelf: 'center', paddingVertical: 12 },
  backText: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#64748B', fontWeight: '500' },

  /* Footer */
  termsText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  link: { color: '#2563EB' },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: '600', fontFamily: 'Poppins-Regular' },
});

export default OTPVerification;