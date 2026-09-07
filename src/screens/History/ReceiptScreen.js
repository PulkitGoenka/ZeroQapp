import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    StatusBar,
    Share,
    ActivityIndicator,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const BG = '#F5FAFA';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';
const SUCCESS = '#059669';
const SUCCESS_SOFT = '#ECFDF5';
const DANGER = '#EF4444';
const DANGER_SOFT = '#FEF2F2';
const WARNING = '#D97706';

const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

const formatTimeOnly = (iso) => {
    if (!iso) return '--:--:--';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
};

const formatDateOnly = (iso) => {
    if (!iso) return '-- --- ----';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export default function ReceiptScreen({ route, navigation }) {
    const initialBill = route?.params?.bill || {};
    const [bill, setBill] = useState(initialBill);
    const [zoomImage, setZoomImage] = useState(null);

    // Security gate exit verification state
    const isExitVerified = Boolean(bill.isExitVerified || bill.exitVerifiedAt || bill.verifiedAt);
    const verifiedTime = bill.exitVerifiedAt || bill.verifiedAt;

    const items = bill.items && bill.items.length > 0
        ? bill.items
        : [
            {
                productName: 'General Store Purchases',
                quantity: bill.itemCount || 1,
                price: bill.totalAmount || 0,
                imageUrl: null,
                barcode: bill.billRef || 'ITEM-01',
            },
        ];

    const totalUnitsCount = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
    const uniqueItemCount = items.length;

    const rawStatus = (bill.status || bill.paymentStatus || (bill.paidAt ? 'SUCCESS' : 'PENDING')).toUpperCase();
    const isSuccess = rawStatus === 'SUCCESS' || rawStatus === 'PAID' || rawStatus === 'COMPLETED';
    const isFailed = rawStatus === 'FAILED';
    const isCash = (bill.paymentMethod || '').toUpperCase() === 'CASH';

    const handleShareInvoice = async () => {
        try {
            await Share.share({
                message: `Tax Invoice #${bill.billRef || 'N/A'}\nStore: ${bill.storeName || 'Supermarket'}\nAmount Paid: ${fmt(bill.totalAmount)}\nPayment: ${isSuccess ? 'Verified' : rawStatus}\nGate Exit Pass: ${isExitVerified ? 'Already Verified & Closed' : 'Active Pass'}\nTime: ${formatTimeOnly(bill.paidAt)} on ${formatDateOnly(bill.paidAt)}`,
            });
        } catch (e) {
            console.log('Share error:', e.message);
        }
    };

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

            {/* Top Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBtn}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={20} color={INK} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Digital Tax Invoice</Text>
                    <Text style={styles.headerSub}>Ref: #{bill.billRef || 'REC-STORE'}</Text>
                </View>

                <TouchableOpacity
                    onPress={handleShareInvoice}
                    style={styles.headerBtn}
                    activeOpacity={0.7}
                >
                    <Icon name="share-2" size={18} color={INK} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* 1. Payment Status Hero Banner */}
                <View style={styles.statusCard}>
                    <View style={[
                        styles.statusIconCircle,
                        isSuccess ? styles.bgSuccess : isFailed ? styles.bgDanger : styles.bgWarning,
                    ]}>
                        <Icon
                            name={isSuccess ? 'check' : isFailed ? 'x' : 'clock'}
                            size={24}
                            color="#FFFFFF"
                        />
                    </View>

                    <Text style={styles.statusTitle}>
                        {isSuccess ? 'Payment Successful' : isFailed ? 'Payment Failed' : 'Payment Processing'}
                    </Text>
                    <Text style={styles.statusSub}>
                        {isSuccess
                            ? 'Transaction verified & settled in full'
                            : isFailed
                                ? 'Transaction could not be completed'
                                : 'Awaiting confirmation from bank'}
                    </Text>

                    <Text style={styles.totalAmountText}>{fmt(bill.totalAmount)}</Text>

                    <View style={styles.statusPillsRow}>
                        <View style={[styles.pillBadge, { backgroundColor: '#F3F4F6' }]}>
                            <Icon name={isCash ? 'dollar-sign' : 'credit-card'} size={12} color={BODY} />
                            <Text style={styles.pillText}>{isCash ? 'Cash Desk' : 'Online Payment'}</Text>
                        </View>

                        <View style={[
                            styles.pillBadge,
                            isSuccess ? { backgroundColor: SUCCESS_SOFT } : { backgroundColor: DANGER_SOFT },
                        ]}>
                            <Icon
                                name={isSuccess ? 'check-circle' : 'alert-circle'}
                                size={12}
                                color={isSuccess ? SUCCESS : DANGER}
                            />
                            <Text style={[styles.pillText, { color: isSuccess ? SUCCESS : DANGER, fontWeight: '800' }]}>
                                {rawStatus}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 2. Security Gate Pass (One-Time Verification Logic) */}
                {isExitVerified ? (
                    // State B: Already Scanned & Verified State
                    <View style={styles.verifiedPassCard}>
                        <View style={styles.verifiedHeaderRow}>
                            <View style={styles.verifiedBadgeLeft}>
                                <Icon name="check-circle" size={18} color={MUTED} />
                                <Text style={styles.verifiedBadgeText}>ALREADY SCANNED & VERIFIED</Text>
                            </View>
                            <View style={styles.lockedPill}>
                                <Icon name="lock" size={12} color="#DC2626" />
                                <Text style={styles.lockedPillText}>EXPIRED PASS</Text>
                            </View>
                        </View>

                        <View style={styles.verifiedInnerBox}>
                            <Icon name="slash" size={32} color="#9CA3AF" style={{ marginBottom: 6 }} />
                            <Text style={styles.verifiedNoticeTitle}>Pass Has Been Used</Text>
                            <Text style={styles.verifiedNoticeSub}>
                                This receipt was already verified and approved at store gate on{' '}
                                <Text style={{ fontWeight: '700', color: INK }}>
                                    {formatTimeOnly(verifiedTime)} ({formatDateOnly(verifiedTime)})
                                </Text>. Re-scanning will be flagged as duplicate.
                            </Text>
                        </View>

                        <View style={styles.passFooterMeta}>
                            <Text style={styles.footerRefText}>Auth Ref: #{bill.billRef}</Text>
                            <Text style={styles.footerStatusFlag}>Status: GATE CHECKED</Text>
                        </View>
                    </View>
                ) : (
                    // State A: Active Valid Gate Pass
                    <View style={styles.activePassCard}>
                        <View style={styles.activePassHeader}>
                            <View style={styles.pulseLiveDot} />
                            <Text style={styles.activePassTag}>ACTIVE SECURITY EXIT PASS</Text>
                        </View>

                        <View style={styles.qrPlaceholderBox}>
                            <Icon name="maximize" size={54} color={TEAL} />
                            <Text style={styles.qrCodeLabel}>{bill.billRef || 'PASS-AUTHORIZED'}</Text>
                        </View>

                        <Text style={styles.activePassTitle}>Scan at Security Exit Gate</Text>
                        <Text style={styles.activePassSub}>
                            Flash this code to the guard before walking out. Once scanned, this pass will permanently expire.
                        </Text>

                        <View style={styles.oneTimeSecurityBadge}>
                            <Icon name="shield" size={13} color={TEAL} />
                            <Text style={styles.oneTimeSecurityText}>One-Time Verification Protection Active</Text>
                        </View>
                    </View>
                )}

                {/* 3. Transaction & Timestamp Details */}
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Transaction & Time Details</Text>

                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Payment Time</Text>
                            <View style={styles.timeRow}>
                                <Icon name="clock" size={12} color={TEAL} style={{ marginRight: 4 }} />
                                <Text style={styles.detailValueBold}>{formatTimeOnly(bill.paidAt)}</Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Payment Date</Text>
                            <View style={styles.timeRow}>
                                <Icon name="calendar" size={12} color={TEAL} style={{ marginRight: 4 }} />
                                <Text style={styles.detailValueBold}>{formatDateOnly(bill.paidAt)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Total Unique Items</Text>
                            <Text style={styles.detailValue}>{uniqueItemCount} Products</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Total Net Units</Text>
                            <Text style={[styles.detailValue, { color: TEAL, fontWeight: '800' }]}>
                                {totalUnitsCount} Units
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Store Branch</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{bill.storeName || 'Supermarket'}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Transaction Ref</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>#{bill.billRef || 'TXN-98402'}</Text>
                        </View>
                    </View>
                </View>

                {/* 4. Purchased Items List */}
                <View style={styles.card}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={styles.sectionLabel}>Purchased Items ({totalUnitsCount} Total)</Text>
                        <Text style={styles.tapNote}>Hold photo to zoom</Text>
                    </View>

                    <View style={styles.itemsTable}>
                        {items.map((prod, idx) => {
                            const unitPrice = Number(prod.price || prod.discountPrice || 0);
                            const itemQty = Number(prod.quantity) || 1;
                            const itemTotal = unitPrice * itemQty;

                            return (
                                <View
                                    key={idx}
                                    style={[styles.itemRow, idx !== items.length - 1 && styles.borderBottom]}
                                >
                                    <TouchableOpacity
                                        onPressIn={() => prod.imageUrl && setZoomImage(prod.imageUrl)}
                                        onPressOut={() => setZoomImage(null)}
                                        activeOpacity={0.8}
                                        style={styles.imageBox}
                                    >
                                        {prod.imageUrl ? (
                                            <Image
                                                source={{ uri: prod.imageUrl }}
                                                style={styles.thumb}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Icon name="package" size={18} color={MUTED} />
                                        )}
                                    </TouchableOpacity>

                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName} numberOfLines={2}>
                                            {prod.productName || prod.name || 'Store Item'}
                                        </Text>
                                        <View style={styles.qtyBadgeRow}>
                                            <View style={styles.qtyBubble}>
                                                <Text style={styles.qtyBubbleText}>Qty: {itemQty}</Text>
                                            </View>
                                            <Text style={styles.unitPriceText}>@ {fmt(unitPrice)} each</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.itemTotal}>{fmt(itemTotal)}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Financial Breakdown */}
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryText}>Total Units Count</Text>
                            <Text style={styles.summaryVal}>{totalUnitsCount} Items</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryText}>Items Subtotal</Text>
                            <Text style={styles.summaryVal}>{fmt(bill.totalAmount)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryText}>Taxes & GST (Included)</Text>
                            <Text style={[styles.summaryVal, { color: SUCCESS }]}>Verified</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.grandTotalBorder]}>
                            <Text style={styles.grandLabel}>Total Paid Amount</Text>
                            <Text style={styles.grandVal}>{fmt(bill.totalAmount)}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Full Screen Image Zoom Modal */}
            <Modal visible={!!zoomImage} transparent animationType="fade">
                <View style={styles.zoomBackdrop}>
                    <Image source={{ uri: zoomImage }} style={styles.enlargedImg} resizeMode="contain" />
                    <Text style={styles.zoomNote}>Release touch to dismiss preview</Text>
                </View>
            </Modal>
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
    headerBtn: {
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
    headerSub: { fontSize: 11, color: MUTED, marginTop: 1 },

    scroll: { padding: 20, paddingBottom: 40 },

    // Status Card
    statusCard: {
        backgroundColor: CARD_BG,
        borderRadius: 18,
        padding: 22,
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: BORDER,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    statusIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    bgSuccess: { backgroundColor: SUCCESS },
    bgDanger: { backgroundColor: DANGER },
    bgWarning: { backgroundColor: WARNING },
    statusTitle: { fontSize: 18, fontWeight: '800', color: INK },
    statusSub: { fontSize: 12, color: MUTED, marginTop: 2, textAlign: 'center' },
    totalAmountText: { fontSize: 30, fontWeight: '800', color: INK, marginVertical: 10 },
    statusPillsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    pillBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    pillText: { fontSize: 11, fontWeight: '700', color: BODY },

    // Active Security Pass Card
    activePassCard: {
        backgroundColor: TEAL_SOFT,
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#A8D5D8',
        marginBottom: 14,
    },
    activePassHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
    },
    pulseLiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: TEAL,
    },
    activePassTag: {
        fontSize: 10,
        fontWeight: '800',
        color: TEAL,
        letterSpacing: 0.8,
    },
    qrPlaceholderBox: {
        width: 150,
        height: 150,
        borderRadius: 16,
        backgroundColor: CARD_BG,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#B6DCDC',
        marginBottom: 14,
    },
    qrCodeLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: TEAL,
        marginTop: 8,
        letterSpacing: 0.6,
    },
    activePassTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: INK,
    },
    activePassSub: {
        fontSize: 12,
        color: MUTED,
        textAlign: 'center',
        lineHeight: 17,
        marginTop: 4,
        paddingHorizontal: 12,
    },
    oneTimeSecurityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: CARD_BG,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#B6DCDC',
    },
    oneTimeSecurityText: {
        fontSize: 11,
        fontWeight: '700',
        color: TEAL,
    },

    // Already Verified Security Pass Card
    verifiedPassCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        marginBottom: 14,
    },
    verifiedHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    verifiedBadgeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    verifiedBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 0.6,
    },
    lockedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    lockedPillText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#DC2626',
    },
    verifiedInnerBox: {
        backgroundColor: CARD_BG,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    verifiedNoticeTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: INK,
    },
    verifiedNoticeSub: {
        fontSize: 12,
        color: MUTED,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 4,
    },
    passFooterMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    footerRefText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    footerStatusFlag: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4B5563',
    },

    // Detail Cards
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: MUTED,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
    detailGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 11, color: MUTED, marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '600', color: INK },
    detailValueBold: { fontSize: 13, fontWeight: '800', color: INK },
    timeRow: { flexDirection: 'row', alignItems: 'center' },

    // Items Table
    tableHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tapNote: { fontSize: 10, color: MUTED, fontStyle: 'italic' },
    itemsTable: {
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 14,
        paddingHorizontal: 12,
    },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    imageBox: {
        width: 46,
        height: 46,
        borderRadius: 10,
        backgroundColor: BG,
        borderWidth: 1,
        borderColor: BORDER,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    thumb: { width: '100%', height: '100%' },
    itemInfo: { flex: 1, marginHorizontal: 12 },
    itemName: { fontSize: 13, fontWeight: '700', color: INK },
    qtyBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    qtyBubble: {
        backgroundColor: TEAL_SOFT,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    qtyBubbleText: { fontSize: 10, fontWeight: '800', color: TEAL },
    unitPriceText: { fontSize: 11, color: MUTED },
    itemTotal: { fontSize: 14, fontWeight: '800', color: INK },

    // Summary Box
    summaryBox: {
        backgroundColor: BG,
        borderRadius: 14,
        padding: 14,
        marginTop: 14,
        gap: 8,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryText: { fontSize: 12, color: MUTED },
    summaryVal: { fontSize: 13, fontWeight: '700', color: INK },
    grandTotalBorder: { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, marginTop: 4 },
    grandLabel: { fontSize: 14, fontWeight: '800', color: INK },
    grandVal: { fontSize: 17, fontWeight: '800', color: INK },

    // Zoom Modal
    zoomBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    enlargedImg: { width: '88%', height: 340, borderRadius: 16 },
    zoomNote: { color: '#E5E7EB', fontSize: 12, marginTop: 16, fontWeight: '500' },
});