import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { View, StatusBar } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { navigationRef } from './navigationRef';

// Matches the JS splash + Android windowBackground — zero visible flash
const SplashPlaceholder = () => (
  <View style={{ flex: 1, backgroundColor: '#1E22AD' }}>
    <StatusBar barStyle="light-content" backgroundColor="#1E22AD" translucent={false} />
  </View>
);

const RootNavigator = () => {
    const [isHydrated, setIsHydrated] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [shouldVerifyToken, setShouldVerifyToken] = useState(false);
    const { isAuthenticated, fetchProfile } = useAuthStore();

    useEffect(() => {
        // Wait for Zustand to rehydrate from AsyncStorage
        const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
            setIsHydrated(true);
            // Only verify token if user was already authenticated from storage
            // This means app was reopened, not a fresh login
            const state = useAuthStore.getState();
            if (state.isAuthenticated && state.token) {
                setShouldVerifyToken(true);
            }
        });

        // Check if already hydrated
        if (useAuthStore.persist.hasHydrated()) {
            setIsHydrated(true);
            const state = useAuthStore.getState();
            if (state.isAuthenticated && state.token) {
                setShouldVerifyToken(true);
            }
        }

        return () => {
            unsubscribe();
        };
    }, []);

    // Verify token only on app rehydration (not after fresh login)
    useEffect(() => {
        const verifyAndFetchProfile = async () => {
            if (shouldVerifyToken) {
                setIsVerifying(true);
                await fetchProfile();
                setIsVerifying(false);
                setShouldVerifyToken(false);
            }
        };

        verifyAndFetchProfile();
    }, [fetchProfile, shouldVerifyToken]);

    // Show seamless blue screen while hydrating/verifying — matches native windowBackground
    if (!isHydrated || isVerifying) {
        return <SplashPlaceholder />;
    }

    return (
        <NavigationContainer ref={navigationRef}>
            {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default RootNavigator;
