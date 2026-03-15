import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Image,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { vehicleApi, VehiclePricing } from '../api/vehicle';

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

const VEHICLE_IMAGES: Record<string, any> = {
  bike:       require('../assets/images/vehicle2.png'),
  scooty:     require('../assets/images/scooter.png'),
  auto:       require('../assets/images/vehicle1.png'),
  pickup:     require('../assets/images/vehicle3.png'),
  mini_truck: require('../assets/images/vehicle3.png'),
  tata_ace:   require('../assets/images/vehicle3.png'),
  tata_407:   require('../assets/images/vehicle3.png'),
};

export interface UIVehicle {
  id: string;
  vehicleType: string;
  name: string;
  priceRange: string;
  basePrice: number;
  perKmRate: number;
  minimumFare: number;
  capacity: string;
  helperCharge: number;
  helperAvailable: boolean;
  bestFor: string | null;
  city: string;
  perMinuteRate: number;
  nightSurchargePercent: number;
  multiStopFee: number;
}

const formatVehicleName = (vehicleType: string): string =>
  vehicleType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const VehicleSelection = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [helperCount, setHelperCount]         = useState(0);
  const [vehicles, setVehicles]               = useState<UIVehicle[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  const {
    pickup, drop, pickupCoords, dropCoords,
    city, serviceCategory, senderName, senderMobile,
  } = route.params || {};

  const fadeAnim    = useRef(new Animated.Value(1)).current;
  const slideAnim   = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => { fetchVehicleTypes(); }, []);

  const fetchVehicleTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Auth Token:', token ? 'Exists' : 'Missing');

      const response: any = await vehicleApi.getVehiclePricing();

      let vehiclesData: VehiclePricing[] = [];
      if (Array.isArray(response)) vehiclesData = response;
      else if (response && Array.isArray(response.data)) vehiclesData = response.data;

      if (vehiclesData.length > 0) {
        const transformedVehicles: UIVehicle[] = vehiclesData
          .filter((v: VehiclePricing) => v.is_active)
          .map((vehicle: VehiclePricing) => {
            const capMin = vehicle.capacity_min || 0;
            const capMax = vehicle.capacity_max || 0;
            const capacity =
              capMin > 0 && capMax > 0 ? `${capMin}–${capMax} kg`
              : capMax > 0 ? `Up to ${capMax} kg`
              : 'Any load';
            return {
              id: vehicle.id,
              vehicleType: vehicle.vehicle_type,
              name: formatVehicleName(vehicle.vehicle_type),
              priceRange: `From ₹${vehicle.minimum_fare || vehicle.base_fare}`,
              basePrice: parseFloat(vehicle.base_fare),
              perKmRate: parseFloat(vehicle.per_km_rate),
              minimumFare: parseFloat(vehicle.minimum_fare),
              capacity,
              helperCharge: parseFloat(vehicle.helper_charge_per_person) || 200,
              helperAvailable: vehicle.helper_available,
              bestFor: vehicle.best_for,
              city: vehicle.city,
              perMinuteRate: parseFloat(vehicle.per_minute_rate),
              nightSurchargePercent: parseFloat(vehicle.night_surcharge_percent),
              multiStopFee: parseFloat(vehicle.multi_stop_fee),
            };
          });
        setVehicles(transformedVehicles);
      } else {
        throw new Error('No vehicle data received');
      }
    } catch (err) {
      console.error('Error fetching vehicle types:', err);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedVehicleData = (): UIVehicle | undefined =>
    vehicles.find(v => v.id === selectedVehicle);

  const handleBook = () => {
    const vehicle = getSelectedVehicleData();
    if (!vehicle) return;
    const helperCost = helperCount * vehicle.helperCharge;
    navigation.navigate('FareEstimate', {
      vehicle, pickup, drop, pickupCoords, dropCoords,
      hasHelper: helperCount > 0, helperCount, helperCost,
      city, serviceCategory, senderName, senderMobile,
    });
  };

  const calculateTotalPrice = (): string => {
    const vehicle = getSelectedVehicleData();
    if (!vehicle) return '₹0';
    return `₹${(vehicle.minimumFare + helperCount * vehicle.helperCharge).toFixed(0)}`;
  };

  // ── Vehicle Card ─────────────────────────────────────────────────────────
  const renderVehicleCard = ({ item }: { item: UIVehicle }) => {
    const isSelected   = selectedVehicle === item.id;
    const vehicleImage = item.vehicleType
      ? VEHICLE_IMAGES[item.vehicleType.toLowerCase()]
      : undefined;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => setSelectedVehicle(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.vehicleIcon, isSelected && styles.vehicleIconSelected]}>
            {vehicleImage ? (
              <Image source={vehicleImage} style={styles.vehicleImage} resizeMode="contain" />
            ) : (
              <Text style={styles.emoji}>🚛</Text>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.details} numberOfLines={2}>
              {item.capacity}{item.bestFor ? ` • ${item.bestFor}` : ''}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text
              style={[styles.priceRange, isSelected && styles.priceRangeSelected]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {item.priceRange}
            </Text>
            {isSelected && (
              <Icon name="check-circle" size={ms(20)} color="#10B981" style={styles.checkIcon} />
            )}
          </View>
        </View>

        <View style={styles.rateRow}>
          <Text style={styles.rateText}>₹{item.perKmRate}/km</Text>
          <Text style={styles.rateSeparator}> · </Text>
          <Text style={styles.rateText}>Min ₹{item.minimumFare}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Detail panel ─────────────────────────────────────────────────────────
  const renderSelectedDetails = () => {
    const vehicle = getSelectedVehicleData();
    if (!vehicle) return null;
    return (
      <View style={styles.detailPanel}>
        <Text style={styles.detailPanelTitle}>{vehicle.name} — Fare Details</Text>
        <View style={styles.detailGrid}>
          <DetailRow label="Base Fare"       value={`₹${vehicle.basePrice}`} />
          <DetailRow label="Min Fare"        value={`₹${vehicle.minimumFare}`} />
          <DetailRow label="Per KM"          value={`₹${vehicle.perKmRate}`} />
          <DetailRow label="Per Minute"      value={`₹${vehicle.perMinuteRate}`} />
          <DetailRow label="Night Surcharge" value={`${vehicle.nightSurchargePercent}%`} />
          <DetailRow label="Multi-stop Fee"  value={`₹${vehicle.multiStopFee}`} />
          <DetailRow label="Helper Charge"   value={`₹${vehicle.helperCharge}/person`} />
          <DetailRow label="City"            value={vehicle.city} />
        </View>
      </View>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.sectionTitle}>Available Vehicles</Text>
    </View>
  );

  // const renderListFooter = () => {
  //   const selectedVehicleData = getSelectedVehicleData();
  //   const showHelper = selectedVehicleData?.helperAvailable === true;
  //   return (
  //     <>
  //       {renderSelectedDetails()}
  //       {showHelper && (
  //         <View style={styles.helperSection}>
  //           <Text style={styles.sectionTitle}>Additional Services</Text>
  //           <View style={[styles.helperCard, helperCount > 0 && styles.helperCardSelected]}>
  //             <View style={styles.helperIconContainer}>
  //               <Image
  //                 source={require('../assets/images/worker.png')}
  //                 style={styles.helperImage}
  //                 resizeMode="contain"
  //               />
  //             </View>
  //             <View style={styles.helperInfo}>
  //               <Text style={styles.helperTitle}>Add Labour</Text>
  //               <Text style={styles.helperDescription}>
  //                 ₹{selectedVehicleData?.helperCharge ?? 200} per person
  //               </Text>
  //             </View>
  //             <View style={styles.counterContainer}>
  //               {helperCount > 0 ? (
  //                 <>
  //                   <TouchableOpacity
  //                     onPress={() => setHelperCount(h => Math.max(0, h - 1))}
  //                     style={styles.counterButton}
  //                   >
  //                     <Icon name="remove" size={ms(20)} color="#3B82F6" />
  //                   </TouchableOpacity>
  //                   <Text style={styles.counterText}>{helperCount}</Text>
  //                   <TouchableOpacity
  //                     onPress={() => setHelperCount(h => h + 1)}
  //                     style={styles.counterButton}
  //                   >
  //                     <Icon name="add" size={ms(20)} color="#3B82F6" />
  //                   </TouchableOpacity>
  //                 </>
  //               ) : (
  //                 <TouchableOpacity onPress={() => setHelperCount(1)} style={styles.addButton}>
  //                   <Text style={styles.addButtonText}>ADD</Text>
  //                 </TouchableOpacity>
  //               )}
  //             </View>
  //           </View>
  //         </View>
  //       )}
  //     </>
  //   );
  // };

  return (
    <View style={styles.container}>
      {/* Header sits OUTSIDE SafeAreaView so it is never clipped or blocked */}
      <SafeAreaView style={styles.safeAreaHeader} edges={['top']}>
        <View style={styles.header}>
          {/* ✅ FIXED: canGoBack() guard prevents "GO_BACK not handled" error */}
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('PickupDropSelection');
              }
            }}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.6}
          >
            <Icon name="arrow-back" size={ms(24)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Vehicle</Text>
        </View>
      </SafeAreaView>

      {/* Body */}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading vehicles...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={ms(48)} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchVehicleTypes}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="refresh" size={ms(20)} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={item => item.id}
            renderItem={renderVehicleCard}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            extraData={selectedVehicle}
          />
        )}
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        {selectedVehicle && (
          <View style={styles.priceBreakdown}>
            <View>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              {helperCount > 0 && (
                <Text style={styles.helperBreakdown}>
                  +{helperCount} helper{helperCount > 1 ? 's' : ''} (₹
                  {helperCount * (getSelectedVehicleData()?.helperCharge ?? 300)})
                </Text>
              )}
            </View>
            <Text style={styles.totalPrice}>{calculateTotalPrice()}</Text>
          </View>
        )}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.nextButton, !selectedVehicle && styles.nextButtonDisabled]}
            onPress={handleBook}
            disabled={!selectedVehicle}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextButtonText, !selectedVehicle && styles.nextButtonTextDisabled]}>
              Continue to Book
            </Text>
            <Image
              source={require('../assets/images/arrow.png')}
              style={[styles.arrowIcon, !selectedVehicle && styles.arrowDisabled]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// ── Detail row ───────────────────────────────────────────────────────────────
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// ─── Derived responsive values ────────────────────────────────────────────────
const vehicleIconW    = ms(72);
const vehicleIconH    = ms(64);
const vehicleImageW   = ms(56);
const vehicleImageH   = ms(50);
const helperIconSize  = ms(50);
const helperImageSize = ms(28);
const backBtnSize     = ms(40);
const arrowIconSize   = ms(20);
const priceColWidth   = scaleW(88);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeAreaHeader: { backgroundColor: '#FFFFFF' },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(14),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: scaleW(14),
    width: backBtnSize,
    height: backBtnSize,
    borderRadius: backBtnSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    zIndex: 10,
  },
  headerTitle: { fontSize: fs(22), fontWeight: 'bold', color: '#1E293B' },

  // ── List ──
  content: { flex: 1 },
  listContent: {
    paddingHorizontal: scaleW(16),
    paddingTop: scaleH(12),
    paddingBottom: scaleH(24),
  },
  listHeader:   { marginBottom: scaleH(8) },
  sectionTitle: {
    fontSize: fs(17),
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: scaleH(10),
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ms(14),
    paddingTop: ms(14),
    paddingBottom: ms(10),
    marginBottom: scaleH(10),
    borderRadius: ms(14),
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleH(6),
  },
  vehicleIcon: {
    width: vehicleIconW,
    height: vehicleIconH,
    borderRadius: ms(10),
    backgroundColor: 'rgba(59,130,246,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(12),
    overflow: 'hidden',
    flexShrink: 0,
  },
  vehicleIconSelected: { backgroundColor: 'rgba(59,130,246,0.15)' },
  vehicleImage: { width: vehicleImageW, height: vehicleImageH },
  emoji: { fontSize: fs(30) },
  info: { flex: 1, paddingRight: scaleW(4) },
  name: {
    fontSize: fs(16),
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: scaleH(2),
  },
  details: {
    fontSize: fs(12),
    color: '#64748B',
    lineHeight: fs(12) * 1.45,
  },
  priceContainer: {
    width: priceColWidth,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  priceRange: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'right',
  },
  priceRangeSelected: { color: '#2563EB' },
  checkIcon: { marginTop: scaleH(5), alignSelf: 'flex-end' },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: vehicleIconW + scaleW(12),
  },
  rateText:      { fontSize: fs(12), color: '#3B82F6', fontWeight: '600' },
  rateSeparator: { fontSize: fs(12), color: '#94A3B8' },

  // ── Detail Panel ──
  detailPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: ms(14),
    marginBottom: scaleH(16),
  },
  detailPanelTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: scaleH(10),
  },
  detailGrid: { gap: scaleH(4) },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scaleH(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: { fontSize: fs(12), color: '#64748B' },
  detailValue: { fontSize: fs(12), fontWeight: '600', color: '#1E293B' },

  // ── Helper ──
  helperSection: { marginTop: scaleH(4), marginBottom: scaleH(10) },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ms(14),
    borderRadius: ms(12),
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helperCardSelected: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  helperIconContainer: {
    width: helperIconSize,
    height: helperIconSize,
    borderRadius: ms(10),
    backgroundColor: 'rgba(16,185,129,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(12),
  },
  helperImage:       { width: helperImageSize, height: helperImageSize },
  helperInfo:        { flex: 1 },
  helperTitle:       { fontSize: fs(15), fontWeight: 'bold', color: '#1E293B', marginBottom: scaleH(3) },
  helperDescription: { fontSize: fs(12), color: '#64748B' },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(8),
    padding: ms(4),
  },
  counterButton: { padding: ms(4), backgroundColor: '#E2E8F0', borderRadius: ms(4) },
  counterText: {
    fontSize: fs(15),
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: scaleW(10),
  },
  addButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: scaleW(14),
    paddingVertical: scaleH(7),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addButtonText: { color: '#3B82F6', fontWeight: '600', fontSize: fs(13) },

  // ── Footer ──
  footer: {
    paddingHorizontal: scaleW(16),
    paddingTop: scaleH(12),
    paddingBottom: scaleH(14),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  priceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleH(12),
  },
  totalLabel:      { fontSize: fs(14), color: '#64748B', fontWeight: '600' },
  helperBreakdown: { fontSize: fs(11), color: '#10B981', marginTop: scaleH(2) },
  totalPrice:      { fontSize: fs(22), fontWeight: 'bold', color: '#1E293B' },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: ms(12),
    paddingVertical: scaleH(15),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: { backgroundColor: '#E2E8F0' },
  nextButtonText: {
    fontSize: fs(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: scaleW(8),
  },
  nextButtonTextDisabled: { color: '#94A3B8' },
  arrowIcon: {
    width: arrowIconSize,
    height: arrowIconSize,
    tintColor: '#FFFFFF',
  },
  arrowDisabled: { tintColor: '#94A3B8' },

  // ── Loading / Error ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleH(60),
  },
  loadingText: { marginTop: scaleH(14), fontSize: fs(15), color: '#64748B' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleH(60),
    paddingHorizontal: scaleW(40),
  },
  errorText: {
    marginTop: scaleH(14),
    fontSize: fs(15),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: scaleH(20),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: scaleW(22),
    paddingVertical: scaleH(11),
    borderRadius: ms(8),
    gap: scaleW(8),
  },
  retryButtonText: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '600' },
});

export default VehicleSelection;