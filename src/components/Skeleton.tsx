import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms } from '../utils/metrics';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = vs(16), borderRadius = ms(8), style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height: height as any, borderRadius, opacity },
        style,
      ]}
    />
  );
};

// ─── Composite helpers ────────────────────────────────────────────────────────

export const OrderCardSkeleton: React.FC = () => (
  <View style={skStyles.card}>
    {/* Header row */}
    <View style={skStyles.row}>
      <Skeleton width={ms(40)} height={ms(40)} borderRadius={ms(12)} />
      <View style={{ flex: 1, marginLeft: hs(12), gap: vs(6) }}>
        <Skeleton width="55%" height={vs(14)} />
        <Skeleton width="35%" height={vs(11)} />
      </View>
      <Skeleton width={ms(72)} height={vs(24)} borderRadius={ms(20)} />
    </View>

    <View style={skStyles.divider} />

    {/* Route row */}
    <View style={skStyles.routeRow}>
      <View style={skStyles.routeDots}>
        <Skeleton width={ms(10)} height={ms(10)} borderRadius={ms(5)} />
        <View style={skStyles.routeLine} />
        <Skeleton width={ms(10)} height={ms(10)} borderRadius={ms(5)} />
      </View>
      <View style={{ flex: 1, gap: vs(14) }}>
        <Skeleton width="80%" height={vs(12)} />
        <Skeleton width="65%" height={vs(12)} />
      </View>
    </View>

    <View style={skStyles.divider} />

    {/* Footer row */}
    <View style={skStyles.row}>
      <Skeleton width={ms(60)} height={vs(20)} borderRadius={ms(6)} />
      <Skeleton width={ms(80)} height={vs(28)} borderRadius={ms(8)} />
    </View>
  </View>
);

export const HomeServiceCardSkeleton: React.FC = () => (
  <View style={hsStyles.card}>
    <View style={hsStyles.top}>
      <Skeleton width={ms(48)} height={ms(48)} borderRadius={ms(12)} />
      <Skeleton width={ms(24)} height={ms(24)} borderRadius={ms(12)} />
    </View>
    <View style={{ marginTop: vs(28), gap: vs(6) }}>
      <Skeleton width="65%" height={vs(13)} />
      <Skeleton width="80%" height={vs(10)} />
    </View>
  </View>
);

export const HomeBannerSkeleton: React.FC = () => (
  <Skeleton
    width="100%"
    height={undefined}
    borderRadius={ms(16)}
    style={{ aspectRatio: 16 / 8, marginBottom: vs(24) }}
  />
);

export const HomeLocationSkeleton: React.FC = () => (
  <Skeleton width={hs(160)} height={vs(14)} borderRadius={ms(6)} />
);

export const NotificationRowSkeleton: React.FC = () => (
  <View style={nkStyles.row}>
    <Skeleton width={ms(44)} height={ms(44)} borderRadius={ms(22)} />
    <View style={{ flex: 1, marginLeft: hs(12), gap: vs(7) }}>
      <Skeleton width="70%" height={vs(13)} />
      <Skeleton width="90%" height={vs(11)} />
      <Skeleton width="30%" height={vs(10)} />
    </View>
  </View>
);

export const TransactionRowSkeleton: React.FC = () => (
  <View style={txStyles.row}>
    <Skeleton width={ms(44)} height={ms(44)} borderRadius={ms(12)} />
    <View style={{ flex: 1, marginLeft: hs(12), gap: vs(6) }}>
      <Skeleton width="55%" height={vs(13)} />
      <Skeleton width="40%" height={vs(11)} />
    </View>
    <View style={{ alignItems: 'flex-end', gap: vs(6) }}>
      <Skeleton width={ms(60)} height={vs(14)} />
      <Skeleton width={ms(48)} height={vs(11)} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#CBD5E1',
  },
});

const skStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    marginHorizontal: hs(16),
    marginBottom: vs(12),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: vs(12),
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(12),
  },
  routeDots: {
    alignItems: 'center',
    gap: vs(6),
  },
  routeLine: {
    width: 1,
    height: vs(14),
    backgroundColor: '#CBD5E1',
  },
});

const hsStyles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: ms(14),
    borderRadius: ms(16),
    height: ms(150),
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});

const nkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hs(16),
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
});

const txStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    marginHorizontal: hs(16),
    marginBottom: vs(10),
    padding: ms(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
});

export default Skeleton;
