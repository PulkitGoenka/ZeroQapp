import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { endSession, getCart } from '../../services/api';

export default function StoreHomeScreen({ navigation }) {
    const { user, session, clearSession } = useAuth();
    const [cart, setCart]     = useState(null);
    const [loading, setLoading] = useState(true);

    const loadCart = useCallback(async () => {
        try { const r = await getCart(); setCart(r.data); }
        catch { setCart(null); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        loadCart();
        const unsub = navigation.addListener('focus', loadCart);
        return unsub;
    }, [navigation, loadCart]);

    const handleExit = () => {
        Alert.alert('End Session', `Leave ${session?.storeName}? Cart will be cleared.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'End Session', style: 'destructive', onPress: async () => {
                    try { await endSession(); } catch {}
                    await clearSession();
                    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                }},
        ]);
    };

    const count = cart?.itemCount || 0;
    const total = cart?.totalAmount || 0;

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Icon name="arrow-left" size={18} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.storeName} numberOfLines={1}>{session?.storeName || 'Store'}</Text>
                        <View style={styles.activeRow}>
                            <View style={styles.dot} />
                            <Text style={styles.activeText}>Session active</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleExit} style={styles.exitBtn}>
                        <Icon name="log-out" size={14} color="#FCA5A5" />
                        <Text style={styles.exitText}>Exit</Text>
                    </TouchableOpacity>
                </View>
                {/* User row */}
                <View style={styles.userRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                    </View>
                    <Text style={styles.userName}>Hi, {user?.name?.split(' ')[0] || 'Shopper'} 👋</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Scan — primary action */}
                <TouchableOpacity style={styles.scanCard} onPress={() => navigation.navigate('Scanner')} activeOpacity={0.85}>
                    <View style={styles.scanIcon}>
                        <Icon name="camera" size={34} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.scanTitle}>Scan Product</Text>
                        <Text style={styles.scanSub}>Point camera at barcode to add to cart</Text>
                    </View>
                    <View style={styles.scanArrow}>
                        <Icon name="chevron-right" size={20} color="#2563EB" />
                    </View>
                </TouchableOpacity>

                {/* Cart + Pay */}
                <View style={styles.row}>
                    <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#ECFDF5' }]}
                                      onPress={() => navigation.navigate('Cart')} activeOpacity={0.8}>
                        <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Icon name="shopping-cart" size={22} color="#059669" />
                            {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>}
                        </View>
                        <Text style={[styles.actionTitle, { color: '#059669' }]}>My Cart</Text>
                        <Text style={styles.actionSub}>{loading ? '...' : count > 0 ? `${count} items` : 'Empty'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#F5F3FF' }]}
                                      onPress={() => {
                                          if (count === 0) { Alert.alert('Cart empty', 'Scan products first.'); return; }
                                          navigation.navigate('Payment');
                                      }} activeOpacity={0.8}>
                        <View style={[styles.actionIcon, { backgroundColor: '#EDE9FE' }]}>
                            <Icon name="credit-card" size={22} color="#7C3AED" />
                        </View>
                        <Text style={[styles.actionTitle, { color: '#7C3AED' }]}>Pay Now</Text>
                        <Text style={styles.actionSub}>{count > 0 ? `₹${total}` : 'Add items first'}</Text>
                    </TouchableOpacity>
                </View>

                {/* History */}
                <TouchableOpacity style={styles.histRow} onPress={() => navigation.navigate('History')}>
                    <Icon name="clock" size={15} color="#6B7280" />
                    <Text style={styles.histText}>View past orders</Text>
                    <Icon name="chevron-right" size={15} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>How to shop</Text>
                    {[
                        { icon: 'camera',        text: 'Tap "Scan Product" and point at barcode' },
                        { icon: 'shopping-cart', text: 'Items appear in cart automatically' },
                        { icon: 'plus-circle',   text: 'Scan again to increase quantity' },
                        { icon: 'credit-card',   text: 'Tap "Pay Now" when done shopping' },
                    ].map(({ icon, text }, i) => (
                        <View key={i} style={styles.tipRow}>
                            <View style={styles.tipIcon}><Icon name={icon} size={16} color="#2563EB" /></View>
                            <Text style={styles.tipText}>{text}</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { backgroundColor: '#1E40AF', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    headerBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerInfo: { flex: 1 },
    storeName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    activeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
    activeText: { fontSize: 11, color: '#93C5FD' },
    exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    exitText: { fontSize: 12, color: '#FCA5A5', fontWeight: '700' },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10 },
    avatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    userName: { color: '#fff', fontSize: 14, fontWeight: '600' },
    scroll: { padding: 16, paddingBottom: 40, gap: 12 },
    scanCard: {
        backgroundColor: '#EFF6FF', borderRadius: 16, padding: 18,
        flexDirection: 'row', alignItems: 'center', gap: 14,
        borderWidth: 1.5, borderColor: '#BFDBFE',
    },
    scanIcon: { width: 62, height: 62, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
    scanTitle: { fontSize: 17, fontWeight: '700', color: '#1E3A8A' },
    scanSub: { fontSize: 12, color: '#6B7280', marginTop: 3 },
    scanArrow: {},
    row: { flexDirection: 'row', gap: 12 },
    actionCard: { flex: 1, borderRadius: 14, padding: 14, gap: 6 },
    actionIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    badge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    actionTitle: { fontSize: 14, fontWeight: '700' },
    actionSub: { fontSize: 11, color: '#9CA3AF' },
    histRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 0.5, borderColor: '#E5E7EB' },
    histText: { flex: 1, fontSize: 13, color: '#6B7280' },
    tipsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#E5E7EB', gap: 12 },
    tipsTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tipIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
    tipText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 18 },
});