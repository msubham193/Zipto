import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  Animated,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useAuthStore } from '../store/useAuthStore';

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

const Splash = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated, token } = useAuthStore();

  // ── Animation values ──────────────────────────────────────────────────────
  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlideY  = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('👤 Already authenticated! Bearer Token:', token);
    }

    // Sequence: logo pops in → text fades up → tagline fades in
    Animated.sequence([
      // 1. Logo: scale + fade in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 2. Text slides up & fades in
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 3. Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, token]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>

          {/* Logo — animated scale + opacity, tintColor white */}
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          >
            <Image
              source={require('../assets/images/logo_zipto.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Gradient "Zipto" text — slides up + fades in */}
          <Animated.View
            style={{
              opacity: textOpacity,
              transform: [{ translateY: textSlideY }],
            }}
          >
            <MaskedView
              maskElement={
                <Text style={styles.ziptoTextMask}>Zipto</Text>
              }
            >
              <LinearGradient
                colors={['#FFFFFF', '#E0E7FF', '#C7D2FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.ziptoTextMask, { opacity: 0 }]}>
                  Zipto
                </Text>
              </LinearGradient>
            </MaskedView>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            Deliver Anything, Anywhere
          </Animated.Text>
        </View>
      </View>

      {/* Bottom branding */}
      <Animated.Text style={[styles.poweredBy, { opacity: taglineOpacity }]}>
        Powered by Zipto Technologies
      </Animated.Text>
    </View>
  );
};

// ─── Derived responsive values ────────────────────────────────────────────────
const logoSize = ms(200);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // White logo
  logoImage: {
    width: logoSize,
    height: logoSize,
   
  },

  // Gradient text mask
  ziptoTextMask: {
    fontSize: fs(42),
    fontWeight: 'bold',
    marginTop: scaleH(8),
    letterSpacing: ms(2),
    textAlign: 'center',
    color: '#FFFFFF',           // needed for MaskedView mask element
    fontFamily: 'Poppins-Regular',
  },

  // Tagline below Zipto text
  tagline: {
    fontSize: fs(14),
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Poppins-Regular',
    letterSpacing: ms(0.5),
    marginTop: scaleH(10),
    textAlign: 'center',
  },

  // Bottom label
  poweredBy: {
    fontSize: fs(12),
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    paddingBottom: scaleH(32),
  },
});

export default Splash;