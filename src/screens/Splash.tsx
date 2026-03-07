import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useAuthStore } from '../store/useAuthStore';

const Splash = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('👤 Already authenticated! Bearer Token:', token);
    }

    const timer = setTimeout(() => {
      navigation.replace('LanguageSelection');
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
          
          {/* Logo */}
          <Image
            source={require('../assets/images/logo_zipto.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* Gradient Zipto Text */}
         <MaskedView
  maskElement={
    <Text style={styles.ziptoTextMask}>
      Zipto
    </Text>
  }
>
  {/* <LinearGradient
    colors={['#2563EB', '#7C3AED', '#EC4899']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
  >
    <Text style={[styles.ziptoTextMask, { opacity: 0 }]}>
      Zipto
    </Text>
  </LinearGradient> */}
</MaskedView>

        </View>
      </View>
    </View>
  );
};

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

  logoImage: {
    width: 220,
    height: 220,
  },

  ziptoTextMask: {
    fontSize: 38,
    fontWeight: 'bold',
    marginTop: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default Splash;