import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Linking,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, Polyline } from 'react-native-maps';

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

type TrackOrderRouteProp = RouteProp<AppStackParamList, 'TrackOrder'>;

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
  active: boolean;
  icon: string;
}

const TrackOrder = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<TrackOrderRouteProp>();
  const { orderId } = route.params;

  const [currentLocation, setCurrentLocation] = useState({
    latitude: 20.2961,
    longitude: 85.8245,
  });

  const orderData = {
    id: orderId,
    type: 'Send Packages',
    status: 'In Transit',
    pickup: 'Saheed Nagar, Bhubaneswar',
    dropoff: 'Patia, Bhubaneswar',
    estimatedTime: '15 mins',
    amount: '₹150',
    orderTime: '10:30 AM',
    driver: {
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      rating: 4.8,
      vehicle: 'Bike - OD 02 AB 1234',
      photo: 'https://i.pravatar.cc/150?img=12',
    },
    pickupLocation:  { latitude: 20.2961, longitude: 85.8245 },
    dropoffLocation: { latitude: 20.3489, longitude: 85.8172 },
    driverLocation:  { latitude: 20.3125, longitude: 85.82 },
  };

  const timeline: TimelineStep[] = [
    { id: '1', title: 'Order Placed',      description: 'Your order has been confirmed',  time: '10:30 AM',           completed: true,  active: false, icon: 'check-circle'   },
    { id: '2', title: 'Pickup Confirmed',  description: 'Driver picked up your package',  time: '10:45 AM',           completed: true,  active: false, icon: 'check-circle'   },
    { id: '3', title: 'In Transit',        description: 'Package is on the way',          time: '11:00 AM',           completed: true,  active: true,  icon: 'local-shipping' },
    { id: '4', title: 'Out for Delivery',  description: 'Driver is nearby',               time: 'Expected',           completed: false, active: false, icon: 'near-me'        },
    { id: '5', title: 'Delivered',         description: 'Package delivered successfully', time: 'Expected 11:15 AM',  completed: false, active: false, icon: 'done-all'       },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLocation(prev => ({
        latitude:  prev.latitude  + 0.0001,
        longitude: prev.longitude + 0.0001,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCall    = () => Linking.openURL(`tel:${orderData.driver.phone}`);
  const handleMessage = () => Linking.openURL(`sms:${orderData.driver.phone}`);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Track Order</Text>
            <Text style={styles.headerSubtitle}>Order #{orderId}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} activeOpacity={0.7}>
            <MaterialIcons name="share" size={ms(22)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Map ── */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 20.3125, longitude: 85.82,
              latitudeDelta: 0.08, longitudeDelta: 0.08,
            }}
          >
            <Marker coordinate={orderData.pickupLocation} title="Pickup Location" description={orderData.pickup}>
              <View style={styles.pickupMarker}>
                <MaterialIcons name="place" size={ms(30)} color="#3B82F6" />
              </View>
            </Marker>

            <Marker coordinate={currentLocation} title="Driver Location" description={orderData.driver.name}>
              <View style={styles.driverMarker}>
                <MaterialIcons name="two-wheeler" size={ms(22)} color="#FFFFFF" />
              </View>
            </Marker>

            <Marker coordinate={orderData.dropoffLocation} title="Dropoff Location" description={orderData.dropoff}>
              <View style={styles.dropoffMarker}>
                <MaterialIcons name="place" size={ms(30)} color="#10B981" />
              </View>
            </Marker>

            <Polyline
              coordinates={[orderData.pickupLocation, currentLocation, orderData.dropoffLocation]}
              strokeColor="#3B82F6"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          </MapView>

          {/* ETA overlay card */}
          <View style={styles.etaCard}>
            <View style={styles.etaContent}>
              <MaterialIcons name="access-time" size={ms(24)} color="#3B82F6" />
              <View style={styles.etaText}>
                <Text style={styles.etaLabel}>Estimated Arrival</Text>
                <Text style={styles.etaTime}>{orderData.estimatedTime}</Text>
              </View>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{orderData.status}</Text>
            </View>
          </View>
        </View>

        {/* ── Bottom sheet ── */}
        <ScrollView style={styles.bottomSheet} contentContainerStyle={styles.bottomSheetContent}>

          {/* Driver card */}
          <View style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <Image source={{ uri: orderData.driver.photo }} style={styles.driverPhoto} />
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{orderData.driver.name}</Text>
                <View style={styles.driverRating}>
                  <MaterialIcons name="star" size={ms(16)} color="#F59E0B" />
                  <Text style={styles.ratingText}>{orderData.driver.rating}</Text>
                  <Text style={styles.vehicleText} numberOfLines={1}>• {orderData.driver.vehicle}</Text>
                </View>
              </View>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCall} activeOpacity={0.7}>
                <MaterialIcons name="phone" size={ms(20)} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleMessage} activeOpacity={0.7}>
                <MaterialIcons name="message" size={ms(20)} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location card */}
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={styles.locationDot} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={styles.locationText}>{orderData.pickup}</Text>
              </View>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>Dropoff Location</Text>
                <Text style={styles.locationText}>{orderData.dropoff}</Text>
              </View>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Delivery Timeline</Text>
            {timeline.map((step, index) => (
              <View key={step.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    step.completed && styles.timelineIconCompleted,
                    step.active    && styles.timelineIconActive,
                  ]}>
                    <MaterialIcons
                      name={step.icon}
                      size={ms(16)}
                      color={step.completed || step.active ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  {index < timeline.length - 1 && (
                    <View style={[styles.timelineLine, step.completed && styles.timelineLineCompleted]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[
                      styles.timelineStepTitle,
                      (step.completed || step.active) && styles.timelineStepTitleActive,
                    ]}>
                      {step.title}
                    </Text>
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  </View>
                  <Text style={styles.timelineDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order Type</Text>
              <Text style={styles.summaryValue}>{orderData.type}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order Time</Text>
              <Text style={styles.summaryValue}>{orderData.orderTime}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total Amount</Text>
              <Text style={styles.summaryAmount}>{orderData.amount}</Text>
            </View>
          </View>

          {/* Support */}
          <TouchableOpacity style={styles.supportButton} activeOpacity={0.7}>
            <MaterialIcons name="support-agent" size={ms(20)} color="#3B82F6" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const driverMarkerSize = ms(40);
const driverPhotoSize  = ms(56);
const actionBtnSize    = ms(44);
const locationDotSize  = ms(12);
const timelineIconSize = ms(32);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea:  { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B82F6',
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(12),
    paddingTop: scaleH(8),
  },
  backButton:    { padding: ms(8) },
  shareButton:   { padding: ms(8) },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: fs(13),
    color: 'rgba(255,255,255,0.8)',
    marginTop: scaleH(2),
  },

  // ── Map ──
  mapContainer: {
    height: SCREEN_HEIGHT * 0.35,   // proportional on all screens
    position: 'relative',
  },
  map: { flex: 1 },

  pickupMarker:  { alignItems: 'center', justifyContent: 'center' },
  dropoffMarker: { alignItems: 'center', justifyContent: 'center' },
  driverMarker: {
    backgroundColor: '#3B82F6',
    width: driverMarkerSize,
    height: driverMarkerSize,
    borderRadius: driverMarkerSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // ETA overlay
  etaCard: {
    position: 'absolute',
    top: scaleH(12),
    left: scaleW(12),
    right: scaleW(12),
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  etaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleH(10),
  },
  etaText:  { marginLeft: scaleW(12), flex: 1 },
  etaLabel: { fontSize: fs(13), color: '#64748B', marginBottom: scaleH(2) },
  etaTime:  { fontSize: fs(20), fontWeight: 'bold', fontFamily: 'Poppins-Regular', color: '#1E293B' },
  etaDivider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: scaleH(10) },
  etaStatus:  { flexDirection: 'row', alignItems: 'center' },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: '#10B981',
    marginRight: scaleW(8),
  },
  statusText: { fontSize: fs(14), fontWeight: '600', color: '#1E293B' },

  // ── Bottom sheet ──
  bottomSheet: { flex: 1, backgroundColor: '#F8FAFC' },
  bottomSheetContent: {
    padding: scaleW(16),
    paddingBottom: scaleH(32),
  },

  // Driver card
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: scaleH(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  driverPhoto: {
    width: driverPhotoSize,
    height: driverPhotoSize,
    borderRadius: driverPhotoSize / 2,
    marginRight: scaleW(12),
    flexShrink: 0,
  },
  driverDetails: { flex: 1 },
  driverName: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    marginBottom: scaleH(4),
  },
  driverRating: { flexDirection: 'row', alignItems: 'center' },
  ratingText:   { fontSize: fs(14), fontWeight: '600', color: '#1E293B', marginLeft: scaleW(4) },
  vehicleText:  { fontSize: fs(12), color: '#64748B', marginLeft: scaleW(4), flex: 1 },
  driverActions: { flexDirection: 'row', gap: scaleW(8), flexShrink: 0 },
  actionButton: {
    width: actionBtnSize,
    height: actionBtnSize,
    borderRadius: actionBtnSize / 2,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Location card
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: scaleH(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locationDot: {
    width: locationDotSize,
    height: locationDotSize,
    borderRadius: locationDotSize / 2,
    backgroundColor: '#3B82F6',
    marginTop: scaleH(4),
    marginRight: scaleW(12),
    flexShrink: 0,
  },
  locationLine: {
    width: 2,
    height: scaleH(24),
    backgroundColor: '#E2E8F0',
    marginLeft: scaleW(5),
    marginVertical: scaleH(6),
  },
  locationDetails: { flex: 1 },
  locationLabel:   { fontSize: fs(12), color: '#64748B', marginBottom: scaleH(4) },
  locationText:    { fontSize: fs(14), fontWeight: '500', color: '#1E293B' },

  // Timeline card
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: scaleH(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    marginBottom: scaleH(14),
  },
  timelineItem:  { flexDirection: 'row', marginBottom: scaleH(6) },
  timelineLeft:  { alignItems: 'center', marginRight: scaleW(12) },
  timelineIcon: {
    width: timelineIconSize,
    height: timelineIconSize,
    borderRadius: timelineIconSize / 2,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconCompleted: { backgroundColor: '#10B981' },
  timelineIconActive:    { backgroundColor: '#3B82F6' },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: scaleH(4),
  },
  timelineLineCompleted: { backgroundColor: '#10B981' },
  timelineContent: { flex: 1, paddingBottom: scaleH(14) },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleH(4),
  },
  timelineStepTitle:       { fontSize: fs(14), fontWeight: '600', color: '#64748B' },
  timelineStepTitleActive: { color: '#1E293B' },
  timelineTime:            { fontSize: fs(12), color: '#94A3B8' },
  timelineDescription:     { fontSize: fs(13), color: '#64748B' },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: scaleH(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    marginBottom: scaleH(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleH(8),
  },
  summaryLabel:   { fontSize: fs(14), color: '#64748B' },
  summaryValue:   { fontSize: fs(14), fontWeight: '500', color: '#1E293B' },
  summaryDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: scaleH(10) },
  summaryTotal:   { fontSize: fs(16), fontWeight: '600', color: '#1E293B' },
  summaryAmount: {
    fontSize: fs(18),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },

  // Support button
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: scaleH(14),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: scaleW(8),
  },
  supportButtonText: {
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#3B82F6',
  },
});

export default TrackOrder;