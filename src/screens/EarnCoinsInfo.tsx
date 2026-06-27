import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import EnterView from '../components/EnterView';
import { moderateScale as ms, fontScale as fs } from '../utils/metrics';

const STEPS = [
  {
    icon: 'route',
    title: 'Base coins',
    desc: 'Every completed order earns you 2 coins per km of distance, plus 1 coin for every ₹10 of the order value.',
  },
  {
    icon: 'trending-up',
    title: 'Distance bonus',
    desc: 'Longer trips earn more: 1.25× coins above 10 km, and 1.5× coins above 20 km.',
  },
  {
    icon: 'payments',
    title: 'Order value bonus',
    desc: 'Bigger orders earn more: 1.25× coins above ₹500, and 1.5× coins above ₹1000.',
  },
  {
    icon: 'category',
    title: 'Category bonus',
    desc: 'Essentials earn extra — Medicine 1.3×, Food 1.2×, Parcels 1.1×.',
  },
  {
    icon: 'verified',
    title: 'Guaranteed minimum',
    desc: 'You always earn at least 5 coins on every completed delivery.',
  },
];

const EarnCoinsInfo = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={ms(22)} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earn bookfleet Coins</Text>
          <View style={{ width: ms(40) }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <EnterView delay={0}>
          <ImageBackground
            source={require('../assets/images/earn.jpeg')}
            style={styles.hero}
            imageStyle={styles.heroImage}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroIconCircle}>
              <MaterialIcons name="stars" size={ms(30)} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Coins on every order</Text>
            <Text style={styles.heroSub}>
              Complete a delivery and bookfleet coins are added to your balance automatically — the
              farther and bigger the order, the more you earn.
            </Text>
          </ImageBackground>
        </EnterView>

        {/* How it's calculated */}
        <EnterView delay={60}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>How your coins are calculated</Text>
            {STEPS.map((s, i) => (
              <View key={i} style={[styles.stepRow, i === STEPS.length - 1 && { marginBottom: 0 }]}>
                <View style={styles.stepIcon}>
                  <MaterialIcons name={s.icon as any} size={ms(18)} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </EnterView>

        {/* Example */}
        <EnterView delay={120}>
          <View style={styles.exampleCard}>
            <Text style={styles.sectionTitle}>Example</Text>
            <Text style={styles.exampleLine}>
              A <Text style={styles.bold}>12 km</Text> delivery worth{' '}
              <Text style={styles.bold}>₹600</Text>:
            </Text>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleLabel}>Distance: 12 × 2</Text>
              <Text style={styles.exampleVal}>24 coins</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleLabel}>Order: ₹600 ÷ 10</Text>
              <Text style={styles.exampleVal}>60 coins</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleLabel}>Bonus: 1.25× (over 10 km & ₹500)</Text>
              <Text style={styles.exampleVal}>×1.25</Text>
            </View>
            <View style={styles.exampleDivider} />
            <View style={styles.exampleRow}>
              <Text style={styles.exampleTotalLabel}>You earn</Text>
              <Text style={styles.exampleTotalVal}>≈ 105 coins</Text>
            </View>
          </View>
        </EnterView>

        {/* Redeem value */}
        <EnterView delay={160}>
          <View style={styles.valueCard}>
            <MaterialIcons name="account-balance-wallet" size={ms(22)} color="#2563EB" />
            <Text style={styles.valueText}>
              <Text style={styles.bold}>100 coins = ₹2</Text>. Coins can be redeemed towards your
              wallet — they never expire.
            </Text>
          </View>
        </EnterView>

        {/* CTA */}
        <EnterView delay={200}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.9}
          >
            <MaterialIcons name="local-shipping" size={ms(18)} color="#FFFFFF" />
            <Text style={styles.ctaText}>Book a delivery</Text>
          </TouchableOpacity>
        </EnterView>

        <View style={{ height: ms(24) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safeTop: { backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: fs(17), fontWeight: '700', color: '#111827' },
  scroll: { padding: ms(16), gap: ms(14) },

  hero: { borderRadius: ms(20), padding: ms(20), alignItems: 'center', overflow: 'hidden', minHeight: ms(200) },
  heroImage: { borderRadius: ms(20) },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(180, 90, 0, 0.55)',
    borderRadius: ms(20),
  },
  heroIconCircle: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  heroTitle: { fontSize: fs(22), fontWeight: '900', color: '#FFFFFF', marginBottom: ms(6) },
  heroSub: { fontSize: fs(13), color: '#FEF3C7', textAlign: 'center', lineHeight: fs(19) },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#EFF2F7',
  },
  sectionTitle: { fontSize: fs(15), fontWeight: '800', color: '#111827', marginBottom: ms(14) },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(12), marginBottom: ms(16) },
  stepIcon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepTitle: { fontSize: fs(13.5), fontWeight: '700', color: '#111827', marginBottom: ms(2) },
  stepDesc: { fontSize: fs(12), color: '#6B7280', lineHeight: fs(17) },

  exampleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#EFF2F7',
  },
  exampleLine: { fontSize: fs(13), color: '#374151', marginBottom: ms(10) },
  bold: { fontWeight: '800', color: '#111827' },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ms(5),
  },
  exampleLabel: { fontSize: fs(12.5), color: '#6B7280' },
  exampleVal: { fontSize: fs(12.5), fontWeight: '700', color: '#374151' },
  exampleDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: ms(8) },
  exampleTotalLabel: { fontSize: fs(14), fontWeight: '800', color: '#111827' },
  exampleTotalVal: { fontSize: fs(16), fontWeight: '900', color: '#D97706' },

  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: '#EFF6FF',
    borderRadius: ms(16),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  valueText: { flex: 1, fontSize: fs(13), color: '#1E40AF', lineHeight: fs(19) },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: '#2563EB',
    borderRadius: ms(14),
    paddingVertical: ms(15),
  },
  ctaText: { fontSize: fs(15), fontWeight: '700', color: '#FFFFFF' },
});

export default EarnCoinsInfo;
