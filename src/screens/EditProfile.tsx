import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/client';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

const ms = (size: number, factor = 0.45) =>
  size + (scaleW(size) - size) * factor;

const fs = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(ms(size)));
// ─────────────────────────────────────────────────────────────────────────────

const EditProfile = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, profile, fetchProfile, setNeedsProfileSetup } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
    if (profile) {
      setAddress(profile.address || '');
    }
  }, [user, profile]);

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }
    setIsLoading(true);
    try {
      const payload = { name, email, address, language_preference: 'en' };
      await authApi.updateCustomerProfile(payload);
      await fetchProfile();
      setNeedsProfileSetup(false);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.largeAvatar}>
              <MaterialIcons name="person" size={ms(60)} color="#FFFFFF" />
            </View>
            <TouchableOpacity style={styles.changePhotoButton}>
              <MaterialIcons name="camera-alt" size={ms(18)} color="#3B82F6" />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize = ms(40);
const avatarSize = ms(120);
const textAreaH = scaleH(100);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: backBtnSize,
    height: backBtnSize,
    borderRadius: backBtnSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  placeholder: { width: backBtnSize },

  scrollView: { flex: 1 },

  // ── Avatar ──
  avatarSection: {
    alignItems: 'center',
    paddingVertical: scaleH(32),
    backgroundColor: '#FFFFFF',
  },
  largeAvatar: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(16),
    borderWidth: 3,
    borderColor: '#60A5FA',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(8),
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(8),
    borderRadius: ms(20),
    backgroundColor: '#EFF6FF',
  },
  changePhotoText: {
    color: '#3B82F6',
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },

  // ── Form ──
  formSection: { padding: scaleW(16) },
  inputGroup: { marginBottom: scaleH(20) },
  inputLabel: {
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(8),
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(12),
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(14),
    fontSize: fs(15),
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  textArea: {
    height: textAreaH,
    textAlignVertical: 'top',
    paddingTop: scaleH(14),
  },

  // ── Save Button ──
  buttonContainer: {
    padding: scaleW(16),
    paddingBottom: scaleH(32),
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: scaleH(16),
    borderRadius: ms(12),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
});

export default EditProfile;
