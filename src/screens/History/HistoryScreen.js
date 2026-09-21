import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { getPaymentHistory } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const GOLD = '#F7B32B';
const GOLD_TEXT = '#412402';
const BG = '#F5FAFA';
const INK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';
const SUCCESS = '#059669';
const SUCCESS_SOFT = '#ECFDF5';

const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

const fmtDate = (iso) => {
  if (!iso) return 'Recent';
  const d = new Date(iso);
  return (
      d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
};

export default function HomeScreen({ navigation }) {
  const { } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await getPaymentHistory(0, 10);
      const list = res?.data?.content || res?.data || (Array.isArray(res) ? res : []);
      setHistory(list);
    } catch (e) {
      console.log('Transaction history error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    const unsub = navigation.addListener('focus', fetchTransactions);
    return unsub;
  }, [navigation, fetchTransactions]);

  const renderHeader = () => (
      <View style={styles.topContainer}>
        {/* Page Title */}
        <View style={styles.pageTitleRow}>
          <Text style={styles.pageTitle}>History</Text>
          <Text style={styles.sectionCount}>{history.length} Paid</Text>
        </View>
      </View>
  );

  return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />

        {loading ? (
            <View style={[styles.flex, styles.center]}>
              <ActivityIndicator size="large" color={TEAL} />
            </View>
        ) : (
            <FlatList
                data={history}
                keyExtractor={(item) => String(item.id || item.billRef || item.orderId)}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => {
                        setRefreshing(true);
                        fetchTransactions();
                      }}
                      colors={[TEAL]}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      <Icon name="file-text" size={32} color={TEAL} />
                    </View>
                    <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Completed store checkouts, invoices, and digital receipts will be archived here.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isOnline = (item.paymentMethod || '').toUpperCase() !== 'CASH';
                  return (
                      <TouchableOpacity
                          style={styles.billCard}
                          onPress={() => navigation.navigate('Receipt', { bill: item })}
                          activeOpacity={0.85}
                      >
                        <View style={styles.billCardHeader}>
                          <View style={styles.billMetaRow}>
                            <View style={[styles.methodBadge, isOnline ? styles.badgeOnline : styles.badgeCash]}>
                              <Icon
                                  name={isOnline ? 'credit-card' : 'dollar-sign'}
                                  size={12}
                                  color={isOnline ? '#2563EB' : '#D97706'}
                              />
                              <Text style={[styles.methodText, { color: isOnline ? '#2563EB' : '#D97706' }]}>
                                {isOnline ? 'Online Payment' : 'Cash Counter'}
                              </Text>
                            </View>
                            <Text style={styles.billDate}>{fmtDate(item.paidAt || item.createdAt)}</Text>
                          </View>
                          <View style={styles.statusSuccessPill}>
                            <Icon name="check" size={11} color={SUCCESS} />
                            <Text style={styles.statusSuccessText}>PAID</Text>
                          </View>
                        </View>

                        <View style={styles.billCardBody}>
                          <Text style={styles.storeTitle} numberOfLines={1}>
                            {item.storeName || 'Supermarket Branch'}
                          </Text>
                          <Text style={styles.amountText}>{fmt(item.totalAmount)}</Text>
                        </View>

                        <View style={styles.billCardFooter}>
                          <Text style={styles.footerDetails}>
                            {item.itemCount || (item.items ? item.items.length : 1)} Items · Ref #{String(item.billRef || item.orderId || '').slice(-8)}
                          </Text>
                          <View style={styles.viewReceiptLink}>
                            <Text style={styles.viewReceiptText}>View Bill</Text>
                            <Icon name="chevron-right" size={14} color={TEAL} />
                          </View>
                        </View>
                      </TouchableOpacity>
                  );
                }}
            />
        )}
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 28 },
  topContainer: { paddingTop: 16, paddingBottom: 6 },

  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, letterSpacing: -1.1, color: INK },

  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeSessionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: SUCCESS,
    shadowColor: SUCCESS,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  activeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTag: {
    backgroundColor: SUCCESS_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeTagText: { fontSize: 10, fontWeight: '800', color: SUCCESS, letterSpacing: 0.5 },
  cartIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: SUCCESS_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStoreName: { fontSize: 16, fontWeight: '800', color: INK },
  activeStoreSub: { fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 17 },
  activeActionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  resumeBtn: {
    flex: 1,
    backgroundColor: SUCCESS,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resumeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  scanQuickBtn: {
    width: 46,
    height: 44,
    borderRadius: 12,
    backgroundColor: TEAL_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  newStoreCard: {
    backgroundColor: TEAL,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  newStoreTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  newStoreSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  findStoreBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  findStoreText: { color: GOLD_TEXT, fontSize: 12, fontWeight: '800' },

  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionPill: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionPillText: { fontSize: 12, fontWeight: '700', color: INK },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: INK },
  sectionCount: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: MUTED },

  billCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  billCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeOnline: { backgroundColor: '#EFF6FF' },
  badgeCash: { backgroundColor: '#FEF3C7' },
  methodText: { fontSize: 11, fontWeight: '700' },
  billDate: { fontSize: 11, color: MUTED },
  statusSuccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: SUCCESS_SOFT,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusSuccessText: { fontSize: 10, fontWeight: '800', color: SUCCESS },

  billCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 15, letterSpacing: -0.4, color: INK, flex: 1, marginRight: 8 },
  amountText: { fontFamily: 'Manrope_700Bold', fontSize: 17, letterSpacing: -0.6, color: INK },

  billCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerDetails: { fontSize: 11, color: MUTED, fontWeight: '500' },
  viewReceiptLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewReceiptText: { fontSize: 12, fontWeight: '700', color: TEAL },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: TEAL_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: INK, marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});