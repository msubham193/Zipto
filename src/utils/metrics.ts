import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

const guidelineBaseWidth  = 375;
const guidelineBaseHeight = 812;

/**
 * Scale a horizontal size relative to the 375-pt baseline width.
 * Use for: paddings, margins, widths, icon sizes.
 */
const horizontalScale = (size: number): number =>
  (width / guidelineBaseWidth) * size;

/**
 * Scale a vertical size relative to the 812-pt baseline height.
 * Use for: heights, vertical paddings, top/bottom margins.
 */
const verticalScale = (size: number): number =>
  (height / guidelineBaseHeight) * size;

/**
 * Moderate scale blends horizontal scaling with a dampening factor
 * so values don't grow as aggressively on large screens.
 * Default factor 0.5 — increase toward 1 for more aggressive scaling.
 * Use for: font sizes, border-radii, component sizes.
 */
const moderateScale = (size: number, factor = 0.5): number =>
  size + (horizontalScale(size) - size) * factor;

/**
 * Font-safe scale: applies moderateScale then snaps to the nearest
 * pixel boundary to avoid sub-pixel text rendering artefacts.
 * Use for: all fontSize values.
 */
const fontScale = (size: number, factor = 0.5): number =>
  Math.round(PixelRatio.roundToNearestPixel(moderateScale(size, factor)));

// ─── Device dimensions ────────────────────────────────────────────────────────
const SCREEN_WIDTH  = width;
const SCREEN_HEIGHT = height;
const isSmallDevice = width <= 360;
const isLargeDevice = width >= 768;

export {
  horizontalScale,
  verticalScale,
  moderateScale,
  fontScale,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isSmallDevice,
  isLargeDevice,
};
