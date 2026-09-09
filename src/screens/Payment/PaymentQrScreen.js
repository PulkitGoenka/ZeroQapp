import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import Barcode from 'react-native-barcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { getPaymentStatus, endSession } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const GOLD = '#F7B32B';
const BG = '#F5FAFA';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';
const SUCCESS = '#059669';
const SUCCESS_SOFT = '#ECFDF5';

const POLL_INTERVAL = 2000;

export default function PaymentQrScreen({ navigation, route }) {
  const { orderId, totalAmount } = route.params || {};
  const { clearSession } = useAuth();
  const [status, setStatus] = useState('PENDING');
  const pollRef = useRef(null);

  // Complete & Clean Session on Payment Confirmation
  const finalizeSessionAndExit = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      await endSession(); // Mark session INACTIVE/COMPLETED in PostgreSQL & flush Redis Cart
    } catch (e) {
      console.log('Session end trigger note:', e.message);
    } finally {
      await clearSession();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [clearSession, navigation]);

  // Back Button Handling
  useEffect(() => {
    const onBack = () => {
      if (status === 'PAID' || status === 'VERIFIED') {
        finalizeSessionAndExit();
        return true;
      }
      navigation.goBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [status, navigation, finalizeSessionAndExit]);

  // Status Polling from Cashier POS
  useEffect(() => {
    if (!orderId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await getPaymentStatus(orderId);
        const current = res.data?.status || res?.status;

        if (current && current !== status) {
          setStatus(current);
        }

        // Cashier confirmed payment
        if (current === 'PAID' || current === 'VERIFIED' || current === 'COMPLETED') {
          clearInterval(pollRef.current);
        }
      } catch (e) {
        console.log('Status polling error:', e.message);
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, status]);

  // ── Success State: Cashier Confirmed & Added to Bill History ──────────────
  if (status === 'PAID' || status === 'VERIFIED' || status === 'COMPLETED') {
    return (
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <StatusBar barStyle="dark-content" backgroundColor={BG} />
          <View style={styles.centerBox}>
            <View style={styles.successCircle}>
              <Icon name="check" size={38} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Payment Verified!</Text>
            <Text style={styles.successSub}>
              Cashier has collected the amount. Session has been closed and invoice is saved to your order history.
            </Text>

            <View style={styles.receiptBox}>
              <Text style={styles.receiptLabel}>Total Paid</Text>
              <Text style={styles.amountDisplay}>₹{totalAmount || 0}</Text>
              <Text style={styles.receiptId}>Order Ref: {orderId}</Text>
            </View>

            <TouchableOpacity
                style={styles.homeBtn}
                onPress={finalizeSessionAndExit}
                activeOpacity={0.85}
            >
              <Icon name="home" size={17} color="#412402" />
              <Text style={styles.homeBtnText}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  // ── Waiting State: Show Barcode for Cashier Handheld / POS Scanner ───────
  const barcodeValue = String(orderId || 'ORDER-PENDING');

  return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

        <View style={styles.header}>
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={20} color={INK} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Counter Checkout Barcode</Text>
            <Text style={styles.headerSub}>Present this tag to cashier</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount Due at Counter</Text>
            <Text style={styles.amountVal}>₹{totalAmount || 0}</Text>
          </View>

          {/* Barcode View */}
          <View style={styles.barcodeCard}>
            <Text style={styles.barcodeHeader}>CASHIER SCAN TAG</Text>
            <View style={styles.barcodeWrapper}>
              <Barcode
                  value={barcodeValue}
                  format="CODE128"
                  singleBarWidth={2}
                  height={85}
                  lineColor={INK}
                  backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.barcodeString}>{barcodeValue}</Text>
          </View>

          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>Checkout Instructions</Text>
            <Text style={styles.guideStep}>1. Show this barcode to cashier for instant gun scanner read.</Text>
            <Text style={styles.guideStep}>2. Pay via Cash, Card, or UPI directly at the counter.</Text>
            <Text style={styles.guideStep}>3. As soon as cashier submits, this screen will verify automatically.</Text>
          </View>

          <View style={styles.waitingBadge}>
            <ActivityIndicator size="small" color={TEAL} />
            <Text style={styles.waitingText}>Awaiting cashier counter scan & approval...</Text>
          </View>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
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

  content: { padding: 20, alignItems: 'center', gap: 16 },
  amountBox: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  amountLabel: { fontSize: 12, color: MUTED, fontWeight: '500' },
  amountVal: { fontSize: 26, fontWeight: '800', color: INK, marginTop: 2 },

  barcodeCard: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  barcodeHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  barcodeWrapper: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  barcodeString: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: INK,
    marginTop: 10,
  },

  guideCard: {
    backgroundColor: TEAL_SOFT,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#B6DCDC',
    gap: 4,
  },
  guideTitle: { fontSize: 13, fontWeight: '800', color: TEAL, marginBottom: 4 },
  guideStep: { fontSize: 12, color: BODY, lineHeight: 18 },

  waitingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  waitingText: { fontSize: 12, color: MUTED, fontWeight: '600' },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: SUCCESS,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: INK, marginBottom: 6 },
  successSub: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  receiptBox: {
    backgroundColor: SUCCESS_SOFT,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  receiptLabel: { fontSize: 12, fontWeight: '600', color: SUCCESS },
  amountDisplay: { fontSize: 32, fontWeight: '800', color: SUCCESS, marginVertical: 4 },
  receiptId: { fontSize: 11, color: MUTED, fontWeight: '600' },

  homeBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  homeBtnText: { color: '#412402', fontSize: 14, fontWeight: '800' },
});