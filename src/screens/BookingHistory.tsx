import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

const HISTORY_DATA = [
  {
    id: '1',
    date: '04 Jan, 10:30 AM',
    pickup: 'Master Canteen',
    drop: 'Patia',
    price: '₹350',
    status: 'Completed',
    vehicle: 'Tata Ace',
  },
  {
    id: '2',
    date: '02 Jan, 05:15 PM',
    pickup: 'Rasulgarh',
    drop: 'Jayadev Vihar',
    price: '₹120',
    status: 'Cancelled',
    vehicle: 'Bike',
  },
];

const BookingHistory = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="history"
          size={ms(24)}
          color={THEME.colors.black}
          style={{ marginRight: scaleW(10) }}
        />
        <Text style={styles.headerTitle}>Your Bookings</Text>
      </View>

      <FlatList
        data={HISTORY_DATA}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.date}>{item.date}</Text>
              <Text
                style={[
                  styles.status,
                  {
                    color:
                      item.status === 'Completed'
                        ? THEME.colors.success
                        : THEME.colors.error,
                  },
                ]}
              >
                {item.status}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: THEME.colors.primary }]} />
              <Text style={styles.locationText}>{item.pickup}</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: THEME.colors.secondary }]} />
              <Text style={styles.locationText}>{item.drop}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.vehicle}>{item.vehicle}</Text>
              <Text style={styles.price}>{item.price}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const dotSize = ms(8);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(THEME.spacing.m),
    backgroundColor: THEME.colors.white,
    elevation: 2,
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
  },
  list: {
    padding: ms(THEME.spacing.m),
  },
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: ms(8),
    padding: ms(THEME.spacing.m),
    marginBottom: scaleH(THEME.spacing.m),
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: fs(THEME.sizes.caption),
    color: THEME.colors.textSecondary,
  },
  status: {
    fontSize: fs(THEME.sizes.caption),
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: scaleH(THEME.spacing.s),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: scaleH(4),
  },
  dot: {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    marginRight: scaleW(8),
  },
  locationText: {
    fontSize: fs(THEME.sizes.body1),
    color: THEME.colors.text,
  },
  vehicle: {
    fontSize: fs(THEME.sizes.body2),
    color: THEME.colors.textSecondary,
  },
  price: {
    fontSize: fs(THEME.sizes.body1),
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
});

export default BookingHistory;