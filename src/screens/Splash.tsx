import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  StatusBar,
} from 'react-native';
import { verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

const ZIPTO_LETTERS = ['Z', 'i', 'p', 't', 'o'];

// Zomato-style: each letter pops in with scale + rotate spring
const LetterPop = ({
  letter,
  delay,
}: {
  letter: string;
  delay: number;
}) => {
  const scale = useRef(new Animated.Value(0.1)).current;
  const rotate = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
        delay,
      }),
      Animated.timing(rotate, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        delay,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        delay,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-20, 0],
    outputRange: ['-20deg', '0deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.ziptoLetter,
        {
          opacity,
          transform: [{ scale }, { rotate: rotateInterpolate }],
        },
      ]}
    >
      {letter}
    </Animated.Text>
  );
};

const Splash = () => {
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlideY = useRef(new Animated.Value(10)).current;
  const poweredOpacity = useRef(new Animated.Value(0)).current;

  // Last letter delay + a small buffer before tagline shows
  const LETTER_STAGGER = 110;
  const LAST_LETTER_DELAY = (ZIPTO_LETTERS.length - 1) * LETTER_STAGGER;
  const TAGLINE_DELAY   = LAST_LETTER_DELAY + 250;
  const POWERED_DELAY   = LAST_LETTER_DELAY + 520;

  useEffect(() => {
    // Tagline slides up after letters finish
    Animated.parallel([
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        delay: TAGLINE_DELAY,
        useNativeDriver: true,
      }),
      Animated.timing(taglineSlideY, {
        toValue: 0,
        duration: 400,
        delay: TAGLINE_DELAY,
        useNativeDriver: true,
      }),
    ]).start();

    // Powered-by fades in last
    Animated.timing(poweredOpacity, {
      toValue: 1,
      duration: 400,
      delay: POWERED_DELAY,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E22AD" />
      {/* ── Letter row ── */}
      <View style={styles.content}>
        <View style={styles.lettersRow}>
          {ZIPTO_LETTERS.map((letter, index) => (
            <LetterPop
              key={letter + index}
              letter={letter}
              delay={index * LETTER_STAGGER}
            />
          ))}
        </View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineSlideY }],
            },
          ]}
        >
          Last-Mile Delivery
        </Animated.Text>
      </View>

      {/* Bottom branding */}
      <Animated.Text style={[styles.poweredBy, { opacity: poweredOpacity }]}>
        Powered by Zipto Technologies
      </Animated.Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ziptoLetter: {
    fontSize: fs(92),
    fontWeight: 'normal',
    color: '#FFFFFF',
    fontFamily: 'Cocon-Regular',
    letterSpacing: ms(0.5),
  },

  tagline: {
    fontSize: fs(12),
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Cocon-Regular',
    letterSpacing: ms(4),
    textTransform: 'uppercase',
    marginTop: 0,
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
