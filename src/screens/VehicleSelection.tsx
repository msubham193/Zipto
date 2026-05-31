import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Image,
  Dimensions,
  PixelRatio,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { vehicleApi, VehiclePricing } from '../api/vehicle';
import EnterView from '../components/EnterView';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;
const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms = (size: number, factor = 0.45) => size + (scaleW(size) - size) * factor;
const fs = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#F2F2F2',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F7F7F7',
  primary:      '#111111',
  blue:         '#2563EB',
  blueBadge:    '#1D4ED8',
  yellow:       '#FBBF24',
  yellowDeep:   '#F59E0B',
  green:        '#16A34A',
  orange:       '#EA580C',
  purple:       '#7C3AED',
  text:         '#111111',
  textSub:      '#555555',
  textMuted:    '#999999',
  border:       '#E5E5E5',
  borderSel:    '#D1D5DB',
  shadow:       '#000000',
  white:        '#FFFFFF',
  chooseBtn:    '#F5F5F5',
  chooseBorder: '#E0E0E0',
};

// ─── Vehicle Images ───────────────────────────────────────────────────────────
const VEHICLE_IMAGES: Record<string, any> = {
  bike:       require('../assets/images/bike_img.png'),
  scooty:     require('../assets/images/scooter_img.png'),
  auto:       require('../assets/images/auto_img.png'),
  pickup:     require('../assets/images/pickup_img.png'),
  mini_truck: require('../assets/images/truck_img.png'),
  tata_ace:   require('../assets/images/vehicle3.png'),
  tata_407:   require('../assets/images/vehicle3.png'),
};

// ─── ETA ranges per vehicle type ─────────────────────────────────────────────
const VEHICLE_ETA: Record<string, string> = {
  bike:       '20–25',
  scooty:     '25–30',
  auto:       '35–40',
  pickup:     '45–55',
  mini_truck: '60–75',
};

