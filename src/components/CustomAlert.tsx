import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale as ms, fontScale as fs, verticalScale as vs, horizontalScale as hs } from '../utils/metrics';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: AlertType;
}

// ─── Global setter ────────────────────────────────────────────────────────────

let _show: ((cfg: AlertConfig) => void) | null = null;

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  type?: AlertType,
) {
  _show?.({ title, message, buttons, type });
}

// ─── Config per type ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AlertType, { icon: string; color: string; bg: string }> = {
  success: { icon: 'check-circle',    color: '#10B981', bg: '#ECFDF5' },
  error:   { icon: 'cancel',          color: '#EF4444', bg: '#FEF2F2' },
  warning: { icon: 'warning',         color: '#F59E0B', bg: '#FFFBEB' },
  info:    { icon: 'info',            color: '#3B82F6', bg: '#EFF6FF' },
  confirm: { icon: 'help',            color: '#6366F1', bg: '#EEF2FF' },
};

function inferType(title: string, buttons?: AlertButton[]): AlertType {
  const t = title.toLowerCase();
  if (buttons && buttons.some(b => b.style === 'destructive')) return 'confirm';
  if (/success|done|complet|great|congrat|sent|verified/.test(t)) return 'success';
  if (/error|fail|invalid|wrong|unable|unavail/.test(t)) return 'error';
  if (/warn|caution|sure|confirm|cancel/.test(t)) return 'warning';
  return 'info';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CustomAlert: React.FC = () => {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const scaleAnim  = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    _show = (cfg) => {
      setConfig(cfg);
      setVisible(true);
    };
    return () => { _show = null; };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const dismiss = useCallback((btn?: AlertButton) => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      btn?.onPress?.();
    });
  }, []);

  if (!config) return null;

  const type = config.type ?? inferType(config.title, config.buttons);
  const { icon, color, bg } = TYPE_CONFIG[type];
  const buttons = config.buttons?.length ? config.buttons : [{ text: 'OK', style: 'default' as const }];

  const primaryBtns = buttons.filter(b => b.style !== 'cancel');
  const cancelBtn   = buttons.find(b => b.style === 'cancel');

  return (
    <Modal transparent visible={visible} statusBarTranslucent animationType="none">
      <TouchableWithoutFeedback onPress={() => dismiss(cancelBtn)}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[s.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>

              {/* Icon */}
              <View style={[s.iconCircle, { backgroundColor: bg }]}>
                <MaterialIcons name={icon} size={ms(36)} color={color} />
              </View>

              {/* Title */}
              <Text style={s.title}>{config.title}</Text>

              {/* Message */}
              {config.message ? (
                <Text style={s.message}>{config.message}</Text>
              ) : null}

              {/* Buttons */}
              <View style={s.btnGroup}>
                {primaryBtns.map((btn, i) => {
                  const isDestructive = btn.style === 'destructive';
                  const btnColor = isDestructive ? '#EF4444' : color;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.btnPrimary, { backgroundColor: btnColor }]}
                      onPress={() => dismiss(btn)}
                      activeOpacity={0.82}
                    >
                      <Text style={s.btnPrimaryText}>{btn.text}</Text>
                    </TouchableOpacity>
                  );
                })}

                {cancelBtn && (
                  <TouchableOpacity
                    style={s.btnCancel}
                    onPress={() => dismiss(cancelBtn)}
                    activeOpacity={0.75}
                  >
                    <Text style={s.btnCancelText}>{cancelBtn.text}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: hs(28),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(24),
    paddingHorizontal: hs(24),
    paddingTop: vs(32),
    paddingBottom: vs(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  iconCircle: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  title: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    marginBottom: vs(6),
    letterSpacing: -0.2,
  },
  message: {
    fontSize: fs(14),
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    lineHeight: fs(21),
    marginBottom: vs(4),
  },
  btnGroup: {
    width: '100%',
    marginTop: vs(20),
    gap: vs(10),
  },
  btnPrimary: {
    width: '100%',
    paddingVertical: vs(14),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.2,
  },
  btnCancel: {
    width: '100%',
    paddingVertical: vs(13),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  btnCancelText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Poppins-SemiBold',
  },
});
