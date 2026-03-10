import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from '../screens/Home';
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
import TransactionHistory from '../screens/TransactionHistory';
import TransferToWallet from '../screens/TransferWallet';

// Import all Profile-related screens
import EditProfile from '../screens/EditProfile';
import SavedAddresses from '../screens/SavedAddresses';
import Wallet from '../screens/Wallet';
import Support from '../screens/Support';
import FAQs from '../screens/FAQS';
import Settings from '../screens/Settings';
import NotificationSettings from '../screens/NotificationSettings';
import TermsAndConditions from '../screens/TermsAndConditions';
import PrivacyPolicy from '../screens/PrivacyPolicy';
import AboutUs from '../screens/AboutUs';

// Placeholder for screens not yet implemented
import { View, Text } from 'react-native';
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} Screen</Text>
  </View>
);

export type AppStackParamList = {
  Home: undefined;
  PickupDropSelection: { serviceCategory?: string } | undefined;
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
  };
  Payment: undefined;
  BookingHistory: undefined;
  Profile: undefined;
  MyOrders: undefined;
  TrackOrder: { orderId: string };
  Wallet: undefined;
  Support: undefined;
  Settings: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
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
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen
        name="PickupDropSelection"
        component={PickupDropSelection}
      />
      <Stack.Screen name="VehicleSelection" component={VehicleSelection} />
      <Stack.Screen name="FareEstimate" component={FareEstimate} />
      <Stack.Screen name="LiveTracking" component={LiveTracking} />
      <Stack.Screen name="Payment" component={Payment} />
      <Stack.Screen name="BookingHistory" component={BookingHistory} />
      
      {/* Profile Screen */}
      <Stack.Screen name="Profile" component={Profile} />
      
      <Stack.Screen name="MyOrders" component={MyOrders} />
      
      {/* Track Order Screen */}
      <Stack.Screen 
        name="TrackOrder" 
        component={TrackOrder}
        options={{
          animation: 'slide_from_bottom',
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
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
        options={{
          animation: 'slide_from_right',
        }}
      />
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
        name="AboutUs"
        component={AboutUs}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* Placeholder screens */}
      <Stack.Screen
        name="Notifications"
        component={() => <PlaceholderScreen name="Notifications" />}
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