// ─── Vehicle Meta ─────────────────────────────────────────────────────────────
const VEHICLE_META: Record<string, { capacity: string; startingLabel: string; baseAmount: number; tag: string; tagIcon: string; tagColor: string }> = {
  bike:       { capacity: 'Up to 20 kg',   startingLabel: 'From ₹35',  baseAmount: 35,  tag: 'Fastest option',    tagIcon: 'bolt',            tagColor: C.blue    },
  scooty:     { capacity: 'Up to 22 kg',   startingLabel: 'From ₹40',  baseAmount: 40,  tag: 'Budget-friendly',   tagIcon: 'local-offer',     tagColor: C.green   },
  auto:       { capacity: 'Up to 700 kg',  startingLabel: 'From ₹80',  baseAmount: 80,  tag: 'Best for heavy items', tagIcon: 'inventory-2',  tagColor: C.orange  },
  pickup:     { capacity: 'Up to 1.5 ton', startingLabel: 'From ₹150', baseAmount: 150, tag: 'For business needs', tagIcon: 'business-center', tagColor: C.purple  },
  mini_truck: { capacity: 'Up to 2.5 ton', startingLabel: 'From ₹250', baseAmount: 250, tag: 'For bulk shipments', tagIcon: 'inventory',       tagColor: C.blue    },
  tata_ace:   { capacity: 'Up to 1.5 ton', startingLabel: 'From ₹150', baseAmount: 150, tag: 'For business needs', tagIcon: 'business-center', tagColor: C.purple  },
  tata_407:   { capacity: 'Up to 2.5 ton', startingLabel: 'From ₹250', baseAmount: 250, tag: 'For bulk shipments', tagIcon: 'inventory',       tagColor: C.blue    },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UIVehicle {
  id: string;
  vehicleType: string;
  name: string;
  priceRange: string;
  basePrice: number;
  perKmRate: number;
  minimumFare: number;
  baseDistanceKm: number;
  startingFare: number;
  capacity: string;
  startingLabel: string;
  helperCharge: number;
  helperAvailable: boolean;
  bestFor: string | null;
  city: string;
  perMinuteRate: number;
  nightSurchargePercent: number;
  multiStopFee: number;
  eta: string;
  baseAmount: number;
  tag: string;
  tagIcon: string;
  tagColor: string;
}

const formatVehicleName = (vehicleType: string): string =>
  vehicleType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// ─── Component ────────────────────────────────────────────────────────────────
const VehicleSelection = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vehicles, setVehicles]               = useState<UIVehicle[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  const {
    pickup, drop, pickupCoords, dropCoords,
    city, serviceCategory, senderName, senderMobile,
    receiverName, receiverMobile, alternativePhone,
  } = route.params || {};

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchVehicleTypes(); }, []);

  const fetchVehicleTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      await AsyncStorage.getItem('auth_token');
      const response: any = await vehicleApi.getVehiclePricing();

      let vehiclesData: VehiclePricing[] = [];
      if (Array.isArray(response)) vehiclesData = response;
      else if (response && Array.isArray(response.data)) vehiclesData = response.data;

      if (vehiclesData.length > 0) {
        const transformed: UIVehicle[] = vehiclesData
          .filter((v: VehiclePricing) => v.is_active)
          .map((vehicle: VehiclePricing) => {
            const key  = vehicle.vehicle_type.toLowerCase();
            const meta = VEHICLE_META[key] ?? {
              capacity: '—',
              startingLabel: `From ₹${vehicle.base_fare}`,
              baseAmount: parseFloat(vehicle.base_fare),
              tag: '',
              tagIcon: 'info',
              tagColor: C.blue,
            };
            return {
              id: vehicle.id,
              vehicleType: vehicle.vehicle_type,
              name: formatVehicleName(vehicle.vehicle_type),
              priceRange: meta.startingLabel,
              basePrice: parseFloat(vehicle.base_fare),
              perKmRate: parseFloat(vehicle.per_km_rate),
              minimumFare: parseFloat(vehicle.minimum_fare),
              baseDistanceKm: parseFloat(vehicle.base_distance_km) || 2,
              startingFare: parseFloat(vehicle.base_fare),
              capacity: meta.capacity,
              startingLabel: meta.startingLabel,
              helperCharge: parseFloat(vehicle.helper_charge_per_person) || 200,
              helperAvailable: vehicle.helper_available,
              bestFor: vehicle.best_for,
              city: vehicle.city,
              perMinuteRate: parseFloat(vehicle.per_minute_rate),
              nightSurchargePercent: parseFloat(vehicle.night_surcharge_percent),
              multiStopFee: parseFloat(vehicle.multi_stop_fee),
              eta: VEHICLE_ETA[key] ?? '30–40',
              baseAmount: meta.baseAmount,
              tag: meta.tag,
              tagIcon: meta.tagIcon,
              tagColor: meta.tagColor,
            };
          });
        setVehicles(transformed);
      } else {
        throw new Error('No vehicle data received');
      }
    } catch (err) {
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
    navigation.navigate('FareEstimate', {
      vehicle, pickup, drop, pickupCoords, dropCoords,
      hasHelper: false, helperCount: 0, helperCost: 0,
      city, serviceCategory, senderName, senderMobile,
      receiverName, receiverMobile, alternativePhone,
    });
  };

  // ── Vehicle Card ──────────────────────────────────────────────────────────
  const renderVehicleCard = ({ item, index }: { item: UIVehicle; index: number }) => {
    const isSelected   = selectedVehicle === item.id;
    const isFastest    = index === 0;
    const vehicleImage = VEHICLE_IMAGES[item.vehicleType.toLowerCase()];

    return (
      <EnterView delay={Math.min(index * 60, 360)}>
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedVehicle(item.id)}
        activeOpacity={0.85}
      >
        {/* Fastest badge — absolute top-left corner */}
        {isFastest && (
          <View style={styles.fastestBadge}>
            <Text style={styles.fastestText}>Fastest ⚡</Text>
          </View>
        )}

        <View style={styles.cardInner}>
          {/* Vehicle image — large, left side */}
          <View style={styles.imgWrap}>
            {vehicleImage ? (
              <Image source={vehicleImage} style={styles.vehicleImg} resizeMode="contain" />
            ) : (
              <Text style={styles.emoji}>🚛</Text>
            )}
          </View>

          {/* Name + capacity + tag — centre */}
          <View style={styles.infoCol}>
            <Text style={styles.vehicleName}>{item.name}</Text>

            <View style={styles.infoRow}>
              <Icon name="inventory-2" size={ms(13)} color={C.textMuted} />
              <Text style={styles.infoText}>{item.capacity}</Text>
            </View>

            {item.tag ? (
              <View style={styles.infoRow}>
                <Icon name={item.tagIcon as any} size={ms(13)} color={item.tagColor} />
                <Text style={[styles.infoText, { color: item.tagColor }]}>{item.tag}</Text>
              </View>
            ) : null}
          </View>

          {/* Choose button — right side, pill shaped */}
          <TouchableOpacity
            style={[styles.chooseBtn, isSelected && styles.chooseBtnActive]}
            onPress={() => setSelectedVehicle(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.chooseRadio, isSelected && styles.chooseRadioActive]}>
              {isSelected && <View style={styles.chooseRadioDot} />}
            </View>
            <Text style={[styles.chooseBtnText, isSelected && styles.chooseBtnTextActive]}>
              {isSelected ? 'Chosen' : 'Choose'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      </EnterView>
    );
  };

  const selectedData = getSelectedVehicleData();
  const hasSelection = !!selectedVehicle;

  return (
    /*
      KEY FIX — same pattern as PickupDropSelection & FareEstimate:
      • Plain <View> with paddingTop = insets.top (NOT SafeAreaView)
      • StatusBar translucent so the OS bar sits inside insets.top
      • Works on notch / Dynamic Island / punch-hole Android & iOS devices
    */
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} translucent />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('PickupDropSelection');
          }}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
        >
          <Icon name="arrow-back" size={ms(20)} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Select Vehicle</Text>
          <Text style={styles.headerSub}>Choose the right vehicle for your delivery</Text>
        </View>
      </View>

      {/* ── List ── */}
      <Animated.View style={[styles.listWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={C.blue} />
            <Text style={styles.loadingText}>Loading vehicles…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Icon name="error-outline" size={ms(40)} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchVehicleTypes} activeOpacity={0.7}>
              <Icon name="refresh" size={ms(16)} color={C.white} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={item => item.id}
            renderItem={renderVehicleCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            bounces
            extraData={selectedVehicle}
          />
        )}
      </Animated.View>

      {/* ── Sticky Footer — insets.bottom for home indicator clearance ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleH(16)) }]}>
        {/* Delivery info row */}
        <View style={styles.footerInfoRow}>
          <View style={styles.deliveryInfoBlock}>
            <View style={styles.clockBox}>
              <Icon name="schedule" size={ms(20)} color={C.text} />
            </View>
            <View style={styles.deliveryTextBlock}>
              <Text style={styles.deliveryLabel}>
                {hasSelection ? 'Delivery Info' : 'Select a vehicle'}
              </Text>
              <Text style={styles.deliveryEta}>
                {hasSelection
                  ? 'Select a vehicle to see estimated delivery time'
                  : 'to see delivery time & fare'}
              </Text>
            </View>
          </View>

          <View style={styles.etaBlock}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>
              {selectedData ? selectedData.eta : '—'}{' '}
              <Text style={styles.etaUnit}>min</Text>
            </Text>
          </View>
        </View>

        {/* CTA — yellow when enabled */}
        <TouchableOpacity
          style={[styles.confirmBtn, !hasSelection && styles.confirmBtnDisabled]}
          onPress={handleBook}
          disabled={!hasSelection}
          activeOpacity={0.85}
        >
          {!hasSelection && (
            <View style={styles.confirmIconBox}>
              <Icon name="inventory-2" size={ms(18)} color={C.textMuted} />
            </View>
          )}
          <Text style={[styles.confirmText, !hasSelection && styles.confirmTextDisabled]}>
            {hasSelection ? 'Check Final Price' : 'Select a Vehicle to Continue'}
          </Text>
          <Icon
            name="arrow-forward"
            size={ms(18)}
            color={hasSelection ? C.white : C.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Sizes ────────────────────────────────────────────────────────────────────
const GUTTER   = scaleW(16);
const IMG_SIZE = ms(60);

const styles = StyleSheet.create({
  // ── Root — plain View, paddingTop set inline via insets.top ──────────────────
  container: {
    flex:            1,
    backgroundColor: C.surface, // white shows behind translucent status bar
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  // safeHeader removed — insets.top on container handles it.
  // paddingTop here is comfortable breathing room BELOW the status bar.
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: GUTTER,
    paddingTop:        scaleH(14),
    paddingBottom:     scaleH(14),
    backgroundColor:   C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap:               scaleW(12),
    // subtle shadow for depth
    shadowColor:       C.shadow,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.06,
    shadowRadius:      4,
    elevation:         3,
  },
  backBtn: {
    width:           ms(38),
    height:          ms(38),
    borderRadius:    ms(19),
    backgroundColor: C.surfaceAlt,
    justifyContent:  'center',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     C.border,
    flexShrink:      0,
  },
  headerTextBlock: { flex: 1 },
  headerTitle: {
    fontSize:      fs(22),
    fontWeight:    '800',
    color:         C.text,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize:   fs(12),
    color:      C.textMuted,
    marginTop:  scaleH(1),
    fontWeight: '400',
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  listWrap:    { flex: 1, backgroundColor: C.bg },
  listContent: {
    paddingHorizontal: GUTTER,
    paddingTop:        scaleH(10),
    paddingBottom:     scaleH(10),
    gap:               scaleH(8),
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius:    ms(16),
    borderWidth:     1,
    borderColor:     C.border,
    overflow:        'hidden',
    shadowColor:     C.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       3,
  },
  cardSelected: {
    borderColor: C.primary,
    borderWidth: 1.5,
  },

  // Fastest badge — absolute top-left, blue pill
  fastestBadge: {
    position:          'absolute',
    top:               ms(8),
    left:              ms(10),
    zIndex:            10,
    backgroundColor:   C.blue,
    borderRadius:      ms(20),
    paddingHorizontal: scaleW(8),
    paddingVertical:   scaleH(2),
  },
  fastestText: {
    fontSize:      fs(9),
    fontWeight:    '800',
    color:         C.white,
    letterSpacing: 0.2,
  },

  cardInner: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: scaleW(12),
    paddingVertical:   scaleH(10),
    gap:               scaleW(10),
    // extra top padding on first card to clear the Fastest badge
    paddingTop:        scaleH(26),
  },

  // Vehicle image — large, prominent
  imgWrap: {
    width:          IMG_SIZE,
    height:         IMG_SIZE,
    justifyContent: 'center',
    alignItems:     'center',
    flexShrink:     0,
  },
  vehicleImg: {
    width:  IMG_SIZE,
    height: IMG_SIZE,
  },
  emoji: { fontSize: fs(36) },

  // Name + meta — centre column
  infoCol: {
    flex: 1,
    gap:  scaleH(3),
  },
  vehicleName: {
    fontSize:      fs(15),
    fontWeight:    '800',
    color:         C.text,
    letterSpacing: -0.2,
    marginBottom:  scaleH(1),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scaleW(4),
  },
  infoText: {
    fontSize:   fs(11),
    color:      C.textSub,
    fontWeight: '500',
  },

  // Choose pill button — right side
  chooseBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               scaleW(5),
    borderRadius:      ms(24),
    borderWidth:       1.5,
    borderColor:       C.chooseBorder,
    backgroundColor:   C.chooseBtn,
    paddingHorizontal: scaleW(10),
    paddingVertical:   scaleH(6),
    flexShrink:        0,
  },
  chooseBtnActive: {
    backgroundColor: C.blue,
    borderColor:     C.blue,
  },
  chooseRadio: {
    width:          ms(16),
    height:         ms(16),
    borderRadius:   ms(8),
    borderWidth:    1.5,
    borderColor:    C.textMuted,
    justifyContent: 'center',
    alignItems:     'center',
  },
  chooseRadioActive: {
    borderColor: C.white,
  },
  chooseRadioDot: {
    width:           ms(7),
    height:          ms(7),
    borderRadius:    ms(4),
    backgroundColor: C.white,
  },
  chooseBtnText: {
    fontSize:   fs(11),
    fontWeight: '700',
    color:      C.textSub,
  },
  chooseBtnTextActive: { color: C.white },

  // ── Footer ───────────────────────────────────────────────────────────────────
  // paddingBottom is set inline via insets.bottom
  footer: {
    backgroundColor:   C.surface,
    paddingHorizontal: GUTTER,
    paddingTop:        scaleH(12),
    borderTopWidth:    1,
    borderTopColor:    C.border,
    elevation:         10,
    shadowColor:       C.shadow,
    shadowOffset:      { width: 0, height: -3 },
    shadowOpacity:     0.08,
    shadowRadius:      8,
  },
  footerInfoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  scaleH(12),
    gap:           scaleW(12),
  },
  deliveryInfoBlock: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scaleW(10),
    flex:          1,
  },
  clockBox: {
    width:           ms(40),
    height:          ms(40),
    borderRadius:    ms(12),
    backgroundColor: C.surfaceAlt,
    borderWidth:     1,
    borderColor:     C.border,
    justifyContent:  'center',
    alignItems:      'center',
    flexShrink:      0,
  },
  deliveryTextBlock: { flex: 1 },
  deliveryLabel: {
    fontSize:     fs(13),
    fontWeight:   '700',
    color:        C.text,
    marginBottom: scaleH(1),
  },
  deliveryEta: {
    fontSize:   fs(11),
    color:      C.textMuted,
    fontWeight: '400',
    lineHeight: fs(16),
  },
  etaBlock:  { alignItems: 'flex-end', flexShrink: 0 },
  etaLabel: {
    fontSize:      fs(10),
    color:         C.textMuted,
    fontWeight:    '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom:  scaleH(1),
  },
  etaValue: {
    fontSize:      fs(22),
    fontWeight:    '800',
    color:         C.text,
    letterSpacing: -0.5,
  },
  etaUnit: {
    fontSize:   fs(14),
    fontWeight: '500',
    color:      C.textMuted,
  },

  // CTA — yellow pill when active
  confirmBtn: {
    backgroundColor:   C.blue,
    borderRadius:      ms(14),
    paddingVertical:   scaleH(15),
    paddingHorizontal: scaleW(20),
    flexDirection:     'row',
    justifyContent:    'center',
    alignItems:        'center',
    gap:               scaleW(8),
  },
  confirmBtnDisabled: {
    backgroundColor: C.surfaceAlt,
    borderWidth:     1,
    borderColor:     C.border,
  },
  confirmIconBox: {
    marginRight: scaleW(2),
  },
  confirmText: {
    fontSize:      fs(15),
    fontWeight:    '800',
    color:         C.white,
    letterSpacing: 0.1,
  },
  confirmTextDisabled: { color: C.textMuted },

  // ── Loading / Error ───────────────────────────────────────────────────────────
  centered: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    paddingVertical: scaleH(60),
  },
  loadingText: { marginTop: scaleH(10), fontSize: fs(13), color: C.textMuted },
  errorText: {
    marginTop:    scaleH(10),
    fontSize:     fs(13),
    color:        C.textSub,
    textAlign:    'center',
    marginBottom: scaleH(16),
  },
  retryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.blue,
    paddingHorizontal: scaleW(20),
    paddingVertical:   scaleH(10),
    borderRadius:      ms(10),
    gap:               scaleW(6),
  },
  retryText: { color: C.white, fontSize: fs(13), fontWeight: '700' },
});

export default VehicleSelection;