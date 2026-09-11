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
    Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { getScanHistory, scanBarcode } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const GOLD = '#F7B32B';
const BG = '#F5FAFA';
const INK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';
const SUCCESS = '#059669';

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export default function ScanHistoryScreen({ navigation }) {
    const { session } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [addingBarcode, setAddingBarcode] = useState(null);

    const fetchScanLog = useCallback(async () => {
        if (!session) {
            setItems([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const res = await getScanHistory();

            // Backend ApiResponse wrapper handle karein (res.data.data ya res.data)
            const raw = res?.data?.data !== undefined ? res?.data?.data : (res?.data !== undefined ? res?.data : res);
            const list = Array.isArray(raw) ? raw : [];

            // Unique items filter karein
            const uniqueMap = new Map();
            list.forEach(item => {
                if (item?.barcode && !uniqueMap.has(item.barcode)) {
                    uniqueMap.set(item.barcode, item);
                }
            });

            // ✅ YEH LINE MISSING THI:
            setItems(Array.from(uniqueMap.values()));
        } catch (e) {
            console.log('Scan history error:', e.message);
            setItems([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session]);

    useEffect(() => {
        fetchScanLog();
        const unsub = navigation.addListener('focus', fetchScanLog);
        return unsub;
    }, [navigation, fetchScanLog]);

    const handleReAddToCart = async (barcode) => {
        setAddingBarcode(barcode);
        try {
            await scanBarcode(barcode);
            Alert.alert('Success', 'Item added back to your cart!');
        } catch (e) {
            Alert.alert('Notice', e.message || 'Unable to add item to cart.');
        } finally {
            setAddingBarcode(null);
        }
    };

    // State 1: Inactive / No Session Running
    if (!session) {
        return (
            <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                        <Icon name="arrow-left" size={18} color={INK} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.headerTitle}>Scan History</Text>
                        <Text style={styles.headerSub}>Session-bound log</Text>
                    </View>
                </View>

                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Icon name="clock" size={32} color={MUTED} />
                    </View>
                    <Text style={styles.emptyTitle}>No Active Session</Text>
                    <Text style={styles.emptySubtitle}>
                        Scan logs are cleared when a session ends. Start a session at any store to begin scanning shelf tags.
                    </Text>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('StoreDiscovery')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.actionBtnText}>Select Store</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // State 2: Loading
    if (loading) {
        return (
            <SafeAreaView style={[styles.flex, styles.center]} edges={['top', 'bottom']}>
                <ActivityIndicator size="large" color={TEAL} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Icon name="arrow-left" size={18} color={INK} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.headerTitle}>Scan History</Text>
                    <Text style={styles.headerSub}>{session?.storeName || 'Current Store'} · {items.length} items logged</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Cart')}
                    style={styles.cartIconBtn}
                    activeOpacity={0.7}
                >
                    <Icon name="shopping-cart" size={18} color={TEAL} />
                </TouchableOpacity>
            </View>

            {items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Icon name="maximize" size={32} color={TEAL} />
                    </View>
                    <Text style={styles.emptyTitle}>No Scans Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Items scanned in this store session will appear here so you can re-add them even if removed from cart.
                    </Text>
                    <TouchableOpacity
                        style={styles.actionBtnGold}
                        onPress={() => navigation.navigate('Scanner')}
                        activeOpacity={0.85}
                    >
                        <Icon name="camera" size={16} color="#412402" />
                        <Text style={styles.actionBtnGoldText}>Open Scanner</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => `${item.barcode}-${index}`}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchScanLog();
                            }}
                            colors={[TEAL]}
                        />
                    }
                    renderItem={({ item }) => {
                        const isAdding = addingBarcode === item.barcode;
                        return (
                            <View style={styles.itemCard}>
                                <View style={styles.itemIcon}>
                                    <Icon name="package" size={20} color={TEAL} />
                                </View>

                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName} numberOfLines={1}>
                                        {item.productName || 'Product'}
                                    </Text>
                                    <Text style={styles.itemBarcode}>Barcode: {item.barcode}</Text>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.itemPrice}>₹{item.discountPrice}</Text>
                                        {item.scannedAt && (
                                            <Text style={styles.scannedTime}>Scanned at {fmtDate(item.scannedAt)}</Text>
                                        )}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.addBtn, isAdding && { opacity: 0.6 }]}
                                    onPress={() => handleReAddToCart(item.barcode)}
                                    disabled={isAdding}
                                    activeOpacity={0.8}
                                >
                                    {isAdding ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Icon name="plus" size={14} color="#FFFFFF" />
                                            <Text style={styles.addBtnText}>Add</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
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

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
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
    cartIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: TEAL_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: INK },
    headerSub: { fontSize: 12, color: MUTED, marginTop: 1 },

    listContent: { padding: 16, gap: 10 },
    itemCard: {
        backgroundColor: CARD_BG,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER,
        gap: 12,
    },
    itemIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: TEAL_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemDetails: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '700', color: INK },
    itemBarcode: { fontSize: 11, color: MUTED, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    itemPrice: { fontSize: 14, fontWeight: '800', color: SUCCESS },
    scannedTime: { fontSize: 11, color: MUTED },

    addBtn: {
        backgroundColor: TEAL,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

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
    emptySubtitle: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    actionBtn: {
        backgroundColor: TEAL,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    actionBtnGold: {
        backgroundColor: GOLD,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionBtnGoldText: { color: '#412402', fontSize: 13, fontWeight: '800' },
});