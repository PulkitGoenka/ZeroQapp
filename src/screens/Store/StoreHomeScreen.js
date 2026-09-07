import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Modal,
    StatusBar,
    BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { getCart, endSession } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const TEAL_SHADOW = '#36696D';
const GOLD = '#F7B32B';
const GOLD_TEXT = '#412402';
const BG = '#F5FAFA';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';
const DANGER = '#EF4444';
const DANGER_SOFT = '#FEF2F2';

export default function StoreHomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { session, clearSession } = useAuth();

    const [cart, setCart] = useState(null);
    const [loadingCart, setLoadingCart] = useState(true);
    const [exitModalVisible, setExitModalVisible] = useState(false);
    const [isEnding, setIsEnding] = useState(false);

    // Sync active cart metrics
    const fetchCartMetrics = useCallback(async () => {
        if (!session) return;
        try {
            const res = await getCart();
            setCart(res?.data || null);
        } catch (err) {
            console.log('Cart fetch error:', err.message);
        } finally {
            setLoadingCart(false);
        }
    }, [session]);

    // Focus listener + Session safety
    useEffect(() => {
        if (!session) {
            navigation.replace('StoreDiscovery');
            return;
        }

        fetchCartMetrics();
        const unsubscribe = navigation.addListener('focus', fetchCartMetrics);
        return unsubscribe;
    }, [session, navigation, fetchCartMetrics]);

    // Handle device hardware back press (safely returns to discovery without ending session)
    useEffect(() => {
        const onHardwareBack = () => {
            if (exitModalVisible) {
                setExitModalVisible(false);
                return true;
            }
            navigation.navigate('StoreDiscovery');
            return true;
        };

        const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
        return () => sub.remove();
    }, [exitModalVisible, navigation]);

    // Exit Session Handler
    const handleConfirmExit = async () => {
        setIsEnding(true);
        try {
            try { await endSession(); } catch {}
            await clearSession();
            setExitModalVisible(false);
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } catch (err) {
            console.log('Exit session failed:', err.message);
            setExitModalVisible(false);
        } finally {
            setIsEnding(false);
        }
    };

    if (!session) return null;

    const itemCount = cart?.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;
    const totalAmount = cart?.totalAmount || 0;
    const totalDiscount = cart?.totalDiscount || 0;

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* Top Navigation Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('StoreDiscovery')}
                    style={styles.headerBtn}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={20} color={INK} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>Store Dashboard</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        {session?.brandName || 'Store'} · {session?.city || 'In-Store'}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => setExitModalVisible(true)}
                    style={styles.exitIconBtn}
                    activeOpacity={0.7}
                >
                    <Icon name="log-out" size={17} color={DANGER} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + insets.bottom }]}
            >
                {/* Active Session Badge Card */}
                <View style={styles.sessionCard}>
                    <View style={styles.sessionStatusRow}>
                        <View style={styles.liveIndicatorRow}>
                            <View style={styles.pulsingDot} />
                            <Text style={styles.sessionStatusLabel}>ACTIVE SHOPPING SESSION</Text>
                        </View>
                        <View style={styles.storeIdBadge}>
                            <Text style={styles.storeIdText}>ID: {session.storeId || session.id || 'N/A'}</Text>
                        </View>
                    </View>

                    <Text style={styles.storeNameText}>{session.storeName || 'Local Supermarket'}</Text>
                    <View style={styles.storeLocationRow}>
                        <Icon name="map-pin" size={12} color={MUTED} style={{ marginRight: 4 }} />
                        <Text style={styles.storeLocationText} numberOfLines={1}>
                            {session.address ? `${session.address}, ` : ''}{session.district || ''} {session.state ? `(${session.state})` : ''}
                        </Text>
                    </View>
                </View>

                {/* Live Cart Snapshot Banner */}
                {itemCount > 0 && (
                    <TouchableOpacity
                        style={styles.cartSnapshotCard}
                        onPress={() => navigation.navigate('Cart')}
                        activeOpacity={0.85}
                    >
                        <View style={styles.cartSnapshotLeft}>
                            <View style={styles.cartBadgeCircle}>
                                <Icon name="shopping-cart" size={16} color={TEAL} />
                            </View>
                            <View>
                                <Text style={styles.snapshotTitle}>{itemCount} item{itemCount > 1 ? 's' : ''} in cart</Text>
                                {totalDiscount > 0 && (
                                    <Text style={styles.snapshotSavings}>You save ₹{totalDiscount}</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.cartSnapshotRight}>
                            <Text style={styles.snapshotAmount}>₹{totalAmount}</Text>
                            <Icon name="chevron-right" size={16} color={TEAL} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Primary Action 1: Scan Barcode (Hero Card) */}
                <View style={styles.heroScanCard}>
                    <View style={styles.heroScanRow}>
                        <View style={styles.heroIconBadge}>
                            <Icon name="maximize" size={26} color={TEAL} />
                        </View>
                        <View style={styles.heroTextContent}>
                            <Text style={styles.heroTitle}>Scan Product Barcode</Text>
                            <Text style={styles.heroSubtitle}>
                                Point camera at shelf item barcodes to add directly to your cart
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.heroActionBtn}
                        onPress={() => navigation.navigate('Scanner')}
                        activeOpacity={0.85}
                    >
                        <Icon name="camera" size={16} color={GOLD_TEXT} />
                        <Text style={styles.heroActionText}>Launch Scanner</Text>
                    </TouchableOpacity>
                </View>

                {/* Secondary Action Grid */}
                <View style={styles.actionGridRow}>
                    {/* View Cart Card */}
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Cart')}
                        activeOpacity={0.85}
                    >
                        <View style={styles.actionTopRow}>
                            <View style={[styles.actionIconBox, { backgroundColor: TEAL_SOFT }]}>
                                <Icon name="shopping-cart" size={18} color={TEAL} />
                            </View>
                            {loadingCart ? (
                                <ActivityIndicator size="small" color={TEAL} />
                            ) : (
                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>{itemCount}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.actionCardTitle}>My Cart</Text>
                        <Text style={styles.actionCardSub}>Review, edit quantities, and verify tags</Text>
                        <View style={styles.actionFooter}>
                            <Text style={styles.actionLinkText}>View Items</Text>
                            <Icon name="chevron-right" size={14} color={TEAL} />
                        </View>
                    </TouchableOpacity>

                    {/* Instant Payment Card */}
                    <TouchableOpacity
                        style={[styles.actionCard, itemCount === 0 && styles.actionCardMuted]}
                        onPress={() => {
                            if (itemCount > 0) {
                                navigation.navigate('Payment');
                            } else {
                                navigation.navigate('Scanner');
                            }
                        }}
                        activeOpacity={0.85}
                    >
                        <View style={styles.actionTopRow}>
                            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                                <Icon name="credit-card" size={18} color="#D97706" />
                            </View>
                            <View style={styles.fastPassTag}>
                                <Text style={styles.fastPassText}>EXPRESS</Text>
                            </View>
                        </View>
                        <Text style={styles.actionCardTitle}>Checkout</Text>
                        <Text style={styles.actionCardSub}>Pay digitally & produce security QR pass</Text>
                        <View style={styles.actionFooter}>
                            <Text style={[styles.actionLinkText, { color: '#D97706' }]}>
                                {itemCount > 0 ? 'Pay Now' : 'Add Items'}
                            </Text>
                            <Icon name="chevron-right" size={14} color="#D97706" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* In-Store Guided Steps */}
                <Text style={styles.sectionHeading}>In-Store Checkout Flow</Text>
                <View style={styles.guideCard}>
                    {[
                        { step: '1', icon: 'camera', title: 'Scan Barcodes', desc: 'Scan any item tag to register it to your local cart.' },
                        { step: '2', icon: 'shopping-bag', title: 'Verify Quantities', desc: 'Review price reductions, totals, and remove items anytime.' },
                        { step: '3', icon: 'check-circle', title: 'Pay & Exit', desc: 'Settle payment online and flash verified checkout pass at gate.' },
                    ].map((g, index) => (
                        <View key={g.step} style={[styles.guideRow, index !== 2 && styles.guideBorder]}>
                            <View style={styles.stepNumberBadge}>
                                <Text style={styles.stepNumberText}>{g.step}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.guideRowTitle}>{g.title}</Text>
                                <Text style={styles.guideRowDesc}>{g.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Custom Bottom Tab Navigator */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                {/* Home Tab */}
                <TouchableOpacity style={styles.tabButton} activeOpacity={0.8}>
                    <Icon name="home" size={20} color={TEAL} />
                    <Text style={[styles.tabLabel, styles.tabLabelActive]}>Store</Text>
                </TouchableOpacity>

                {/* Cart Tab */}
                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => navigation.navigate('Cart')}
                    activeOpacity={0.8}
                >
                    <View>
                        <Icon name="shopping-cart" size={20} color={MUTED} />
                        {itemCount > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{itemCount}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.tabLabel}>Cart</Text>
                </TouchableOpacity>

                {/* History Tab */}
                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => navigation.navigate('History')}
                    activeOpacity={0.8}
                >
                    <Icon name="clock" size={20} color={MUTED} />
                    <Text style={styles.tabLabel}>History</Text>
                </TouchableOpacity>

                {/* Profile Tab */}
                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                >
                    <Icon name="user" size={20} color={MUTED} />
                    <Text style={styles.tabLabel}>Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Custom Exit Session Modal */}
            <Modal
                visible={exitModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setExitModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconBox}>
                            <Icon name="log-out" size={24} color={DANGER} />
                        </View>
                        <Text style={styles.modalTitle}>End Shopping Session?</Text>
                        <Text style={styles.modalMessage}>
                            Exiting now will terminate your session at <Text style={{ fontWeight: '700', color: INK }}>{session.storeName}</Text>. Unpaid items in your cart will be cleared.
                        </Text>

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setExitModalVisible(false)}
                                disabled={isEnding}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalCancelText}>Continue Shopping</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalExitBtn}
                                onPress={handleConfirmExit}
                                disabled={isEnding}
                                activeOpacity={0.85}
                            >
                                {isEnding ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalExitText}>End & Exit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: BG,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 54,
        paddingBottom: 14,
        backgroundColor: BG,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: CARD_BG,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.2,
    },
    headerSub: {
        fontSize: 12,
        fontWeight: '500',
        color: MUTED,
        marginTop: 1,
    },
    exitIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: DANGER_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },

    // Active Session Badge Card
    sessionCard: {
        backgroundColor: TEAL_SOFT,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.2,
        borderColor: '#B6DCDC',
        marginBottom: 14,
    },
    sessionStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    liveIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pulsingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: TEAL,
    },
    sessionStatusLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: TEAL,
        letterSpacing: 0.8,
    },
    storeIdBadge: {
        backgroundColor: CARD_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    storeIdText: {
        fontSize: 10,
        fontWeight: '700',
        color: MUTED,
    },
    storeNameText: {
        fontSize: 17,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.3,
    },
    storeLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    storeLocationText: {
        fontSize: 12,
        color: MUTED,
        fontWeight: '500',
    },

    // Cart Snapshot Quick View
    cartSnapshotCard: {
        backgroundColor: CARD_BG,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: BORDER,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    cartSnapshotLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cartBadgeCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: TEAL_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    snapshotTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: INK,
    },
    snapshotSavings: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
        marginTop: 1,
    },
    cartSnapshotRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    snapshotAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: INK,
    },

    // Hero Scan Action
    heroScanCard: {
        backgroundColor: TEAL,
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        shadowColor: TEAL_SHADOW,
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 4,
    },
    heroScanRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    heroIconBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: TEAL_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroTextContent: {
        flex: 1,
    },
    heroTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    heroSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 17,
        marginTop: 3,
    },
    heroActionBtn: {
        backgroundColor: GOLD,
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    heroActionText: {
        color: GOLD_TEXT,
        fontSize: 14,
        fontWeight: '700',
    },

    // Secondary Two Actions
    actionGridRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionCard: {
        flex: 1,
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    actionCardMuted: {
        opacity: 0.85,
    },
    actionTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countBadge: {
        backgroundColor: TEAL_SOFT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    countBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: TEAL,
    },
    fastPassTag: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    fastPassText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#D97706',
    },
    actionCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: INK,
    },
    actionCardSub: {
        fontSize: 11,
        color: MUTED,
        lineHeight: 15,
        marginTop: 3,
        minHeight: 30,
    },
    actionFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 2,
    },
    actionLinkText: {
        fontSize: 12,
        fontWeight: '700',
        color: TEAL,
    },

    // Guided Instructions
    sectionHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: INK,
        marginBottom: 10,
        letterSpacing: -0.2,
    },
    guideCard: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: BORDER,
    },
    guideRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 12,
    },
    guideBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stepNumberBadge: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: TEAL_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: '800',
        color: TEAL,
    },
    guideRowTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: INK,
    },
    guideRowDesc: {
        fontSize: 11,
        color: MUTED,
        marginTop: 2,
        lineHeight: 16,
    },

    // Bottom Tab Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: CARD_BG,
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: MUTED,
    },
    tabLabelActive: {
        color: TEAL,
        fontWeight: '700',
    },
    tabBadge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: TEAL,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    tabBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },

    // Exit Confirmation Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    modalIconBox: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: DANGER_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: INK,
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 13,
        color: MUTED,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 22,
    },
    modalBtnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        fontSize: 13,
        fontWeight: '600',
        color: BODY,
    },
    modalExitBtn: {
        flex: 1,
        backgroundColor: DANGER,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalExitText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});