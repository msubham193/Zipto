import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showAlert } from '../../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { horizontalScale as hs, verticalScale as vs, moderateScale as ms, fontScale as fs } from '../../utils/metrics';

const REVIEW_SUBMITTED_KEY = 'bookfleet_review_submitted';

// ─── Derived responsive values ────────────────────────────────────────────────
const backBtnSize = ms(40);

// ─── Star Rating Component ────────────────────────────────────────────────────
const StarRating = ({
  rating,
  onRate,
  size = 36,
}: {
  rating: number;
  onRate: (r: number) => void;
  size?: number;
}) => (
  <View style={starStyles.row}>
    {[1, 2, 3, 4, 5].map(star => (
      <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7}>
        <MaterialIcons
          name={star <= rating ? 'star' : 'star-border'}
          size={ms(size)}
          color={star <= rating ? '#F59E0B' : '#CBD5E1'}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: hs(6) },
});

// ─── Rating Label ─────────────────────────────────────────────────────────────
const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

// ─── Quick Tags ───────────────────────────────────────────────────────────────
const QUICK_TAGS = [
  'Fast delivery',
  'Careful handling',
  'Friendly rider',
  'On time',
  'Good packaging',
  'Professional',
  'Smooth experience',
  'Would recommend',
];

// ─── Component ────────────────────────────────────────────────────────────────
const WriteReview = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      // TODO: call your review API here
      // await vehicleApi.submitReview({ rating, review: reviewText, tags: selectedTags });
      await new Promise<void>(resolve => setTimeout(resolve, 1000)); // mock delay
      await AsyncStorage.setItem(REVIEW_SUBMITTED_KEY, 'true');
      showAlert(
        'Review Submitted! 🎉',
        `You earned +5 coins for writing a review. Thank you for your feedback!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      showAlert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isReady = rating > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={ms(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write a Review</Text>
          <View style={{ width: backBtnSize }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* Coins Reward Banner */}
          <View style={styles.rewardBanner}>
            <MaterialIcons name="stars" size={ms(22)} color="#F59E0B" />
            <Text style={styles.rewardText}>
              Earn <Text style={styles.rewardHighlight}>+5 coins</Text> for writing a review!
            </Text>
          </View>

          {/* Star Rating Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How was your experience?</Text>
            <Text style={styles.cardSubtitle}>Tap a star to rate your delivery</Text>

            <View style={styles.starsContainer}>
              <StarRating rating={rating} onRate={setRating} size={40} />
            </View>

            {rating > 0 && (
              <View style={styles.ratingLabelContainer}>
                <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
              </View>
            )}
          </View>

          {/* Quick Tags */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What went well?</Text>
            <Text style={styles.cardSubtitle}>Select all that apply</Text>
            <View style={styles.tagsWrap}>
              {QUICK_TAGS.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, active && styles.tagActive]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.75}
                  >
                    {active && (
                      <MaterialIcons name="check" size={ms(13)} color="#3B82F6" />
                    )}
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Written Review */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add a comment</Text>
            <Text style={styles.cardSubtitle}>Optional — share more details</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us about your delivery experience..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              maxLength={500}
              value={reviewText}
              onChangeText={setReviewText}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{reviewText.length}/500</Text>
          </View>

        </ScrollView>

        {/* Submit Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, !isReady && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isReady || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="send" size={ms(18)} color={isReady ? '#FFFFFF' : '#9CA3AF'} />
                <Text style={[styles.submitText, !isReady && styles.submitTextDisabled]}>
                  Submit Review
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },
  flex1: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hs(16),
    paddingVertical: vs(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: backBtnSize,
    height: backBtnSize,
    borderRadius: backBtnSize / 2,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: 'bold',
    color: '#0F172A',
  },

  // ── Scroll ──
  scrollView: { flex: 1 },
  scrollContent: {
    padding: hs(16),
    paddingBottom: vs(24),
    gap: vs(16),
  },

  // ── Reward Banner ──
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: ms(12),
    padding: ms(14),
    gap: hs(10),
  },
  rewardText: {
    fontSize: fs(14),
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  rewardHighlight: {
    fontWeight: '800',
    color: '#D97706',
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: vs(4),
  },
  cardSubtitle: {
    fontSize: fs(13),
    color: '#64748B',
    marginBottom: vs(16),
  },

  // ── Stars ──
  starsContainer: {
    alignItems: 'center',
    marginBottom: vs(12),
  },
  ratingLabelContainer: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#F59E0B',
  },

  // ── Tags ──
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hs(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(4),
    paddingHorizontal: hs(14),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tagActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  tagText: {
    fontSize: fs(13),
    color: '#64748B',
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  // ── Text Input ──
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: ms(12),
    padding: ms(14),
    fontSize: fs(14),
    color: '#0F172A',
    minHeight: vs(120),
    backgroundColor: '#F8FAFC',
  },
  charCount: {
    fontSize: fs(12),
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: vs(6),
  },

  // ── Footer ──
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hs(16),
    paddingVertical: vs(16),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    backgroundColor: '#3B82F6',
    borderRadius: ms(14),
    paddingVertical: vs(16),
  },
  submitBtnDisabled: { backgroundColor: '#E2E8F0' },
  submitText: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  submitTextDisabled: { color: '#9CA3AF' },
});

export default WriteReview;