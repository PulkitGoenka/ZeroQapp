import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Modal,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { getCart, initiateOnlinePayment } from '../../services/api';

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
const SUCCESS = '#059669';
const DANGER = '#DC2626';

export default function OnlineCheckoutScreen({ navigation }) {
    const { session, clearSession } = useAuth();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState('UPI_APP');
    const [processing, setProcessing] = useState(false);
    const [billModalVisible, setBillModalVisible] = useState(false);
    const [resultModal, setResultModal] = useState({ visible: false, success: false });

    useEffect(() => {
        (async () => {
            try {
                const res = await getCart();
                setBill(res.data);
            } catch (e) {
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        })();
    }, [navigation]);

    const handlePay = async () => {
        setProcessing(true);
        try {
            await initiateOnlinePayment(selectedMethod);
            setResultModal({ visible: true, success: true });
        } catch (e) {
            setResultModal({ visible: true, success: false });
        } finally {
            setProcessing(false);
        }
    };

    const handleFinish = async () => {
        setResultModal({ visible: false, success: false });
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    };

    if (loading) {
        return (
            <View style={[styles.flex, styles.center]}>
                <ActivityIndicator size="large" color={TEAL} />
            </View>
        );
    }

    const items = bill?.items || [];
    const totalAmount = bill?.totalAmount || 0;
    const totalDiscount = bill?.totalDiscount || 0;

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Icon name="arrow-left" size={20} color={INK} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Payment Options</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        Store: {session?.storeName || 'Supermarket'}
                    </Text>
                </View>
            </View>

            {/* Top Banner (Zepto Style Floating Total) */}
            <View style={styles.topBanner}>
                <View>
                    <Text style={styles.topPayLabel}>To Pay: <Text style={styles.topPayAmount}>₹{totalAmount}</Text></Text>
                    {totalDiscount > 0 && (
                        <Text style={styles.topSavingsText}>Saved ₹{totalDiscount} on this bill</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.viewBillBtn}
                    onPress={() => setBillModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.viewBillText}>View Bill</Text>
                    <Icon name="chevron-right" size={14} color={TEAL} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Section 1: UPI Options */}
                <Text style={styles.sectionHeader}>Pay by UPI</Text>
                <View style={styles.cardGroup}>
                    <TouchableOpacity
                        style={[styles.rowOption, selectedMethod === 'UPI_APP' && styles.rowOptionActive]}
                        onPress={() => setSelectedMethod('UPI_APP')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                            <Icon name="smartphone" size={18} color="#7C3AED" />
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Pay by any UPI app</Text>
                            <Text style={styles.rowSub}>GPay, PhonePe, Paytm, CRED & more</Text>
                        </View>
                        <View style={[styles.radioCircle, selectedMethod === 'UPI_APP' && styles.radioActive]}>
                            {selectedMethod === 'UPI_APP' && <View style={styles.radioDot} />}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={[styles.rowOption, selectedMethod === 'UPI_QR' && styles.rowOptionActive]}
                        onPress={() => setSelectedMethod('UPI_QR')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconBox, { backgroundColor: TEAL_SOFT }]}>
                            <Icon name="maximize" size={18} color={TEAL} />
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Pay via Dynamic QR Code</Text>
                            <Text style={styles.rowSub}>Scan & pay from secondary device</Text>
                        </View>
                        <View style={[styles.radioCircle, selectedMethod === 'UPI_QR' && styles.radioActive]}>
                            {selectedMethod === 'UPI_QR' && <View style={styles.radioDot} />}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Section 2: Cards */}
                <Text style={styles.sectionHeader}>Credit & Debit Cards</Text>
                <View style={styles.cardGroup}>
                    <TouchableOpacity
                        style={[styles.rowOption, selectedMethod === 'CARD' && styles.rowOptionActive]}
                        onPress={() => setSelectedMethod('CARD')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                            <Icon name="credit-card" size={18} color="#D97706" />
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Credit / Debit Card</Text>
                            <Text style={styles.rowSub}>Visa, Mastercard, Rupay & Diners</Text>
                        </View>
                        <View style={[styles.radioCircle, selectedMethod === 'CARD' && styles.radioActive]}>
                            {selectedMethod === 'CARD' && <View style={styles.radioDot} />}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Section 3: Netbanking */}
                <Text style={styles.sectionHeader}>Netbanking</Text>
                <View style={styles.cardGroup}>
                    <View style={styles.bankGrid}>
                        {[
                            { id: 'HDFC', name: 'HDFC Bank', icon: 'shield' },
                            { id: 'ICICI', name: 'ICICI Bank', icon: 'globe' },
                            { id: 'SBI', name: 'State Bank', icon: 'layers' },
                            { id: 'AXIS', name: 'Axis Bank', icon: 'compass' },
                        ].map((bank) => (
                            <TouchableOpacity
                                key={bank.id}
                                style={[styles.bankItem, selectedMethod === bank.id && styles.bankItemActive]}
                                onPress={() => setSelectedMethod(bank.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.bankIconCircle}>
                                    <Icon name={bank.icon} size={16} color={selectedMethod === bank.id ? TEAL : MUTED} />
                                </View>
                                <Text style={[styles.bankName, selectedMethod === bank.id && styles.bankNameActive]}>
                                    {bank.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Sticky Payment CTA */}
            <View style={styles.footer}>
                <View style={styles.footerMeta}>
                    <Text style={styles.footerMetaLabel}>Amount to pay</Text>
                    <Text style={styles.footerMetaAmount}>₹{totalAmount}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.paySubmitBtn, processing && styles.payBtnDisabled]}
                    onPress={handlePay}
                    disabled={processing}
                    activeOpacity={0.85}
                >
                    {processing ? (
                        <ActivityIndicator color="#412402" />
                    ) : (
                        <>
                            <Icon name="lock" size={16} color="#412402" />
                            <Text style={styles.paySubmitText}>Proceed to Pay</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Slide-Up Bill Details Modal */}
            <Modal visible={billModalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.billDrawer}>
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>Order Bill Details</Text>
                            <TouchableOpacity onPress={() => setBillModalVisible(false)}>
                                <Icon name="x" size={20} color={INK} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
                            {items.map((item, idx) => (
                                <View key={idx} style={styles.billItemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.billItemName}>{item.productName}</Text>
                                        <Text style={styles.billItemQty}>Qty: {item.quantity} × ₹{item.discountPrice}</Text>
                                    </View>
                                    <Text style={styles.billItemPrice}>₹{item.discountPrice * item.quantity}</Text>
                                </View>
                            ))}

                            <View style={styles.billDivider} />
                            <View style={styles.billCalcRow}>
                                <Text style={styles.calcLabel}>Item Total</Text>
                                <Text style={styles.calcVal}>₹{totalAmount + totalDiscount}</Text>
                            </View>
                            {totalDiscount > 0 && (
                                <View style={styles.billCalcRow}>
                                    <Text style={[styles.calcLabel, { color: SUCCESS }]}>Savings & Discounts</Text>
                                    <Text style={[styles.calcVal, { color: SUCCESS }]}>- ₹{totalDiscount}</Text>
                                </View>
                            )}
                            <View style={[styles.billCalcRow, styles.grandRow]}>
                                <Text style={styles.grandLabel}>To Pay</Text>
                                <Text style={styles.grandVal}>₹{totalAmount}</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Success / Failure Result Dialog */}
            <Modal visible={resultModal.visible} transparent animationType="fade">
                <View style={styles.modalBackdropCenter}>
                    <View style={styles.resultCard}>
                        <View style={[styles.resultCircle, resultModal.success ? styles.bgSuccess : styles.bgDanger]}>
                            <Icon name={resultModal.success ? 'check' : 'alert-circle'} size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.resultTitle}>
                            {resultModal.success ? 'Payment Successful' : 'Payment Failed'}
                        </Text>
                        <Text style={styles.resultSub}>
                            {resultModal.success
                                ? 'Your transaction was approved and your store session has ended.'
                                : 'Unable to process transaction. Please try another method.'}
                        </Text>

                        {resultModal.success ? (
                            <TouchableOpacity style={styles.resultBtnSuccess} onPress={handleFinish} activeOpacity={0.85}>
                                <Icon name="home" size={16} color="#412402" />
                                <Text style={styles.resultBtnSuccessText}>Go to Home</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.resultBtnRetry}
                                onPress={() => setResultModal({ visible: false, success: false })}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.resultBtnRetryText}>Try Again</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
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
    headerTextWrap: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: INK },
    headerSub: { fontSize: 12, color: MUTED, marginTop: 1 },

    topBanner: {
        backgroundColor: CARD_BG,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    topPayLabel: { fontSize: 13, color: MUTED, fontWeight: '500' },
    topPayAmount: { fontSize: 18, fontWeight: '800', color: INK },
    topSavingsText: { fontSize: 11, fontWeight: '700', color: SUCCESS, marginTop: 2 },
    viewBillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: TEAL_SOFT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    viewBillText: { fontSize: 12, fontWeight: '700', color: TEAL },

    scroll: { padding: 20, paddingBottom: 100 },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: MUTED,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginTop: 10,
    },
    cardGroup: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
        marginBottom: 16,
    },
    rowOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    rowOptionActive: { backgroundColor: TEAL_SOFT },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowInfo: { flex: 1 },
    rowTitle: { fontSize: 14, fontWeight: '700', color: INK },
    rowSub: { fontSize: 11, color: MUTED, marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F3F4F6' },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: BORDER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: { borderColor: TEAL },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: TEAL,
    },

    bankGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        gap: 8,
    },
    bankItem: {
        width: '48.5%',
        backgroundColor: BG,
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER,
        gap: 6,
    },
    bankItemActive: {
        borderColor: TEAL,
        backgroundColor: TEAL_SOFT,
    },
    bankIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: CARD_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bankName: { fontSize: 11, fontWeight: '700', color: BODY },
    bankNameActive: { color: TEAL },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: CARD_BG,
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    footerMeta: { flex: 1 },
    footerMetaLabel: { fontSize: 11, color: MUTED },
    footerMetaAmount: { fontSize: 20, fontWeight: '800', color: INK },
    paySubmitBtn: {
        backgroundColor: GOLD,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    payBtnDisabled: { opacity: 0.6 },
    paySubmitText: { color: '#412402', fontSize: 14, fontWeight: '800' },

    // Drawer
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.65)', justifyContent: 'flex-end' },
    billDrawer: {
        backgroundColor: CARD_BG,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '75%',
        padding: 20,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    drawerTitle: { fontSize: 16, fontWeight: '800', color: INK },
    drawerScroll: { paddingVertical: 14, gap: 10 },
    billItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    billItemName: { fontSize: 13, fontWeight: '700', color: INK },
    billItemQty: { fontSize: 11, color: MUTED, marginTop: 1 },
    billItemPrice: { fontSize: 13, fontWeight: '800', color: INK },
    billDivider: { height: 1, backgroundColor: BORDER, marginVertical: 8 },
    billCalcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    calcLabel: { fontSize: 12, color: MUTED },
    calcVal: { fontSize: 13, fontWeight: '700', color: INK },
    grandRow: { paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER },
    grandLabel: { fontSize: 14, fontWeight: '800', color: INK },
    grandVal: { fontSize: 16, fontWeight: '800', color: INK },

    // Result Center Modal
    modalBackdropCenter: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    resultCard: { width: '100%', maxWidth: 330, backgroundColor: CARD_BG, borderRadius: 20, padding: 24, alignItems: 'center' },
    resultCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    bgSuccess: { backgroundColor: SUCCESS },
    bgDanger: { backgroundColor: DANGER },
    resultTitle: { fontSize: 18, fontWeight: '800', color: INK, marginBottom: 6 },
    resultSub: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    resultBtnSuccess: {
        backgroundColor: GOLD,
        paddingHorizontal: 22,
        paddingVertical: 13,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resultBtnSuccessText: { color: '#412402', fontSize: 14, fontWeight: '800' },
    resultBtnRetry: {
        backgroundColor: BG,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 12,
    },
    resultBtnRetryText: { color: BODY, fontSize: 13, fontWeight: '700' },
});