import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { verticalScale as vs, moderateScale as ms, fontScale as fs } from '../utils/metrics';

const BOOKFLEET_LETTERS = ['b', 'o', 'o', 'k', 'f', 'l', 'e', 'e', 't'];

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
        styles.bookfleetLetter,
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

  const LETTER_STAGGER = 110;
  const LAST_LETTER_DELAY = (BOOKFLEET_LETTERS.length - 1) * LETTER_STAGGER;
  const TAGLINE_DELAY = LAST_LETTER_DELAY + 250;
  const POWERED_DELAY = LAST_LETTER_DELAY + 520;

  useEffect(() => {
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

    Animated.timing(poweredOpacity, {
      toValue: 1,
      duration: 400,
      delay: POWERED_DELAY,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={['#0C1D6C', '#1E22AD', '#3F60E5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E22AD" />

      <View style={styles.content}>
        <View style={styles.lettersRow}>
          {BOOKFLEET_LETTERS.map((letter, index) => (
            <LetterPop
              key={letter + index}
              letter={letter}
              delay={index * LETTER_STAGGER}
            />
          ))}
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineSlideY }],
            },
          ]}
        >
          move anything anytime
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.poweredBy, { opacity: poweredOpacity }]}>
        Powered by Zipto Hyperlogistics Pvt. Ltd.
      </Animated.Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: ms(24),
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookfleetLetter: {
    fontSize: fs(52),
    fontWeight: 'normal',
    color: '#FFFFFF',
    fontFamily: 'Cocon-Regular',
    letterSpacing: ms(0.5),
  },
  tagline: {
    fontSize: fs(12),
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Cocon-Regular',
    letterSpacing: ms(4),
    textTransform: 'uppercase',
    marginTop: vs(16),
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
