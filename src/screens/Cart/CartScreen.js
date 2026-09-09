import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { getCart, updateQuantity, removeItem, endSession } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const TEAL_SHADOW = '#36696D';
const GOLD = '#F7B32B';
const BG = '#F5FAFA';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';
const DANGER = '#EF4444';
const DANGER_SOFT = '#FEF2F2';
const SUCCESS = '#059669';
const SUCCESS_SOFT = '#ECFDF5';

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { session, clearSession } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingBarcode, setUpdatingBarcode] = useState(null);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const loadCartData = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      const res = await getCart();
      setCart(res?.data || null);
    } catch (e) {
      console.log('Cart fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadCartData();
    const unsubscribe = navigation.addListener('focus', loadCartData);
    return unsubscribe;
  }, [navigation, loadCartData]);

  const handleUpdateQuantity = async (barcode, qty) => {
    setUpdatingBarcode(barcode);
    try {
      if (qty <= 0) {
        await removeItem(barcode);
      } else {
        await updateQuantity(barcode, qty);
      }
      await loadCartData();
    } catch (e) {
      console.log('Qty update error:', e.message);
    } finally {
      setUpdatingBarcode(null);
    }
  };

  const handleConfirmEndSession = async () => {
    try {
      await endSession();
    } catch {}
    await clearSession();
    setExitModalVisible(false);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  // State A: User is not checked into any store
  if (!session) {
    return (
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <StatusBar barStyle="dark-content" backgroundColor={BG} />
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBadge}>
              <Icon name="shopping-bag" size={36} color={TEAL} />
            </View>
            <Text style={styles.emptyTitle}>No Active Store Session</Text>
            <Text style={styles.emptySubtitle}>
              Please select a brand and locate a store to begin adding items to your cart.
            </Text>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('StoreDiscovery')}
                activeOpacity={0.85}
            >
              <Icon name="tag" size={16} color="#412402" />
              <Text style={styles.actionButtonText}>Select Brand & Store</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  if (loading) {
    return (
        <SafeAreaView style={[styles.flex, styles.center]} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color={TEAL} />
        </SafeAreaView>
    );
  }

  const items = cart?.items || [];
  const totalAmount = cart?.totalAmount || 0;
  const totalDiscount = cart?.totalDiscount || 0;

  return (
      <SafeAreaView style={styles.flex} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={20} color={INK} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Active Cart</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{session.storeName}</Text>
          </View>
          <TouchableOpacity
              onPress={() => setExitModalVisible(true)}
              style={styles.headerExitBtn}
              activeOpacity={0.7}
          >
            <Icon name="log-out" size={16} color={DANGER} />
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Icon name="shopping-cart" size={36} color={TEAL} />
              </View>
              <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Scan barcodes directly off supermarket shelves to populate your digital cart.
              </Text>
              <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Scanner')}
                  activeOpacity={0.85}
              >
                <Icon name="camera" size={16} color="#412402" />
                <Text style={styles.actionButtonText}>Scan Items</Text>
              </TouchableOpacity>
            </View>
        ) : (
            <>
              <FlatList
                  data={items}
                  keyExtractor={(i) => i.barcode}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isUpdating = updatingBarcode === item.barcode;
                    return (
                        <View style={styles.itemCard}>
                          <View style={styles.itemThumb}>
                            <Icon name="package" size={22} color={TEAL} />
                          </View>
                          <View style={styles.itemDetails}>
                            <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                            <View style={styles.priceRow}>
                              <Text style={styles.itemPrice}>₹{item.discountPrice}</Text>
                              {item.mrp && item.mrp !== item.discountPrice && (
                                  <Text style={styles.itemMrp}>₹{item.mrp}</Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.qtyControl}>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => handleUpdateQuantity(item.barcode, item.quantity - 1)}
                                disabled={isUpdating}
                            >
                              <Icon
                                  name={item.quantity === 1 ? 'trash-2' : 'minus'}
                                  size={13}
                                  color={item.quantity === 1 ? DANGER : BODY}
                              />
                            </TouchableOpacity>
                            {isUpdating ? (
                                <ActivityIndicator size="small" color={TEAL} style={{ width: 24 }} />
                            ) : (
                                <Text style={styles.qtyNumber}>{item.quantity}</Text>
                            )}
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => handleUpdateQuantity(item.barcode, item.quantity + 1)}
                                disabled={isUpdating}
                            >
                              <Icon name="plus" size={13} color={BODY} />
                            </TouchableOpacity>
                          </View>
                        </View>
                    );
                  }}
              />

              {/* Checkout Footer: Dynamic Bottom Padding to Prevent Gesture Bar Overlap */}
              <View style={[
                styles.footerContainer,
                { paddingBottom: Math.max(insets.bottom, 16) + 6 }
              ]}>
                <View style={styles.billingRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{totalAmount}</Text>
                  </View>
                  {totalDiscount > 0 && (
                      <View style={styles.savingsPill}>
                        <Icon name="trending-down" size={12} color={SUCCESS} style={{ marginRight: 4 }} />
                        <Text style={styles.savingsText}>Save ₹{totalDiscount}</Text>
                      </View>
                  )}
                </View>

                <TouchableOpacity
                    style={styles.scanMoreLink}
                    onPress={() => navigation.navigate('Scanner')}
                    activeOpacity={0.7}
                >
                  <Icon name="camera" size={15} color={TEAL} />
                  <Text style={styles.scanMoreText}>Scan More Items</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={() => navigation.navigate('Payment')}
                    activeOpacity={0.85}
                >
                  <Icon name="credit-card" size={17} color="#FFFFFF" />
                  <Text style={styles.proceedButtonText}>Proceed to Checkout</Text>
                </TouchableOpacity>
              </View>
            </>
        )}

        {/* End Session Confirmation Modal */}
        <Modal
            visible={exitModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setExitModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconBox}>
                <Icon name="log-out" size={24} color={DANGER} />
              </View>
              <Text style={styles.modalTitle}>End Session & Clear Cart?</Text>
              <Text style={styles.modalText}>
                All unpurchased items in this cart will be deleted upon exiting.
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    onPress={() => setExitModalVisible(false)}
                >
                  <Text style={styles.modalSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.modalDangerBtn}
                    onPress={handleConfirmEndSession}
                >
                  <Text style={styles.modalDangerText}>End Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: INK },
  headerSub: { fontSize: 12, color: MUTED, marginTop: 1 },
  headerExitBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DANGER_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: { padding: 20, gap: 12 },
  itemCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: TEAL_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 13, fontWeight: '700', color: INK, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: SUCCESS },
  itemMrp: { fontSize: 12, color: MUTED, textDecorationLine: 'line-through' },

  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 3,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: INK,
    minWidth: 24,
    textAlign: 'center',
  },

  footerContainer: {
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 12, color: MUTED, fontWeight: '500' },
  totalValue: { fontSize: 22, fontWeight: '800', color: INK, marginTop: 2 },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SUCCESS_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: { fontSize: 12, fontWeight: '700', color: SUCCESS },

  scanMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: TEAL_SOFT,
    borderRadius: 12,
    paddingVertical: 11,
  },
  scanMoreText: { fontSize: 13, fontWeight: '700', color: TEAL },

  proceedButton: {
    backgroundColor: TEAL,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: TEAL_SHADOW,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  proceedButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: TEAL_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: INK, marginBottom: 6 },
  emptySubtitle: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: { color: '#412402', fontSize: 14, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: DANGER_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: INK, marginBottom: 6 },
  modalText: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButtonRow: { flexDirection: 'row', gap: 10, width: '100%' },
  modalSecondaryBtn: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryText: { fontSize: 13, fontWeight: '600', color: BODY },
  modalDangerBtn: {
    flex: 1,
    backgroundColor: DANGER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDangerText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});