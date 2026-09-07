import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { initiateCashPayment } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const BG = '#F5FAFA';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';

export default function PaymentScreen({ navigation }) {
  const { session } = useAuth();
  const [loadingCash, setLoadingCash] = useState(false);

  const handleCashSelect = async () => {
    setLoadingCash(true);
    try {
      const res = await initiateCashPayment();
      navigation.navigate('PaymentQr', {
        mode: 'cash',
        orderId: res.data.orderId,
        qrImageBase64: res.data.qrImageBase64,
        totalAmount: res.data.totalAmount,
      });
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoadingCash(false);
    }
  };

  return (
      <View style={styles.flex}>
        <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="arrow-left" size={20} color={INK} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Select Payment Type</Text>
            <Text style={styles.headerSub}>{session?.storeName || 'Checkout'}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.container}>
          <Text style={styles.promptTitle}>How would you like to pay?</Text>
          <Text style={styles.promptSub}>
            Pay digitally via UPI to exit immediately, or visit the cashier counter.
          </Text>

          {/* Option A: Online */}
          <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OnlineCheckout')}
              activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: TEAL_SOFT }]}>
              <Icon name="smartphone" size={22} color={TEAL} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.badgeRow}>
                <Text style={styles.cardTitle}>Pay Online</Text>
                <View style={styles.recomPill}><Text style={styles.recomText}>FAST EXIT</Text></View>
              </View>
              <Text style={styles.cardSub}>UPI, PhonePe, GPay, Paytm & Cards</Text>
              <Text style={styles.bullet}>• Pay on your phone without waiting</Text>
              <Text style={styles.bullet}>• Instant exit verification pass</Text>
            </View>
            <Icon name="chevron-right" size={18} color={TEAL} />
          </TouchableOpacity>

          {/* Option B: Counter */}
          <TouchableOpacity
              style={styles.card}
              onPress={handleCashSelect}
              disabled={loadingCash}
              activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="credit-card" size={22} color="#D97706" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Pay at Counter</Text>
              <Text style={styles.cardSub}>Cash or card machine with cashier</Text>
              <Text style={styles.bullet}>• Generates counter check-in QR</Text>
              <Text style={styles.bullet}>• Collect paper invoice from counter</Text>
            </View>
            {loadingCash ? (
                <ActivityIndicator size="small" color="#D97706" />
            ) : (
                <Icon name="chevron-right" size={18} color="#D97706" />
            )}
          </TouchableOpacity>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: INK },
  headerSub: { fontSize: 12, color: MUTED, marginTop: 1 },

  container: { padding: 20, gap: 14, flex: 1, justifyContent: 'center' },
  promptTitle: { fontSize: 18, fontWeight: '800', color: INK },
  promptSub: { fontSize: 13, color: MUTED, lineHeight: 18, marginBottom: 8 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: INK },
  recomPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  recomText: { fontSize: 9, fontWeight: '800', color: '#059669' },
  cardSub: { fontSize: 12, color: MUTED, marginBottom: 6 },
  bullet: { fontSize: 11, color: BODY, lineHeight: 16 },
});