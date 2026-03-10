import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
// ─────────────────────────────────────────────────────────────────────────────

const SavedAddresses = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const addresses = [
    { id: 1, type: 'Home',  address: '123 Main Street, Chandrasekharpur, Bhubaneswar, Odisha 751001', isDefault: true  },
    { id: 2, type: 'Work',  address: '456 Park Avenue, Patia, Bhubaneswar, Odisha 751024',            isDefault: false },
    { id: 3, type: 'Other', address: '789 Lake View Road, Saheed Nagar, Bhubaneswar, Odisha 751007',  isDefault: false },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Addresses</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Address cards */}
          {addresses.map(item => (
            <View key={item.id} style={styles.addressCard}>
              {/* Card header row */}
              <View style={styles.addressHeader}>
                <View style={styles.addressTypeContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons
                      name={item.type === 'Home' ? 'home' : item.type === 'Work' ? 'work' : 'location-on'}
                      size={ms(20)}
                      color="#3B82F6"
                    />
                  </View>
                  <Text style={styles.addressType}>{item.type}</Text>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <MaterialIcons name="edit" size={ms(18)} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Address text */}
              <Text style={styles.addressText}>{item.address}</Text>

              {/* Action row */}
              <View style={styles.addressActions}>
                {!item.isDefault ? (
                  <TouchableOpacity style={styles.addressActionButton}>
                    <MaterialIcons name="check-circle-outline" size={ms(16)} color="#3B82F6" />
                    <Text style={styles.addressActionText}>Set as Default</Text>
                  </TouchableOpacity>
                ) : (
                  // Keep the delete button right-aligned when "Set as Default" is absent
                  <View />
                )}
                <TouchableOpacity style={styles.deleteButton}>
                  <MaterialIcons name="delete-outline" size={ms(20)} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add New Address */}
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="add-circle-outline" size={ms(24)} color="#3B82F6" />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>

          {/* Info card */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={ms(20)} color="#3B82F6" />
            <Text style={styles.infoText}>
              Your default address will be used for all deliveries unless you choose a different one during checkout.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize  = ms(40);
const iconContSize = ms(36);
const editBtnSize  = ms(36);
const deleteBtnSize = ms(36);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea:  { flex: 1 },

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

  scrollView:    { flex: 1 },
  scrollContent: { padding: scaleW(16) },

  // ── Address card ──
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(16),
    marginBottom: scaleH(12),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleH(10),
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(8),
    flex: 1,
  },
  iconContainer: {
    width: iconContSize,
    height: iconContSize,
    borderRadius: iconContSize / 2,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  addressType: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: scaleW(8),
    paddingVertical: scaleH(3),
    borderRadius: ms(6),
  },
  defaultBadgeText: {
    fontSize: fs(11),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#16A34A',
  },
  editButton: {
    width: editBtnSize,
    height: editBtnSize,
    borderRadius: editBtnSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  addressText: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    lineHeight: fs(14) * 1.6,
    marginBottom: scaleH(12),
  },

  // ── Action row ──
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleH(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addressActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(6),
    paddingVertical: scaleH(6),
    paddingHorizontal: scaleW(12),
    backgroundColor: '#EFF6FF',
    borderRadius: ms(8),
  },
  addressActionText: {
    fontSize: fs(13),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },
  deleteButton: {
    width: deleteBtnSize,
    height: deleteBtnSize,
    borderRadius: deleteBtnSize / 2,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Add button ──
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleW(8),
    backgroundColor: '#FFFFFF',
    paddingVertical: scaleH(18),
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    marginBottom: scaleH(16),
  },
  addButtonText: {
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },

  // ── Info card ──
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: ms(14),
    borderRadius: ms(10),
    gap: scaleW(10),
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#1E40AF',
    lineHeight: fs(13) * 1.55,
  },
});

export default SavedAddresses;