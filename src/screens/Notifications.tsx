import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  PixelRatio,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {notificationApi} from '../api/client';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms = (size: number, factor = 0.45) =>
  size + (scaleW(size) - size) * factor;
const fs = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(ms(size)));
// ─────────────────────────────────────────────────────────────────────────────

interface CustomerNotification {
  id: string;
  type: 'approval' | 'rejection' | 'payment' | 'weekly_earnings' | 'general';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: number;
  read: boolean;
}

const NOTIF_ICON: Record<CustomerNotification['type'], string> = {
  approval: 'check-circle',
  rejection: 'cancel',
  payment: 'account-balance-wallet',
  weekly_earnings: 'bar-chart',
  general: 'notifications',
};

const NOTIF_COLOR: Record<CustomerNotification['type'], string> = {
  approval: '#16A34A',
  rejection: '#DC2626',
  payment: '#2563EB',
  weekly_earnings: '#7C3AED',
  general: '#6B7280',
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) {return `${diff}s ago`;}
  if (diff < 3600) {return `${Math.floor(diff / 60)}m ago`;}
  if (diff < 86400) {return `${Math.floor(diff / 3600)}h ago`;}
  return `${Math.floor(diff / 86400)}d ago`;
}

const Notifications = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      if (mountedRef.current && res?.data) {
        setNotifications(res.data);
        notificationApi.markAllRead().catch(() => {});
      }
    } catch {
      // silently ignore — show empty state
    } finally {
      if (mountedRef.current) {setLoading(false);}
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchNotifications]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'This will remove all notifications. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await notificationApi.clearAll();
              if (mountedRef.current) {setNotifications([]);}
            } catch {
              Alert.alert('Error', 'Failed to clear notifications.');
            } finally {
              if (mountedRef.current) {setClearing(false);}
            }
          },
        },
      ],
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={fetchNotifications}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={styles.iconBtn}>
              <MaterialIcons name="refresh" size={ms(22)} color="#3B82F6" />
            </TouchableOpacity>
            {notifications.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                disabled={clearing}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                style={styles.iconBtn}>
                <MaterialIcons
                  name="delete-sweep"
                  size={ms(22)}
                  color={clearing ? '#CBD5E1' : '#EF4444'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons
                name="notifications-none"
                size={ms(56)}
                color="#CBD5E1"
              />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              We'll let you know about your orders, offers, and account updates
              here.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {notifications.map((notif, index) => (
              <View
                key={notif.id}
                style={[
                  styles.card,
                  !notif.read && styles.cardUnread,
                  index === notifications.length - 1 && {marginBottom: 0},
                ]}>
                {/* Icon */}
                <View
                  style={[
                    styles.iconWrap,
                    {backgroundColor: `${NOTIF_COLOR[notif.type]}18`},
                  ]}>
                  <MaterialIcons
                    name={NOTIF_ICON[notif.type]}
                    size={ms(22)}
                    color={NOTIF_COLOR[notif.type]}
                  />
                </View>

                {/* Content */}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={styles.cardMessage} numberOfLines={3}>
                    {notif.message}
                  </Text>
                  <Text style={styles.cardTime}>{timeAgo(notif.createdAt)}</Text>
                </View>

                {/* Unread dot */}
                {!notif.read && (
                  <View style={styles.unreadDot} />
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  safeArea: {flex: 1},

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleW(16),
    paddingVertical: scaleH(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      android: {elevation: 2},
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
    }),
  },
  backButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleW(8),
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
  },
  badgeWrap: {
    backgroundColor: '#EF4444',
    borderRadius: ms(10),
    minWidth: ms(20),
    height: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleW(5),
  },
  badgeText: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleW(4),
  },
  iconBtn: {
    width: ms(36),
    height: ms(36),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Loading / Empty ──
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleW(40),
  },
  emptyIconWrap: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(20),
  },
  emptyTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(8),
  },
  emptySubtitle: {
    fontSize: fs(14),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(14) * 1.55,
  },

  // ── Notification card ──
  scrollContent: {
    padding: scaleW(16),
    paddingBottom: scaleH(40),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(14),
    padding: scaleW(14),
    marginBottom: scaleH(10),
    ...Platform.select({
      android: {elevation: 1},
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  iconWrap: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleW(12),
    flexShrink: 0,
  },
  cardBody: {flex: 1},
  cardTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    color: '#0F172A',
    marginBottom: scaleH(3),
  },
  cardMessage: {
    fontSize: fs(13),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    lineHeight: fs(13) * 1.5,
    marginBottom: scaleH(4),
  },
  cardTime: {
    fontSize: fs(11),
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
  },
  unreadDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: '#3B82F6',
    marginLeft: scaleW(8),
    marginTop: scaleH(4),
    flexShrink: 0,
  },
});

export default Notifications;
