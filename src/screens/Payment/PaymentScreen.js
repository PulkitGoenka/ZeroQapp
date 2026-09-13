import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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

      // Safe payload unwrap
      const payload = res?.data?.data !== undefined ? res.data.data : (res?.data !== undefined ? res.data : res);

      if (!payload) {
        throw new Error('No response from payment server.');
      }

      navigation.navigate('PaymentQr', {
        mode: 'cash',
        orderId: payload.orderId,
        counterQrToken: payload.counterQrToken || payload.qrToken || payload.orderId,
        qrToken: payload.qrToken,
        totalAmount: payload.totalAmount,
      });
    } catch (e) {
      console.log('Cash initiate error:', e?.response?.data || e.message);
      Alert.alert('Payment Notice', e?.response?.data?.message || e.message || 'Unable to initiate counter checkout.');
    } finally {
      setLoadingCash(false);
    }
  };

  return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={20} color={INK} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Select Payment Type</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {session?.storeName || 'Store Checkout'}
            </Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {/* Content Container */}
        <View style={styles.container}>
          <View style={styles.introBox}>
            <Text style={styles.promptTitle}>How would you like to pay?</Text>
            <Text style={styles.promptSub}>
              Pay digitally on your phone to exit immediately, or visit the cashier counter to pay by cash/card.
            </Text>
          </View>

          {/* Option A: Pay Online */}
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
                <View style={styles.recomPill}>
                  <Text style={styles.recomText}>FAST EXIT</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>UPI, Cards, Netbanking & Wallets</Text>
              <Text style={styles.bullet}>• Pay directly inside the app</Text>
              <Text style={styles.bullet}>• Generates instant gate exit pass</Text>
            </View>
            <Icon name="chevron-right" size={18} color={TEAL} />
          </TouchableOpacity>

          {/* Option B: Pay at Counter */}
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
              <Text style={styles.cardSub}>Cash or card swipe at billing desk</Text>
              <Text style={styles.bullet}>• Generates cashier transfer barcode</Text>
              <Text style={styles.bullet}>• Collect printed bill directly from cashier</Text>
            </View>
            {loadingCash ? (
                <ActivityIndicator size="small" color="#D97706" />
            ) : (
                <Icon name="chevron-right" size={18} color="#D97706" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: INK,
  },
  headerSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  introBox: {
    marginBottom: 6,
  },
  promptTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: INK,
  },
  promptSub: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
    marginTop: 4,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 18,
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
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  recomPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recomText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  cardSub: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 11,
    color: BODY,
    lineHeight: 16,
  },
});