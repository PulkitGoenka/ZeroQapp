import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, BackHandler,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { getPaymentStatus } from '../../services/api';

const POLL_MS = 3000;

// Order lifecycle used by this screen:
//   CASH   : PENDING (unpaid, QR shown at counter)
//              -> PAID     (counter staff confirmed cash/card payment)
//              -> VERIFIED (guard scanned/checked bill at exit gate)
//   ONLINE : PAID (already paid via gateway before this screen loads)
//              -> VERIFIED (guard scanned QR at exit gate)
//
// Backend should return one of: 'PENDING' | 'PAID' | 'VERIFIED' from
// getPaymentStatus(orderId).

export default function PaymentQrScreen({ navigation, route }) {
  const {
    mode, orderId, qrImageBase64, totalAmount, expirySeconds,
    paid = mode === 'online',   // online arrives already paid
  } = route.params;

  // TEMP: back button stays available on every state (pending/paid/online/cash).
  // Locking this down again (e.g. disabling back once paid) can be revisited later.
  const allowBack = true;

  const { clearSession } = useAuth();
  const isCash = mode === 'cash';

  const [timer, setTimer] = useState(expirySeconds || 300);
  const [status, setStatus] = useState(paid ? 'PAID' : 'PENDING');
  const pollRef = useRef(null);

  // Back button (hardware + header) stays live in every state right now.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (status !== 'VERIFIED') {
        navigation.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [status]);

  // Countdown (only meaningful pre-verification)
  useEffect(() => {
    if (status === 'VERIFIED') return;
    const t = setInterval(() => setTimer(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Poll order status.
  // Cash:   counter staff marks PAID, then guard marks VERIFIED at exit.
  // Online: guard marks VERIFIED at exit (already PAID).
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await getPaymentStatus(orderId);
        const s = res.data?.status;
        if (s && s !== status) setStatus(s);
        if (s === 'VERIFIED') clearInterval(pollRef.current);
      } catch {}
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [orderId, status]);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── VERIFIED / SUCCESS STATE ─────────────────────────────────
  if (status === 'VERIFIED') {
    return (
        <View style={styles.flex}>
          <View style={styles.successWrap}>
            <View style={styles.successIconBox}>
              <Icon name="check-circle" size={80} color="#059669" />
            </View>
            <Text style={styles.successTitle}>You're All Set!</Text>
            <Text style={styles.successSub}>
              Security has verified your items at the gate. You're good to go!
            </Text>
            <Text style={styles.successAmt}>₹{totalAmount}</Text>
            <TouchableOpacity style={styles.homeBtn} onPress={async () => {
              await clearSession();
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }}>
              <Icon name="home" size={18} color="#fff" />
              <Text style={styles.homeBtnText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
    );
  }

  // ── QR STATE (PENDING for cash, PAID for both) ───────────────
  const showingExitStage = status === 'PAID'; // waiting on the guard now
  const headerColor = isCash ? '#059669' : '#2563EB';

  return (
      <View style={styles.flex}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
          {status !== 'VERIFIED' && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
                <Icon name="arrow-left" size={20} color="#374151" />
              </TouchableOpacity>
          )}
          <View style={styles.modeBadge}>
            <Icon name={isCash ? 'credit-card' : 'smartphone'} size={14} color={headerColor} />
            <Text style={[styles.modeText, { color: headerColor }]}>
              {isCash ? 'Cash Payment' : 'Online Payment'}
            </Text>
          </View>
          <Text style={styles.headerTitle}>
            {showingExitStage
                ? 'Show QR / Bill at Exit Gate'
                : isCash ? 'Show QR at Counter' : 'Show QR at Exit Gate'}
          </Text>
        </View>

        <View style={styles.body}>

          {/* Amount */}
          <View style={styles.amtCard}>
            <Text style={styles.amtLabel}>
              {status === 'PENDING' ? 'Amount Due' : 'Amount Paid'}
            </Text>
            <Text style={styles.amtValue}>₹{totalAmount}</Text>
            {status !== 'PENDING' && (
                <View style={styles.paidTag}>
                  <Icon name="check" size={12} color="#059669" />
                  <Text style={styles.paidTagText}>PAID</Text>
                </View>
            )}
          </View>

          {/* QR */}
          <View style={styles.qrCard}>
            {qrImageBase64 ? (
                <Image
                    source={{ uri: `data:image/png;base64,${qrImageBase64}` }}
                    style={styles.qrImg}
                    resizeMode="contain"
                />
            ) : (
                <ActivityIndicator size="large" color="#2563EB" />
            )}
          </View>

          {/* What to do */}
          <View style={[styles.instrCard, isCash ? styles.instrCash : styles.instrOnline]}>
            <Text style={[styles.instrTitle, { color: headerColor }]}>What to do:</Text>

            {isCash && status === 'PENDING' && (
                <>
                  <Text style={styles.instrStep}>1. Go to the billing counter</Text>
                  <Text style={styles.instrStep}>2. Show this QR to counter staff</Text>
                  <Text style={styles.instrStep}>3. Staff scans → sees your latest cart</Text>
                  <Text style={styles.instrStep}>4. Pay cash or card at the counter</Text>
                  <Text style={styles.instrStep}>5. You'll get a printed bill — keep it</Text>
                  <Text style={styles.instrStep}>6. Show the bill/QR to security at exit</Text>
                </>
            )}

            {isCash && status === 'PAID' && (
                <>
                  <Text style={styles.instrStep}>1. Counter has confirmed your payment ✓</Text>
                  <Text style={styles.instrStep}>2. Take your printed bill to the exit gate</Text>
                  <Text style={styles.instrStep}>3. Show the QR / bill to security</Text>
                  <Text style={styles.instrStep}>4. Security verifies items and lets you out</Text>
                </>
            )}

            {!isCash && (
                <>
                  <Text style={styles.instrStep}>1. Payment confirmed ✓</Text>
                  <Text style={styles.instrStep}>2. Go to the exit gate</Text>
                  <Text style={styles.instrStep}>3. Show this QR to security staff</Text>
                  <Text style={styles.instrStep}>4. Staff scans → sees order id &amp; item list</Text>
                  <Text style={styles.instrStep}>5. Security verifies products and lets you out</Text>
                </>
            )}
          </View>

          {/* Timer */}
          <Text style={[styles.timer, timer < 60 && styles.timerRed]}>
            QR expires in {fmt(timer)}
          </Text>

          {/* Waiting */}
          <View style={styles.waitRow}>
            <ActivityIndicator size="small" color="#9CA3AF" />
            <Text style={styles.waitText}>
              {status === 'PENDING'
                  ? 'Waiting for counter confirmation...'
                  : 'Waiting for security verification at gate...'}
            </Text>
          </View>

        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
    alignItems: 'center', gap: 6,
  },
  headerBack: {
    position: 'absolute', left: 16, top: 48,
    width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
  },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  modeText: { fontSize: 12, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  body: { flex: 1, padding: 20, alignItems: 'center', gap: 14 },

  amtCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    alignItems: 'center', width: '100%',
    borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  amtLabel: { fontSize: 12, color: '#6B7280' },
  amtValue: { fontSize: 30, fontWeight: '800', color: '#111827', marginTop: 2 },
  paidTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, marginTop: 8,
  },
  paidTagText: { fontSize: 11, fontWeight: '800', color: '#059669' },

  qrCard: {
    width: 210, height: 210, backgroundColor: '#fff', borderRadius: 16,
    padding: 10, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  qrImg: { width: 190, height: 190 },

  instrCard: {
    width: '100%', borderRadius: 14, padding: 16, borderWidth: 1, gap: 4,
  },
  instrOnline: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  instrCash:   { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  instrTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  instrStep:  { fontSize: 12, color: '#374151', lineHeight: 20 },

  timer: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  timerRed: { color: '#EF4444' },

  waitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waitText: { fontSize: 12, color: '#9CA3AF' },

  // Success
  successWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10,
  },
  successIconBox: { marginBottom: 8 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#111827' },
  successSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  successAmt: { fontSize: 36, fontWeight: '800', color: '#059669', marginTop: 8 },
  homeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#2563EB', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14, marginTop: 16,
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});