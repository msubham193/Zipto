import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { View, ActivityIndicator, Linking } from 'react-native';
import { navigationRef } from './navigationRef';
import { useAuthStore } from '../store/useAuthStore';
import Splash from '../screens/Splash';
import { parseReferralCode, stashReferralCode } from '../utils/referral';

const MIN_SPLASH_DURATION = 2800;

const RootNavigator = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const { isAuthenticated, fetchProfile } = useAuthStore();

    useEffect(() => {
        let splashTimer: ReturnType<typeof setTimeout> | null = null;
        let isMounted = true;

        const startSplash = async () => {
            // Start the splash timer immediately
            splashTimer = setTimeout(() => {
                if (isMounted) {
                    setShowSplash(false);
                }
            }, MIN_SPLASH_DURATION);

            // Handle hydration and profile fetch in parallel
            try {
                // Wait for hydration if not already done
                if (!useAuthStore.persist.hasHydrated()) {
                    await new Promise<void>(resolve => {
                        const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
                            unsubscribe();
                            resolve();
                        });
                    });
                }

                if (!isMounted) return;
                setIsHydrated(true);

                // If authenticated, verify token
                const state = useAuthStore.getState();
                if (state.isAuthenticated && state.token) {
                    setIsVerifying(true);
                    try {
                        await fetchProfile();
                    } catch (err) {
                        console.warn('Profile fetch error:', err);
                    } finally {
                        if (isMounted) {
                            setIsVerifying(false);
                        }
                    }
                }
            } catch (err) {
                console.warn('Hydration error:', err);
                if (isMounted) {
                    setIsHydrated(true);
                }
            }
        };

        startSplash();

        return () => {
            isMounted = false;
            if (splashTimer) {
                clearTimeout(splashTimer);
            }
        };
    }, [fetchProfile]);

    // ── Referral deep links ──────────────────────────────────────────────────
    // Capture a referral code from the launch URL or any link opened while
    // running, and stash it so the Login screen can pre-fill it at signup.
    useEffect(() => {
        const handleUrl = (url?: string | null) => {
            const code = parseReferralCode(url);
            if (code) stashReferralCode(code);
        };
        Linking.getInitialURL().then(handleUrl).catch(() => {});
        const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
        return () => sub.remove();
    }, []);

    // Always show splash while showSplash is true
    if (showSplash) {
        return <Splash />;
    }

    // Show loading while hydrating or verifying
    if (!isHydrated || isVerifying) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    // Finally show the navigation
    return (
        <NavigationContainer ref={navigationRef}>
            {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default RootNavigator;