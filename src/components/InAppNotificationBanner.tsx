/**
 * Zomato-style in-app notification banner for the customer app.
 * Slides down from the top, auto-dismisses after 5 seconds.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface Props {
  notification: NotificationPayload | null;
  onDismiss: () => void;
  onPress?: (notification: NotificationPayload) => void;
}

const AUTO_DISMISS_MS = 5000;

const TYPE_CONFIG: Record<string, { icon: string; accentColor: string }> = {
  booking_accepted: { icon: '🚀', accentColor: '#1E22AD' },
  trip_started:     { icon: '📦', accentColor: '#F59E0B' },
  trip_completed:   { icon: '✅', accentColor: '#10B981' },
  payment:          { icon: '💰', accentColor: '#10B981' },
  general:          { icon: '📣', accentColor: '#6B7280' },
};

export function InAppNotificationBanner({ notification, onDismiss, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-160)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -160,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }, [translateY, onDismiss]);

  useEffect(() => {
    if (!notification) return;

    Animated.spring(translateY, {
      toValue: 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification, translateY, dismiss]);

  if (!notification) return null;

  const type = notification.data?.type ?? 'general';
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, borderLeftColor: config.accentColor },
        { transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.inner}
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          onPress?.(notification);
          dismiss();
        }}
      >
        <Text style={styles.icon}>{config.icon}</Text>

        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            dismiss();
          }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  icon: {
    fontSize: 22,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  closeBtn: {
    marginLeft: 4,
  },
  closeText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});