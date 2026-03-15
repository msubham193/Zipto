import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Splash from '../screens/Splash';
import Login from '../screens/Login';
import OTPVerification from '../screens/OTPVerification';

export type AuthStackParamList = {
    Splash: undefined;
    Login: undefined;
    OTPVerification: { mobile: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="OTPVerification" component={OTPVerification} />
        </Stack.Navigator>
    );
};

export default AuthNavigator;
