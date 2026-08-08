import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { getCart, initiateOnlinePayment } from '../../services/api';

// New screen inserted BEFORE the exit QR is created for the online flow.
// Shows the bill (what CartScreen already had) and lets the user pick a
// gateway. Only after the gateway call reports success do we ask the
// backend for the exit QR — so the QR that gets generated always means
// "this order is already paid".

const GATEWAYS = [
    { id: 'UPI',     label: 'UPI (Any App)', icon: 'smartphone', color: '#7C3AED' },
    { id: 'PHONEPE', label: 'PhonePe',       icon: 'smartphone', color: '#5F259F' },
    { id: 'GPAY',     label: 'Google Pay',    icon: 'smartphone', color: '#4285F4' },
    { id: 'PAYTM',    label: 'Paytm',         icon: 'smartphone', color: '#00BAF2' },
];

export default function OnlineCheckoutScreen({ navigation }) {
    const { session } = useAuth();
    const [bill, setBill] = useState(null);
    const [loadingBill, setLoadingBill] = useState(true);
    const [selectedGateway, setSelectedGateway] = useState(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await getCart();
                const cart = res.data;

                // Confirmed shape (matches CartScreen.js):
                // cart.items[i]: { barcode, productName, discountPrice, mrp, quantity }
                // cart: { totalAmount, totalDiscount }
                setBill(cart);
            } catch (e) {
                console.log('getCart failed:', e?.message);
                Alert.alert('Error', 'Could not load your bill.');
                navigation.goBack();
            } finally {
                setLoadingBill(false);
            }
        })();
    }, []);

    const handlePay = async () => {
        if (!selectedGateway) {
            Alert.alert('Select a payment app', 'Choose UPI, PhonePe, GPay or Paytm to continue.');
            return;
        }
        setPaying(true);
        try {
            // Backend: charges via chosen gateway, and ONLY on success
            // generates & returns the exit QR (order already marked PAID).
            const res = await initiateOnlinePayment(selectedGateway);
            navigation.navigate('PaymentQr', {
                mode:          'online',
                orderId:       res.data.orderId,
                qrImageBase64: res.data.qrImageBase64,
                qrToken:       res.data.qrToken,
                totalAmount:   res.data.totalAmount,
                expirySeconds: res.data.qrExpirySeconds,
                paid:          true,       // <-- already paid, this is an exit-only QR
                allowBack:     false,      // <-- locked: nothing left to change
            });
        } catch (e) {
            Alert.alert('Payment Failed', e.message || 'Please try again.');
        } finally {
            setPaying(false);
        }
    };

    if (loadingBill) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={20} color="#374151" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Review & Pay</Text>
                    <Text style={styles.headerSub}>{session?.storeName}</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <FlatList
                style={styles.body}
                data={bill?.items || []}
                keyExtractor={(item) => item.barcode}
                ListHeaderComponent={
                    <Text style={styles.sectionTitle}>Your Bill ({(bill?.items || []).length} items)</Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                        <Text style={styles.itemPrice}>₹{item.discountPrice * item.quantity}</Text>
                    </View>
                )}
                ListFooterComponent={
                    <>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹{bill?.totalAmount || 0}</Text>
                        </View>
                        {bill?.totalDiscount > 0 && (
                            <Text style={styles.saveText}>You saved ₹{bill.totalDiscount}</Text>
                        )}

                        <Text style={styles.sectionTitle}>Choose Payment App</Text>
                        <View style={styles.gatewayGrid}>
                            {GATEWAYS.map((g) => (
                                <TouchableOpacity
                                    key={g.id}
                                    style={[
                                        styles.gatewayCard,
                                        selectedGateway === g.id && styles.gatewayCardActive,
                                    ]}
                                    onPress={() => setSelectedGateway(g.id)}
                                    activeOpacity={0.85}
                                >
                                    <Icon name={g.icon} size={22} color={g.color} />
                                    <Text style={styles.gatewayLabel}>{g.label}</Text>
                                    {selectedGateway === g.id && (
                                        <Icon name="check-circle" size={16} color="#2563EB" style={styles.gatewayCheck} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                }
            />

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payBtn, (!selectedGateway || paying) && styles.payBtnDisabled]}
                    onPress={handlePay}
                    disabled={!selectedGateway || paying}
                >
                    {paying
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.payBtnText}>Pay ₹{bill?.totalAmount || 0}</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
        backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },

    body: { flex: 1, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 18, marginBottom: 10 },

    itemRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
    },
    itemName: { flex: 1, fontSize: 13, color: '#374151' },
    itemQty: { fontSize: 12, color: '#9CA3AF' },
    itemPrice: { fontSize: 13, fontWeight: '700', color: '#111827', width: 70, textAlign: 'right' },

    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, marginTop: 4, borderTopWidth: 1, borderTopColor: '#111827',
    },
    totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
    totalValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
    saveText: { fontSize: 12, fontWeight: '700', color: '#059669', marginTop: 4 },

    gatewayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
    gatewayCard: {
        width: '47%', borderRadius: 14, padding: 14, gap: 8,
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    },
    gatewayCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
    gatewayLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
    gatewayCheck: { position: 'absolute', top: 10, right: 10 },

    footer: {
        padding: 20, backgroundColor: '#fff',
        borderTopWidth: 0.5, borderTopColor: '#E5E7EB',
    },
    payBtn: {
        backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    payBtnDisabled: { backgroundColor: '#93C5FD' },
    payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});