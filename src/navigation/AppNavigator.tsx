import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

import Home from '../screens/home/Home';
import ProfileSetup from '../screens/auth/ProfileSetup';
import PickupDropSelection from '../screens/booking/PickupDropSelection';
import VehicleSelection from '../screens/booking/VehicleSelection';
import FareEstimate from '../screens/booking/FareEstimate';
import LiveTracking from '../screens/booking/LiveTracking';
import MyOrders from '../screens/orders/MyOrders';
import TrackOrder from '../screens/booking/TrackOrder';
import Payment from '../screens/booking/Payment';
import BookingHistory from '../screens/orders/BookingHistory';
import Profile from '../screens/profile/Profile';
import Coins from '../screens/wallet/Coins';
import ReferEarn from '../screens/support/ReferEarn';
import EarnCoinsInfo from '../screens/wallet/EarnCoinsInfo';
import TransactionHistory from '../screens/wallet/TransactionHistory';
import TransferToWallet from '../screens/wallet/TransferWallet';
import WriteReview from '../screens/profile/WriteReview';
import MapLocationPicker from '../screens/booking/MapLocationPicker';

// Import all Profile-related screens
import EditProfile from '../screens/profile/EditProfile';
import SavedAddresses from '../screens/profile/SavedAddresses';
import Wallet from '../screens/wallet/Wallet';
import Support from '../screens/support/Support';
import FAQs from '../screens/support/FAQS';
import Settings from '../screens/profile/Settings';
import NotificationSettings from '../screens/profile/NotificationSettings';
import Notifications from '../screens/profile/Notifications';
import TermsAndConditions from '../screens/legal/TermsAndConditions';
import PrivacyPolicy from '../screens/legal/PrivacyPolicy';
import CancellationPolicy from '../screens/legal/CancellationPolicy';
import DataDeletionPolicy from '../screens/legal/DataDeletionPolicy';
import ProhibitedItemsPolicy from '../screens/legal/ProhibitedItemsPolicy';
import AboutUs from '../screens/support/AboutUs';

// Placeholder for screens not yet implemented
import { View, Text } from 'react-native';
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} Screen</Text>
  </View>
);

export type AppStackParamList = {
  ProfileSetup: undefined;
  Home: undefined;
  PickupDropSelection: { serviceCategory?: string; pickedLocation?: { field: 'pickup' | 'drop'; address: string; lat: number; lon: number } } | undefined;
  MapLocationPicker: { field: 'pickup' | 'drop'; initialLat?: number; initialLon?: number };
  VehicleSelection: undefined;
  FareEstimate: { vehicle: string } | undefined;
  LiveTracking: {
    bookingId: string;
    pickup?: string;
    drop?: string;
    pickupCoords?: { latitude: number; longitude: number };
    dropCoords?: { latitude: number; longitude: number };
    vehicleType?: string;
    fare?: number;
    showBookingSuccess?: boolean;
    paymentMethod?: 'cash' | 'online';
    /** Pass true when navigating from MyOrders — bookingId is a real DB ID, not an offer ID */
    isRealBooking?: boolean;
  };
  Payment: {
    type: 'booking' | 'wallet';
    bookingId?: string;
    amount: number;
  };
  BookingHistory: undefined;
  Profile: undefined;
  MyOrders: { filter?: 'completed' | 'active' | 'all' } | undefined;
  TrackOrder: { orderId: string };
  Wallet: undefined;
  Support: undefined;
  Settings: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
  CancellationPolicy: undefined;
  DataDeletionPolicy: undefined;
  ProhibitedItemsPolicy: undefined;
  AboutUs: undefined;
  Notifications: undefined;
  ScheduleDelivery: undefined;
  EditProfile: undefined;
  SavedAddresses: undefined;
  FAQs: undefined;
  NotificationSettings: undefined;
  Coins: undefined;
  TransactionHistory: undefined;
  TransferToWallet: undefined;
  WriteReview: undefined;
  ReferEarn: undefined;
  EarnCoinsInfo: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  const { needsProfileSetup } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={needsProfileSetup ? 'ProfileSetup' : 'Home'}
    >
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetup}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen
        name="PickupDropSelection"
        component={PickupDropSelection}
      />
      <Stack.Screen name="VehicleSelection" component={VehicleSelection} />
      <Stack.Screen
        name="MapLocationPicker"
        component={MapLocationPicker}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="FareEstimate" component={FareEstimate} />
      <Stack.Screen name="LiveTracking" component={LiveTracking} />
      <Stack.Screen name="Payment" component={Payment} />
      <Stack.Screen name="BookingHistory" component={BookingHistory} />

      {/* Profile Screen */}
      <Stack.Screen name="Profile" component={Profile} />

      <Stack.Screen name="MyOrders" component={MyOrders} />

      {/* Refer & Earn */}
      <Stack.Screen name="ReferEarn" component={ReferEarn} />

      {/* How to earn Bookfleet coins */}
      <Stack.Screen name="EarnCoinsInfo" component={EarnCoinsInfo} />

      {/* Track Order Screen */}
      <Stack.Screen
        name="TrackOrder"
        component={TrackOrder}
        options={{
          animation: 'slide_from_bottom',
        }}
      />

      {/* Write Review Screen */}
      <Stack.Screen
        name="WriteReview"
        component={WriteReview}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Profile Menu Screens - Now using actual components */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="SavedAddresses"
        component={SavedAddresses}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Wallet"
        component={Wallet}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Support"
        component={Support}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="FAQs"
        component={FAQs}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          animation: 'slide_from_right',
        }}
      />
      {/* <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
        options={{
          animation: 'slide_from_right',
        }}
      /> */}
      <Stack.Screen
        name="TermsAndConditions"
        component={TermsAndConditions}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicy}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CancellationPolicy"
        component={CancellationPolicy}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="DataDeletionPolicy"
        component={DataDeletionPolicy}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ProhibitedItemsPolicy"
        component={ProhibitedItemsPolicy}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="AboutUs"
        component={AboutUs}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ScheduleDelivery"
        component={() => <PlaceholderScreen name="ScheduleDelivery" />}
      />

      {/* Coins Screen */}
      <Stack.Screen name="Coins" component={Coins} />

      {/* Coins related screens */}
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistory}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="TransferToWallet"
        component={TransferToWallet}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;