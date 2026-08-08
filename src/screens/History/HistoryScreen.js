// ─────────────────────────────────────────────────────────────
//  HistoryScreen.js  –  Payment history list
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Alert, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { getPaymentHistory } from '../../services/api';

const fmt = (n) => `₹${Number(n).toFixed(2)}`;

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

function HistoryCard({ item }) {
  const isCash = item.paymentMethod === 'CASH';
  return (
    <View style={styles.card}>
      <View style={[styles.methodBadge, isCash ? styles.cashBadge : styles.onlineBadge]}>
        <Text style={styles.badgeText}>{isCash ? '💵 Cash' : '💳 Online'}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.storeName} numberOfLines={1}>{item.storeName}</Text>
          <Text style={styles.amount}>{fmt(item.totalAmount)}</Text>
        </View>
        <Text style={styles.brandDate}>{item.brandName} · {fmtDate(item.paidAt)}</Text>
        <View style={styles.footer}>
          <Text style={styles.items}>{item.itemCount} items</Text>
          <Text style={styles.billRef}>#{item.billRef}</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen({navigation}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (pg = 0, refresh = false) => {
    try {
      const res = await getPaymentHistory(pg, 20);
      const newItems = res.data || [];
      if (refresh || pg === 0) {
        setHistory(newItems);
      } else {
        setHistory(prev => [...prev, ...newItems]);
      }
      setHasMore(newItems.length === 20);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(0); }, [fetchHistory]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage);
  };
  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.navigate('StoreHomeScreen');
    }
  };

  if (loading && page === 0) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
      <View style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={18} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Purchase History</Text>
              <Text style={styles.headerSub}>{history.length} transactions</Text>
            </View>
          </View>
        </View>

      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyText}>
            Your completed purchases will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <HistoryCard item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setPage(0); fetchHistory(0, true); }}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={hasMore ? <ActivityIndicator color="#2563EB" style={{ marginVertical: 12 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },

  list: { padding: 16, gap: 10 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  methodBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  cashBadge: { backgroundColor: '#FFFBEB' },
  onlineBadge: { backgroundColor: '#EFF6FF' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  cardBody: { padding: 14, paddingTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  storeName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  amount: { fontSize: 16, fontWeight: '800', color: '#059669' },
  brandDate: { fontSize: 11, color: '#6B7280', marginBottom: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  items: { fontSize: 12, color: '#6B7280' },
  billRef: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },

  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
});
