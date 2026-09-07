import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { getPaymentStatus } from '../../services/api';

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

const POLL_INTERVAL = 2500;

export default function PaymentQrScreen({ navigation, route }) {
  const { orderId, qrImageBase64, totalAmount } = route.params;
  const { clearSession } = useAuth();
  const [status, setStatus] = useState('PENDING');
  const pollRef = useRef(null);

  useEffect(() => {
    const onBack = () => {
      if (status !== 'PAID' && status !== 'VERIFIED') {
        navigation.goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [status, navigation]);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await getPaymentStatus(orderId);
        const current = res.data?.status;
        if (current && current !== status) {
          setStatus(current);
        }
        if (current === 'PAID' || current === 'VERIFIED') {
          clearInterval(pollRef.current);
        }
      } catch (e) {}
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [orderId, status]);

  const handleReturnHome = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  // State: Paid/Verified at Counter
  if (status === 'PAID' || status === 'VERIFIED') {
    return (
        <View style={styles.flex}>
          <StatusBar barStyle="dark-content" backgroundColor={BG} />
          <View style={styles.centerBox}>
            <View style={styles.successCircle}>
              <Icon name="check" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Payment Verified</Text>
            <Text style={styles.successSub}>
              Cashier has registered your payment. Please collect your printed receipt.
            </Text>
            <Text style={styles.amountDisplay}>₹{totalAmount}</Text>
            <TouchableOpacity style={styles.homeBtn} onPress={handleReturnHome} activeOpacity={0.85}>
              <Icon name="home" size={16} color="#412402" />
              <Text style={styles.homeBtnText}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
    );
  }

  // State: Waiting for Cashier Scan
  return (
      <View style={styles.flex}>
        <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="arrow-left" size={20} color={INK} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Counter Billing Code</Text>
            <Text style={styles.headerSub}>Order #{orderId}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount Due at Counter</Text>
            <Text style={styles.amountVal}>₹{totalAmount}</Text>
          </View>

          <View style={styles.qrCard}>
            {qrImageBase64 ? (
                <Image
                    source={{ uri: `data:image/png;base64,${qrImageBase64}` }}
                    style={styles.qrImg}
                    resizeMode="contain"
                />
            ) : (
                <ActivityIndicator size="large" color={TEAL} />
            )}
          </View>

          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>Counter Instructions</Text>
            <Text style={styles.guideStep}>1. Present this QR code to the cashier at checkout.</Text>
            <Text style={styles.guideStep}>2. The cashier will sync your cart and collect cash/card.</Text>
            <Text style={styles.guideStep}>3. You can still return to your cart if you need to add items.</Text>
          </View>

          <View style={styles.waitingBadge}>
            <ActivityIndicator size="small" color={TEAL} />
            <Text style={styles.waitingText}>Awaiting cashier scan & approval...</Text>
          </View>
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
  amountLabel: { fontSize: 12, color: MUTED },
  amountVal: { fontSize: 26, fontWeight: '800', color: INK, marginTop: 2 },

  qrCard: {
    width: 220,
    height: 220,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 2,
  },
  qrImg: { width: '100%', height: '100%' },

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

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: SUCCESS, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: '800', color: INK, marginBottom: 6 },
  successSub: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  amountDisplay: { fontSize: 30, fontWeight: '800', color: SUCCESS, marginBottom: 24 },
  homeBtn: { backgroundColor: GOLD, paddingHorizontal: 26, paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  homeBtnText: { color: '#412402', fontSize: 14, fontWeight: '800' },
});