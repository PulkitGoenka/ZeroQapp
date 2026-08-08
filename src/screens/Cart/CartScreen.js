import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { getCart, updateQuantity, removeItem, endSession } from '../../services/api';

export default function CartScreen({ navigation }) {
  const { session, clearSession } = useAuth();
  const [cart, setCart]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    try { const r = await getCart(); setCart(r.data); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const handleQty = async (barcode, qty) => {
    setUpdating(barcode);
    try {
      qty === 0 ? await removeItem(barcode) : await updateQuantity(barcode, qty);
      await load();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setUpdating(null); }
  };

  const handleEnd = () => Alert.alert('End session', 'Clear cart and end session?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'End', style: 'destructive', onPress: async () => {
        try { await endSession(); } catch {}
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }},
  ]);

  if (!session) return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}><Icon name="shopping-cart" size={36} color="#9CA3AF" /></View>
        <Text style={styles.emptyTitle}>No active session</Text>
        <Text style={styles.emptySub}>Select a brand and store to start shopping.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('BrandSelect')}>
          <Icon name="tag" size={14} color="#fff" />
          <Text style={styles.emptyBtnText}>Select Brand</Text>
        </TouchableOpacity>
      </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  const items = cart?.items || [];

  return (
      <View style={styles.flex}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Cart</Text>
            <Text style={styles.headerSub}>{session.storeName}</Text>
          </View>
          <TouchableOpacity onPress={handleEnd} style={styles.endBtn}>
            <Icon name="x" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Icon name="shopping-cart" size={36} color="#9CA3AF" /></View>
              <Text style={styles.emptyTitle}>Cart is empty</Text>
              <Text style={styles.emptySub}>Scan products to add them here.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Scanner')}>
                <Icon name="camera" size={14} color="#fff" />
                <Text style={styles.emptyBtnText}>Scan Products</Text>
              </TouchableOpacity>
            </View>
        ) : (
            <>
              <FlatList
                  data={items}
                  keyExtractor={i => i.barcode}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                      <View style={styles.item}>
                        <View style={styles.itemImg}><Icon name="package" size={20} color="#9CA3AF" /></View>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                          <View style={styles.priceRow}>
                            <Text style={styles.itemPrice}>₹{item.discountPrice}</Text>
                            {item.mrp && item.mrp !== item.discountPrice &&
                                <Text style={styles.itemMrp}>₹{item.mrp}</Text>}
                          </View>
                        </View>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity style={styles.qtyBtn}
                                            onPress={() => handleQty(item.barcode, item.quantity - 1)}
                                            disabled={updating === item.barcode}>
                            <Icon name={item.quantity === 1 ? 'trash-2' : 'minus'} size={14}
                                  color={item.quantity === 1 ? '#EF4444' : '#374151'} />
                          </TouchableOpacity>
                          {updating === item.barcode
                              ? <ActivityIndicator size="small" color="#2563EB" style={{ width: 28 }} />
                              : <Text style={styles.qtyNum}>{item.quantity}</Text>}
                          <TouchableOpacity style={styles.qtyBtn}
                                            onPress={() => handleQty(item.barcode, item.quantity + 1)}
                                            disabled={updating === item.barcode}>
                            <Icon name="plus" size={14} color="#374151" />
                          </TouchableOpacity>
                        </View>
                      </View>
                  )}
              />

              <View style={styles.footer}>
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmt}>₹{cart?.totalAmount || 0}</Text>
                  </View>
                  {cart?.totalDiscount > 0 &&
                      <View style={styles.saveBadge}><Text style={styles.saveText}>Save ₹{cart.totalDiscount}</Text></View>}
                </View>
                <TouchableOpacity style={styles.scanMore} onPress={() => navigation.navigate('Scanner')}>
                  <Icon name="camera" size={14} color="#2563EB" />
                  <Text style={styles.scanMoreText}>Scan more products</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.payBtn} onPress={() => navigation.navigate('Payment')}>
                  <Icon name="credit-card" size={18} color="#fff" />
                  <Text style={styles.payBtnText}>Proceed to Pay</Text>
                </TouchableOpacity>
              </View>
            </>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  endBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  item: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  itemImg: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#059669' },
  itemMrp: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#E5E7EB' },
  qtyNum: { fontSize: 15, fontWeight: '700', color: '#111827', minWidth: 20, textAlign: 'center' },
  footer: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#E5E7EB', padding: 16, gap: 10 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 12, color: '#6B7280' },
  totalAmt: { fontSize: 24, fontWeight: '800', color: '#111827' },
  saveBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  saveText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  scanMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  scanMoreText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  payBtn: { backgroundColor: '#2563EB', borderRadius: 14, height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});