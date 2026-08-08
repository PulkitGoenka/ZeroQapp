import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { initiateCashPayment } from '../../services/api';

// FLOW FIX
// ─────────────────────────────────────────────────────────
// ONLINE  → does NOT generate a QR here anymore.
//           It goes to OnlineCheckoutScreen (bill + gateway picker).
//           The exit QR is only generated AFTER the gateway payment
//           succeeds, because the online QR must already mean "PAID".
//
// CASH    → generates the counter QR immediately, right here,
//           BEFORE any payment happens. Nothing is paid yet.
//           PaymentQrScreen (cash mode) keeps the back button live
//           so the user can go back, keep scanning/adding items,
//           and come back — the counter will re-fetch the latest
//           cart when they scan the QR, so it's never stale.
// ─────────────────────────────────────────────────────────

export default function PaymentScreen({ navigation }) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(null);

  const handleOnline = () => {
    // No API call yet — just go see the bill and pick a gateway.
    navigation.navigate('OnlineCheckout');
  };

  const handleCash = async () => {
    setLoading('cash');
    try {
      // Generate counter QR right away — this is an UNPAID QR.
      const res = await initiateCashPayment();
      navigation.navigate('PaymentQr', {
        mode:          'cash',
        orderId:       res.data.orderId,
        qrImageBase64: res.data.qrImageBase64,
        qrToken:       res.data.qrToken,
        totalAmount:   res.data.totalAmount,
        expirySeconds: res.data.qrExpirySeconds,
        paid:          false,      // <-- explicit: not paid yet
        allowBack:     true,       // <-- explicit: user can still edit cart
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
      <View style={styles.flex}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Choose Payment</Text>
            <Text style={styles.headerSub}>{session?.storeName}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.body}>

          {/* Online */}
          <TouchableOpacity
              style={[styles.card, styles.onlineCard]}
              onPress={handleOnline}
              disabled={!!loading}
              activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="smartphone" size={32} color="#2563EB" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: '#2563EB' }]}>Pay Online</Text>
              <Text style={styles.cardSub}>UPI / PhonePe / GPay / Paytm</Text>
              <View style={styles.stepList}>
                <Text style={styles.step}>1. Review your bill</Text>
                <Text style={styles.step}>2. Choose a payment app & pay</Text>
                <Text style={styles.step}>3. Exit QR generated (already paid)</Text>
                <Text style={styles.step}>4. Show QR to security at gate</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#2563EB" />
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          {/* Cash */}
          <TouchableOpacity
              style={[styles.card, styles.cashCard]}
              onPress={handleCash}
              disabled={!!loading}
              activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="credit-card" size={32} color="#059669" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: '#059669' }]}>Pay at Counter</Text>
              <Text style={styles.cardSub}>Cash / Card at billing counter</Text>
              <View style={styles.stepList}>
                <Text style={styles.step}>1. Counter QR generated now (unpaid)</Text>
                <Text style={styles.step}>2. You can still go back &amp; add items</Text>
                <Text style={styles.step}>3. Show QR to counter staff</Text>
                <Text style={styles.step}>4. Staff scans → fetches latest cart</Text>
                <Text style={styles.step}>5. Pay cash/card → get paper bill</Text>
              </View>
            </View>
            {loading === 'cash'
                ? <ActivityIndicator color="#059669" />
                : <Icon name="chevron-right" size={20} color="#059669" />
            }
          </TouchableOpacity>

        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  body: { flex: 1, padding: 20, gap: 16, justifyContent: 'center' },

  card: {
    borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderWidth: 1.5,
  },
  onlineCard: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  cashCard:   { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },

  iconBox: {
    width: 60, height: 60, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  cardSub:   { fontSize: 12, color: '#374151', fontWeight: '600', marginBottom: 10 },
  stepList:  { gap: 3 },
  step:      { fontSize: 12, color: '#6B7280', lineHeight: 18 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
});