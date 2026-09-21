import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    BackHandler,
    Alert,
    Modal,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../store/AuthContext';
import { getCart, initiateOnlinePayment, verifyRazorpayPayment, endSession } from '../../services/api';

// HTML generator for Razorpay Standard Checkout in WebView (compatible with Expo Go)
const generateRazorpayHtml = (options) => {
    if (!options) return '';
    return `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        * { box-sizing: border-box; }
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #F5FAFA;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .center-box {
            text-align: center;
            padding: 24px;
        }
        .spinner {
            border: 3px solid #EAF5F5;
            border-top: 3px solid #4E989E;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="center-box">
        <div class="spinner"></div>
        <p style="font-size: 15px; font-weight: 600; color: #111827; margin: 0;">Securing payment with Razorpay...</p>
        <p style="font-size: 12px; color: #6B7280; margin-top: 6px;">Please wait while the gateway loads</p>
    </div>
    <script>
        try {
            var options = ${JSON.stringify(options)};

            options.handler = function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SUCCESS',
                    data: response
                }));
            };

            options.modal = {
                ondismiss: function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'CANCELLED'
                    }));
                },
                escape: true,
                backdropclose: false
            };

            var rzp = new Razorpay(options);

            rzp.on('payment.failed', function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'FAILED',
                    error: response.error
                }));
            });

            window.onload = function() {
                setTimeout(function() {
                    rzp.open();
                }, 300);
            };
        } catch(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: e.message
            }));
        }
    </script>
</body>
</html>`;
};

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
    const [processing, setProcessing] = useState(false);

    const [paymentState, setPaymentState] = useState('CHECKOUT');
    const [verifiedBill, setVerifiedBill] = useState(null);

    // Razorpay WebView Modal state for Expo Go
    const [razorpayVisible, setRazorpayVisible] = useState(false);
    const [razorpayOptions, setRazorpayOptions] = useState(null);
    const [activeOrderId, setActiveOrderId] = useState(null);

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

    // Session teardown aur direct root MainTabs par reset
    const handleCompleteAndGoHome = useCallback(async () => {
        endSession().catch(() => {});
        try {
            await clearSession();
        } catch (e) {}

        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            })
        );
    }, [clearSession, navigation]);

    // Hardware back press interceptor
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (razorpayVisible) {
                    setRazorpayVisible(false);
                    setProcessing(false);
                    return true;
                }
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
        }, [razorpayVisible, paymentState, handleCompleteAndGoHome, navigation])
    );

    // Razorpay WebView message bridge
    const onWebViewMessage = async (event) => {
        try {
            const res = JSON.parse(event.nativeEvent.data);

            if (res.type === 'SUCCESS') {
                setRazorpayVisible(false);
                setProcessing(true);
                try {
                    const payload = {
                        orderId: activeOrderId,
                        razorpayPaymentId: res.data.razorpay_payment_id,
                        razorpayOrderId: res.data.razorpay_order_id,
                        razorpaySignature: res.data.razorpay_signature,
                    };

                    const verifyRes = await verifyRazorpayPayment(payload);
                    setVerifiedBill(verifyRes?.data || verifyRes);
                    setPaymentState('SUCCESS');
                } catch (err) {
                    Alert.alert('Verification Issue', err?.message || 'Payment succeeded but verification failed.');
                    setPaymentState('FAILED');
                } finally {
                    setProcessing(false);
                }
            } else if (res.type === 'CANCELLED') {
                setRazorpayVisible(false);
                setProcessing(false);
            } else if (res.type === 'FAILED') {
                setRazorpayVisible(false);
                setProcessing(false);
                Alert.alert('Payment Failed', res.error?.description || 'Transaction was declined or failed.');
                setPaymentState('FAILED');
            } else if (res.type === 'ERROR') {
                setRazorpayVisible(false);
                setProcessing(false);
                Alert.alert('Gateway Error', res.message || 'Razorpay checkout encountered an error.');
            }
        } catch (e) {
            setRazorpayVisible(false);
            setProcessing(false);
        }
    };

    const handlePay = async () => {
        setProcessing(true);
        try {
            const res = await initiateOnlinePayment('ONLINE');
            const initData = res?.data || res;

            const razorpayOrderId = initData?.razorpayOrderId;
            const amountInPaise = initData?.amountInPaise || (bill?.totalAmount * 100);
            const keyId = initData?.razorpayKeyId;

            if (!razorpayOrderId || !keyId) {
                throw new Error('Could not retrieve payment credentials from server.');
            }

            setActiveOrderId(initData.orderId);

            const options = {
                description: 'Store Self-Checkout Purchase',
                currency: 'INR',
                key: keyId,
                amount: amountInPaise,
                name: session?.storeName || 'Supermarket',
                order_id: razorpayOrderId,
                prefill: {
                    contact: user?.phone || '9999999999',
                    name: user?.name || 'Customer',
                    email: user?.email || undefined,
                },
                theme: { color: TEAL },
            };

            setRazorpayOptions(options);
            setRazorpayVisible(true);
        } catch (e) {
            Alert.alert('Gateway Error', e.message || 'Could not initiate checkout.');
            setPaymentState('FAILED');
        } finally {
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

    // ── SUCCESS SCREEN ──
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
                        Your order has been verified. The digital bill is generated and saved in your order history.
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

    // ── FAILED SCREEN ──
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
                        Your transaction could not be processed. Your cart items are preserved.
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

    // ── DIRECT BILL SUMMARY & CHECKOUT ──
    return (
        <SafeAreaView style={styles.flex} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Icon name="arrow-left" size={20} color={INK} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Order Summary</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        Store: {session?.storeName || 'Supermarket'}
                    </Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
            >
                {totalDiscount > 0 && (
                    <View style={styles.savingBanner}>
                        <Icon name="tag" size={16} color={SUCCESS} />
                        <Text style={styles.savingBannerText}>You are saving ₹{totalDiscount} on this purchase!</Text>
                    </View>
                )}

                <Text style={styles.sectionHeader}>Items in Cart ({items.length})</Text>
                <View style={styles.cardGroup}>
                    {items.map((item, idx) => (
                        <View key={idx}>
                            <View style={styles.itemRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemMeta}>Qty: {item.quantity} × ₹{item.discountPrice}</Text>
                                </View>
                                <Text style={styles.itemTotal}>₹{item.discountPrice * item.quantity}</Text>
                            </View>
                            {idx < items.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionHeader}>Payment Breakdown</Text>
                <View style={styles.cardGroup}>
                    <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Item Subtotal</Text>
                        <Text style={styles.calcVal}>₹{totalAmount + totalDiscount}</Text>
                    </View>
                    {totalDiscount > 0 && (
                        <View style={styles.calcRow}>
                            <Text style={[styles.calcLabel, { color: SUCCESS }]}>Store Discount</Text>
                            <Text style={[styles.calcVal, { color: SUCCESS }]}>- ₹{totalDiscount}</Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.calcRow}>
                        <Text style={styles.finalLabel}>Total Payable</Text>
                        <Text style={styles.finalVal}>₹{totalAmount}</Text>
                    </View>
                </View>

                <View style={styles.secureBadge}>
                    <Icon name="shield" size={16} color={TEAL} />
                    <Text style={styles.secureText}>Secured by Razorpay • UPI, Cards, Netbanking</Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                <View style={styles.footerMeta}>
                    <Text style={styles.footerMetaLabel}>Final Payable</Text>
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
                            <Text style={styles.paySubmitText}>Pay ₹{totalAmount}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Razorpay WebView Modal for Expo Go */}
            <Modal
                visible={razorpayVisible}
                animationType="slide"
                onRequestClose={() => {
                    setRazorpayVisible(false);
                    setProcessing(false);
                }}
            >
                <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <Icon name="shield" size={18} color={TEAL} />
                            <Text style={styles.modalHeaderTitle}>Razorpay Checkout</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => {
                                setRazorpayVisible(false);
                                setProcessing(false);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {razorpayOptions && (
                        <WebView
                            key={razorpayOptions.order_id}
                            source={{
                                html: generateRazorpayHtml(razorpayOptions),
                                baseUrl: 'https://api.razorpay.com',
                            }}
                            onMessage={onWebViewMessage}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: BG }]}>
                                    <ActivityIndicator size="large" color={TEAL} />
                                    <Text style={{ marginTop: 12, color: MUTED, fontSize: 13, fontWeight: '500' }}>
                                        Loading payment options...
                                    </Text>
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
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

    scroll: { padding: 16 },
    savingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: SUCCESS_SOFT,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginBottom: 14,
    },
    savingBannerText: { fontSize: 12, fontWeight: '700', color: SUCCESS },

    sectionHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: MUTED,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 6,
    },
    cardGroup: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    itemName: { fontSize: 14, fontWeight: '700', color: INK },
    itemMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
    itemTotal: { fontSize: 14, fontWeight: '800', color: INK },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 6 },

    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    calcLabel: { fontSize: 13, color: MUTED },
    calcVal: { fontSize: 13, fontWeight: '700', color: INK },
    finalLabel: { fontSize: 15, fontWeight: '800', color: INK },
    finalVal: { fontSize: 18, fontWeight: '800', color: INK },

    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 10,
    },
    secureText: { fontSize: 11, color: MUTED, fontWeight: '600' },

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
        elevation: 6,
    },
    resultTitle: { fontSize: 22, fontWeight: '800', color: INK, marginBottom: 8 },
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

    modalContainer: {
        flex: 1,
        backgroundColor: CARD_BG,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: CARD_BG,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: INK,
    },
    modalCloseBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
    },
    modalCloseText: {
        fontSize: 13,
        fontWeight: '700',
        color: DANGER,
    },
});