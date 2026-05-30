import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Reanimated, { FadeInDown, FadeIn, Easing } from 'react-native-reanimated';

/**
 * Shared, calm easing for every entrance transition across the app.
 * cubic-bezier(0.22, 1, 0.36, 1) — a smooth ease-out that settles without
 * any spring/bounce, the same curve used by Linear/Stripe-style UIs.
 */
export const ENTER_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const DURATION = 420;

type EnterViewProps = {
  children: React.ReactNode;
  /** Stagger delay in ms. Use 0, 60, 120, 180… down the screen. */
  delay?: number;
  /** "up" = fade + slide up (default), "fade" = fade only (subtle lists). */
  variant?: 'up' | 'fade';
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

/**
 * Wrap any section to give it the app-wide professional entrance.
 *
 *   <EnterView delay={60}>...</EnterView>
 *
 * Runs on the UI thread (Reanimated `entering`), so it never blocks JS and
 * adds no per-frame work after it settles.
 */
const EnterView: React.FC<EnterViewProps> = ({
  children,
  delay = 0,
  variant = 'up',
  style,
  pointerEvents,
}) => {
  const entering =
    variant === 'fade'
      ? FadeIn.delay(delay).duration(DURATION).easing(ENTER_EASE)
      : FadeInDown.delay(delay).duration(DURATION).easing(ENTER_EASE);

  return (
    <Reanimated.View entering={entering} style={style} pointerEvents={pointerEvents}>
      {children}
    </Reanimated.View>
  );
};

export default EnterView;
