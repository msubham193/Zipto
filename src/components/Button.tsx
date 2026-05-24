import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { THEME } from '../theme';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  children,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return THEME.colors.border;
    if (variant === 'primary') return THEME.colors.primary;
    if (variant === 'secondary') return THEME.colors.secondary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return THEME.colors.textSecondary;
    if (variant === 'outline') return THEME.colors.primary;
    if (variant === 'text') return THEME.colors.primary;
    return THEME.colors.white;
  };

  const getBorder = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: disabled ? THEME.colors.border : THEME.colors.primary,
      };
    }
    return {};
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : children ? (
        children
      ) : (
        <>
          {icon && icon}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: THEME.responsive.ms(48),
    borderRadius: THEME.responsive.ms(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.m,
  },
  text: {
    fontFamily: THEME.fonts.medium,
    fontSize: THEME.responsive.fs(THEME.sizes.body1),
    fontWeight: '600',
  },
});
