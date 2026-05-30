import { SCREEN_WIDTH, SCREEN_HEIGHT, scaleW, scaleH, ms, fs } from '../utils/responsive';

// On both iOS and Android the PostScript name (Poppins-Regular, etc.) is correct.
// iOS uses the PostScript name from the font file; Android uses the filename without extension.
// Both are identical for Poppins, so no Platform.select needed.
const FONT_FAMILY         = 'Poppins-Regular';
const FONT_FAMILY_MEDIUM  = 'Poppins-Medium';
const FONT_FAMILY_BOLD    = 'Poppins-Bold';
const FONT_FAMILY_SEMIBOLD = 'Poppins-SemiBold';

export const COLORS = {
  primary: '#FF6D00', // Vibrant Orange
  secondary: '#2979FF', // Accent Blue
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#FBC02D',
  border: '#E0E0E0',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const SPACING = {
  xs: ms(4),
  s: ms(8),
  m: ms(16),
  l: ms(24),
  xl: ms(32),
  xxl: ms(48),
};

export const FONTS = {
  regular: FONT_FAMILY,
  medium: FONT_FAMILY_MEDIUM,
  bold: FONT_FAMILY_BOLD,
  semibold: FONT_FAMILY_SEMIBOLD,
};

export const SIZES = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  h1: fs(30),
  h2: fs(24),
  h3: fs(20),
  body1: fs(16),
  body2: fs(14),
  caption: fs(12),
};

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  fonts: FONTS,
  sizes: SIZES,
  responsive: {
    scaleW,
    scaleH,
    ms,
    fs,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
  },
};
