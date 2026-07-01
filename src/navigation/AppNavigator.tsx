import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

import Home from '../screens/Home';
import ProfileSetup from '../screens/ProfileSetup';
import PickupDropSelection from '../screens/PickupDropSelection';
import VehicleSelection from '../screens/VehicleSelection';
import FareEstimate from '../screens/FareEstimate';
import LiveTracking from '../screens/LiveTracking';
import MyOrders from '../screens/MyOrders';
import TrackOrder from '../screens/TrackOrder';
import Payment from '../screens/Payment';
import BookingHistory from '../screens/BookingHistory';
import Profile from '../screens/Profile';
import Coins from '../screens/Coins';
import ReferEarn from '../screens/ReferEarn';
import EarnCoinsInfo from '../screens/EarnCoinsInfo';
import TransactionHistory from '../screens/TransactionHistory';
import TransferToWallet from '../screens/TransferWallet';
import WriteReview from '../screens/WriteReview';
import MapLocationPicker from '../screens/MapLocationPicker';

// Import all Profile-related screens
import EditProfile from '../screens/EditProfile';
import SavedAddresses from '../screens/SavedAddresses';
import Wallet from '../screens/Wallet';
import Support from '../screens/Support';
import FAQs from '../screens/FAQS';
import Settings from '../screens/Settings';
import NotificationSettings from '../screens/NotificationSettings';
import Notifications from '../screens/Notifications';
import TermsAndConditions from '../screens/TermsAndConditions';
import PrivacyPolicy from '../screens/PrivacyPolicy';
import CancellationPolicy from '../screens/CancellationPolicy';
import DataDeletionPolicy from '../screens/DataDeletionPolicy';
import ProhibitedItemsPolicy from '../screens/ProhibitedItemsPolicy';
import AboutUs from '../screens/AboutUs';

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