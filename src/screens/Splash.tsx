import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

const Splash = () => {
  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineY    = useRef(new Animated.Value(12)).current;
  const taglineOp   = useRef(new Animated.Value(0)).current;
  const poweredOp   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 55,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOp, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(poweredOp, {
          toValue: 1,
          duration: 350,
          delay: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E22AD" />

      <View style={styles.content}>
        <Animated.Image
          source={require('../assets/images/logo_zipto.png')}
          style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
        <Animated.Text
          style={[styles.tagline, { opacity: taglineOp, transform: [{ translateY: taglineY }] }]}
        >
          Last-Mile Delivery
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.poweredBy, { opacity: poweredOp }]}>
        Powered by Zipto Technologies
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E22AD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: ms(180),
    height: ms(180),
    marginBottom: vs(16),
  },
  tagline: {
    fontSize: fs(13),
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Cocon-Regular',
    letterSpacing: ms(4),
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  poweredBy: {
    fontSize: fs(12),
    color: 'rgba(255,255,255,0.38)',
    fontFamily: 'Cocon-Regular',
    textAlign: 'center',
    paddingBottom: vs(32),
  },
});

export default Splash;
