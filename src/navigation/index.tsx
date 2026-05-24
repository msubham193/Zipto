import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { View, StatusBar } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import Splash from '../screens/Splash';

const MIN_SPLASH_DURATION = 2800;

const RootNavigator = () => {
    const [isHydrated, setIsHydrated] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const { isAuthenticated, fetchProfile } = useAuthStore();

    useEffect(() => {
        let splashTimer: ReturnType<typeof setTimeout>;
        let splashDone = false;
        let hydrationDone = false;

        const tryHideSplash = () => {
            if (splashDone) {
                setShowSplash(false);
            }
        };

        // Splash minimum duration
        splashTimer = setTimeout(() => {
            splashDone = true;
            tryHideSplash();
        }, MIN_SPLASH_DURATION);

        const handleHydration = async () => {
            setIsHydrated(true);

            const state = useAuthStore.getState();
            if (state.isAuthenticated && state.token) {
                setIsVerifying(true);
                await fetchProfile();
                setIsVerifying(false);
            }

            hydrationDone = true;
            tryHideSplash();
        };

        if (useAuthStore.persist.hasHydrated()) {
            handleHydration();
        } else {
            const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
                handleHydration();
            });
            return () => {
                clearTimeout(splashTimer);
                unsubscribe();
            };
        }

        return () => clearTimeout(splashTimer);
    }, []);  // fetchProfile is stable from Zustand, safe to omit

    if (showSplash) {
        return <Splash />;
    }

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