import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle, Modal } from 'react-native';
import { THEME } from '../theme';

interface SpinnerProps {
  visible?: boolean;
  size?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
  style?: ViewStyle;
}

const Spinner: React.FC<SpinnerProps> = ({
  visible = true,
  size = 'large',
  color = '#3B82F6',
  overlay = false,
  style,
}) => {
  if (!visible) return null;

  const spinner = (
    <View style={[styles.container, !overlay && style]}>
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator size={size} color={color} />
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={[styles.overlayContainer, style]}>
          <View style={styles.spinnerWrapper}>
            <ActivityIndicator size={size} color={color} />
          </View>
        </View>
      </Modal>
    );
  }

  return spinner;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  spinnerWrapper: {
    padding: THEME.responsive.ms(20),
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.responsive.ms(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default Spinner;
