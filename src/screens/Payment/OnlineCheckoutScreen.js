import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Modal,
    BackHandler,
    Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../../store/AuthContext';
import { getCart, initiateOnlinePayment, verifyRazorpayPayment, endSession } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const GOLD = '#F7B32B';
const BG = '#F5FAFA';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';
const SUCCESS = '#059669';
const SUCCESS_SOFT = '#ECFDF5';
const DANGER = '#DC2626';
const DANGER_SOFT = '#FEE2E2';

export default function OnlineCheckoutScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { session, clearSession, user } = useAuth();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState('UPI_APP');
    const [processing, setProcessing] = useState(false);
    const [billModalVisible, setBillModalVisible] = useState(false);

    // State flow: 'CHECKOUT' | 'SUCCESS' | 'FAILED'
    const [paymentState, setPaymentState] = useState('CHECKOUT');
    const [verifiedBill, setVerifiedBill] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await getCart();
                setBill(res?.data || res);
            } catch (e) {
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        })();
    }, [navigation]);

    // Handle session teardown and home redirect
    const handleCompleteAndGoHome = useCallback(async () => {
        try {
            await endSession();
        } catch (e) {
            console.log('Session termination note:', e.message);
        } finally {
            await clearSession();
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        }
    }, [clearSession, navigation]);

    // Hardware Back Controller
    useEffect(() => {
        const onBackPress = () => {
            if (paymentState === 'SUCCESS') {
                handleCompleteAndGoHome();
                return true;
            }
            if (paymentState === 'FAILED') {
                setPaymentState('CHECKOUT');
                return true;
            }
            navigation.goBack();
            return true;
        };

        const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => sub.remove();
    }, [paymentState, handleCompleteAndGoHome, navigation]);

    const handlePay = async () => {
        setProcessing(true);
        try {
            // 1. Backend creates order on Razorpay & reserves checkout
            const res = await initiateOnlinePayment(selectedMethod);
            const initData = res?.data || res;

            const razorpayOrderId = initData?.razorpayOrderId;
            const amountInPaise = initData?.amountInPaise || (bill?.totalAmount * 100);
            const keyId = initData?.razorpayKeyId;

            // 2. Razorpay SDK checkout options
            const options = {
                description: 'ZeroQ Self-Checkout Store Purchase',
                currency: 'INR',
                key: keyId,
                amount: amountInPaise,
                name: session?.storeName || 'ZeroQ Supermarket',
                order_id: razorpayOrderId,
                prefill: {
                    contact: user?.phone || '9999999999',
                    name: user?.name || 'Customer',
                },
                theme: { color: TEAL },
            };

            // 3. Open Razorpay Gateway
            RazorpayCheckout.open(options)
                .then(async (data) => {
                    // Success callback from SDK
                    // { razorpay_payment_id, razorpay_order_id, razorpay_signature }
                    try {
                        const verifyRes = await verifyRazorpayPayment({
                            orderId: initData.orderId,
                            razorpayPaymentId: data.razorpay_payment_id,
                            razorpayOrderId: data.razorpay_order_id,
                            razorpaySignature: data.razorpay_signature,
                        });
                        setVerifiedBill(verifyRes?.data || verifyRes);
                        setPaymentState('SUCCESS');
                    } catch (err) {
                        Alert.alert('Verification Issue', 'Payment succeeded but signature check failed. Please contact counter.');
                        setPaymentState('FAILED');
                    }
                })
                .catch((error) => {
                    console.log('Payment cancelled/failed:', error?.description || error);
                    setPaymentState('FAILED');
                })
                .finally(() => {
                    setProcessing(false);
                });

        } catch (e) {
            Alert.alert('Gateway Error', e.message || 'Could not initiate checkout.');
            setPaymentState('FAILED');
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.flex, styles.center]} edges={['top', 'bottom']}>
                <ActivityIndicator size="large" color={TEAL} />
            </SafeAreaView>
        );
    }

    const items = bill?.items || [];
    const totalAmount = bill?.totalAmount || 0;
    const totalDiscount = bill?.totalDiscount || 0;

    // ── SCREEN 1: PAYMENT SUCCESSFUL ───────────────────────────────
    if (paymentState === 'SUCCESS') {
        return (
            <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={BG} />
                <View style={styles.resultContainer}>
                    <View style={styles.successIconCircle}>
                        <Icon name="check" size={44} color="#FFFFFF" />
                    </View>

                    <Text style={styles.resultTitle}>Payment Successful!</Text>
                    <Text style={styles.resultSubtitle}>
                        Your order has been verified. The digital bill is generated and saved in your permanent invoices.
                    </Text>

                    <View style={styles.receiptSummaryBox}>
                        <Text style={styles.summaryLabel}>Amount Paid</Text>
                        <Text style={styles.summaryAmount}>₹{totalAmount}</Text>
                        <Text style={styles.summaryStore}>{session?.storeName || 'Supermarket Branch'}</Text>
                        {verifiedBill?.billRef && (
                            <Text style={styles.summaryRef}>Bill Ref: {verifiedBill.billRef}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.actionBtnSuccess}
                        onPress={handleCompleteAndGoHome}
                        activeOpacity={0.85}
                    >
                        <Icon name="home" size={17} color="#412402" />
                        <Text style={styles.actionBtnSuccessText}>Go to Home Screen</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── SCREEN 2: PAYMENT UNSUCCESSFUL ─────────────────────────────
    if (paymentState === 'FAILED') {
        return (
            <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={BG} />
                <View style={styles.resultContainer}>
                    <View style={styles.dangerIconCircle}>
                        <Icon name="x" size={44} color="#FFFFFF" />
                    </View>

                    <Text style={styles.resultTitle}>Payment Failed</Text>
                    <Text style={styles.resultSubtitle}>
                        Your transaction could not be processed. Don't worry, your cart and items are safely preserved.
                    </Text>

                    <View style={styles.failedNoticeBox}>
                        <Icon name="info" size={16} color={DANGER} />
                        <Text style={styles.failedNoticeText}>No amount was deducted from your account.</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => setPaymentState('CHECKOUT')}
                        activeOpacity={0.85}
                    >
                        <Icon name="refresh-cw" size={16} color="#FFFFFF" />
                        <Text style={styles.retryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── SCREEN 3: NORMAL CHECKOUT SELECTION ────────────────────────
    return (
        <SafeAreaView style={styles.flex} edges={['top']}>
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
                <View style={{ width: 36 }} />
            </View>

            {/* Floating Bill Banner */}
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

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
            >
                {/* UPI Options */}
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

                {/* Cards */}
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

                {/* Netbanking */}
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

            {/* Bottom Sticky Payment Bar */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
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

            {/* Slide-Up Bill Details Drawer */}
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

    scroll: { padding: 20 },
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
        paddingTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 8,
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
    },
    payBtnDisabled: { opacity: 0.6 },
    paySubmitText: { color: '#412402', fontSize: 14, fontWeight: '800' },

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

    resultContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    successIconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: SUCCESS,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: SUCCESS,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    dangerIconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: DANGER,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: DANGER,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: INK,
        marginBottom: 8,
    },
    resultSubtitle: {
        fontSize: 13,
        color: MUTED,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 24,
    },
    receiptSummaryBox: {
        width: '100%',
        backgroundColor: SUCCESS_SOFT,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginBottom: 28,
    },
    summaryLabel: { fontSize: 12, fontWeight: '600', color: SUCCESS },
    summaryAmount: { fontSize: 32, fontWeight: '800', color: SUCCESS, marginVertical: 4 },
    summaryStore: { fontSize: 14, fontWeight: '700', color: INK, marginTop: 4 },
    summaryRef: { fontSize: 11, color: MUTED, marginTop: 2 },

    actionBtnSuccess: {
        width: '100%',
        backgroundColor: GOLD,
        paddingVertical: 15,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 2,
    },
    actionBtnSuccessText: { color: '#412402', fontSize: 15, fontWeight: '800' },

    failedNoticeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: DANGER_SOFT,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    failedNoticeText: { fontSize: 12, color: DANGER, fontWeight: '600' },

    retryBtn: {
        width: '100%',
        backgroundColor: TEAL,
        paddingVertical: 15,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});