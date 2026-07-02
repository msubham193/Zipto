import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { vehicleApi } from '../api/vehicle';
import { moderateScale as ms, fontScale as fs } from '../utils/metrics';

const RATED_BOOKINGS_KEY = 'bookfleet_rated_bookings';

interface RatingModalProps {
  visible: boolean;
  bookingId: string;
  driverName?: string;
  /** Called after the rating is submitted OR the user dismisses ("Maybe later"). */
  onClose: () => void;
  /** Called only after a successful submit. */
  onSubmitted?: () => void;
}

const RATING_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  bookingId,
  driverName,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setRating(0);
    setComment('');
    setError('');
    setSubmitting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please select a star rating');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await vehicleApi.submitRating({
        booking_id: bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      // Persist so MyOrders never re-prompts for this booking
      try {
        const raw = await AsyncStorage.getItem(RATED_BOOKINGS_KEY);
        const existing = raw ? JSON.parse(raw) : {};
        existing[bookingId] = rating;
        await AsyncStorage.setItem(RATED_BOOKINGS_KEY, JSON.stringify(existing));
      } catch { /* non-critical */ }
      reset();
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message ?? 'Could not submit rating';
      const msg = Array.isArray(raw) ? raw.join('\n') : String(raw);
      // If it was already rated, treat as done (don't trap the user).
      if (/already rated/i.test(msg)) {
        reset();
        onSubmitted?.();
        onClose();
        return;
      }
      setError(msg);
      setSubmitting(false);
    }
  };

  const initial = (driverName || 'R').charAt(0).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === ‘ios’ ? ‘padding’ : ‘height’}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <Text style={styles.title}>Rate your delivery</Text>
            <Text style={styles.subtitle}>
              {driverName ? `How was ${driverName}’s service?` : "How was your rider’s service?"}
            </Text>

            {/* Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <Pressable
                  key={n}
                  onPress={() => { setRating(n); setError(‘’); }}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <MaterialIcons
                    name={n <= rating ? ‘star’ : ‘star-border’}
                    size={ms(38)}
                    color={n <= rating ? ‘#F59E0B’ : ‘#D1D5DB’}
                  />
                </Pressable>
              ))}
            </View>
            {rating > 0 && <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>}

            {/* Comment */}
            <TextInput
              style={styles.input}
              placeholder="Add a comment (optional)"
              placeholderTextColor="#9CA3AF"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (rating < 1 || submitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={rating < 1 || submitting}
              activeOpacity={0.9}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Rating</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} disabled={submitting} style={styles.laterBtn}>
              <Text style={styles.laterBtnText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(24),
    paddingVertical: ms(24),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(22),
    paddingTop: ms(22),
    paddingBottom: ms(16),
    paddingHorizontal: ms(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(8) },
    shadowOpacity: 0.2,
    shadowRadius: ms(16),
    elevation: 12,
  },
  avatar: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  avatarText: { color: '#FFFFFF', fontSize: fs(24), fontWeight: '800' },
  title: { fontSize: fs(18), fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: fs(13), color: '#6B7280', marginTop: ms(4), textAlign: 'center' },
  starsRow: {
    flexDirection: 'row',
    gap: ms(6),
    marginTop: ms(18),
  },
  ratingLabel: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: ms(8),
  },
  input: {
    width: '100%',
    minHeight: ms(72),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingTop: ms(10),
    paddingBottom: ms(10),
    fontSize: fs(14),
    color: '#111827',
    marginTop: ms(16),
  },
  errorText: { color: '#EF4444', fontSize: fs(12), marginTop: ms(8), alignSelf: 'flex-start' },
  submitBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: ms(14),
    paddingVertical: ms(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ms(16),
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '700' },
  laterBtn: { paddingVertical: ms(12), marginTop: ms(2) },
  laterBtnText: { color: '#6B7280', fontSize: fs(13), fontWeight: '600' },
});

export default RatingModal;
