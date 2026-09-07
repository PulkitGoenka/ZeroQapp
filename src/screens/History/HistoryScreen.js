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
import { getPaymentHistory } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
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

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (pg = 0, refresh = false) => {
    try {
      const res = await getPaymentHistory(pg, 20);
      const newItems = res?.data || [];
      if (refresh || pg === 0) {
        setHistory(newItems);
      } else {
        setHistory((prev) => [...prev, ...newItems]);
      }
      setHasMore(newItems.length === 20);
    } catch (e) {
      console.log('Payment history error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(0);
  }, [fetchHistory]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage);
  };

  if (loading && page === 0) {
    return (
        <View style={[styles.flex, styles.center]}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
    );
  }

  return (
      <View style={styles.flex}>
        <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={18} color={INK} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Order & Payment History</Text>
            <Text style={styles.headerSub}>{history.length} purchases recorded</Text>
          </View>
        </View>

        {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="file-text" size={32} color={TEAL} />
              </View>
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptySubtitle}>
                Completed in-store orders and payment invoices will appear here.
              </Text>
            </View>
        ) : (
            <FlatList
                data={history}
                keyExtractor={(item) => String(item.id || item.billRef)}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => {
                        setRefreshing(true);
                        setPage(0);
                        fetchHistory(0, true);
                      }}
                      colors={[TEAL]}
                  />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  hasMore ? <ActivityIndicator color={TEAL} style={{ marginVertical: 14 }} /> : null
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
                                {isOnline ? 'Online Payment' : 'Cash Desk'}
                              </Text>
                            </View>
                            <Text style={styles.billDate}>{fmtDate(item.paidAt)}</Text>
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
                            {item.itemCount || (item.items ? item.items.length : 1)} Items · Ref #{item.billRef}
                          </Text>
                          <View style={styles.viewReceiptLink}>
                            <Text style={styles.viewReceiptText}>View Receipt</Text>
                            <Icon name="chevron-right" size={14} color={TEAL} />
                          </View>
                        </View>
                      </TouchableOpacity>
                  );
                }}
            />
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: INK },
  headerSub: { fontSize: 12, color: MUTED, marginTop: 1 },

  listContent: { padding: 18, gap: 12 },
  billCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
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
  storeTitle: { fontSize: 15, fontWeight: '700', color: INK, flex: 1, marginRight: 8 },
  amountText: { fontSize: 17, fontWeight: '800', color: INK },

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: TEAL_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: INK, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
});