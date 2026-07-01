import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ActiveBookingBanner from './ActiveBookingBanner';
import { useBookingStore } from '../store/useBookingStore';
import { vehicleApi } from '../api/vehicle';

const TERMINAL_STATUSES = ['completed', 'cancelled', 'expired'];

type TabName = 'Home' | 'MyOrders' | 'Coins' | 'Profile';

interface TabConfig {
  name: TabName;
  icon: string;
  label: string;
}

const tabs: TabConfig[] = [
  { name: 'Home',     icon: 'home',         label: 'Home' },
  { name: 'MyOrders', icon: 'receipt-long', label: 'My Orders' },
  { name: 'Coins',    icon: 'stars',        label: 'Coins' },
  { name: 'Profile',  icon: 'person',       label: 'Profile' },
];

// Screens where the banner should NOT appear (they handle tracking themselves)
const BANNER_HIDDEN_ON = ['LiveTracking'];

const BottomTabBar: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const activeBooking = useBookingStore((s) => s.activeBooking);
  const setActiveBooking = useBookingStore((s) => s.setActiveBooking);

  // Bootstrap: if the store has no active booking (fresh app launch, store
  // cleared, etc.) ask the server whether the customer currently has one. This
  // is what makes the banner appear on Home even when nothing put it in the
  // store this session. Re-checks whenever we land on a tab while empty.
  useEffect(() => {
    if (activeBooking) return;
    let cancelled = false;
    (async () => {
      try {
        const active = await vehicleApi.getCustomerActiveBooking();
        if (cancelled || !active || !active.id) return;
        const s = String(active.status ?? '').toLowerCase();
        if (TERMINAL_STATUSES.includes(s)) return;
        setActiveBooking({
          id: active.id,
          status: s,
          pickupAddress: active.pickup_address ?? '',
          dropAddress: active.drop_address ?? '',
          vehicleType: active.vehicle_type ?? 'bike',
          estimatedFare: active.estimated_fare ?? 0,
          pickup: active.pickup_address ?? '',
          drop: active.drop_address ?? '',
        });
      } catch {
        // best-effort — leave the store empty if the lookup fails
      }
    })();
    return () => { cancelled = true; };
  }, [activeBooking, route.name, setActiveBooking]);

  const showBanner =
    !!activeBooking &&
    !TERMINAL_STATUSES.includes(activeBooking.status) &&
    !BANNER_HIDDEN_ON.includes(route.name);

  const handleTabPress = (tabName: TabName) => {
    if (route.name !== tabName) {
      navigation.navigate(tabName);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.bottomNavContainer}>
      {showBanner && <ActiveBookingBanner />}
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = route.name === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={() => handleTabPress(tab.name)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={tab.icon}
                size={26}
                color={isActive ? '#3B82F6' : '#64748B'}
              />
              <Text
                style={[
                  styles.navText,
                  isActive && styles.navTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 10,
     fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default BottomTabBar;