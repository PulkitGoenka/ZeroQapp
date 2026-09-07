import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
    findStoresByPincode, findStoresByState, findStoresByDistrict,
    findStoreByQr, startSession, endSession,
} from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const TABS = ['Pincode', 'State', 'District'];

export default function StoreSelectScreen({ navigation, route }) {
    const { brandId, brandName } = route.params || {};
    const { session, saveSession, clearSession } = useAuth();

    const [qrOpen, setQrOpen]     = useState(false);
    const [qrScanned, setQrScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    const [tab,      setTab]      = useState(0);
    const [pincode,  setPincode]  = useState('');
    const [state,    setState]    = useState('');
    const [district, setDistrict] = useState('');
    const [stores,   setStores]   = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [starting, setStarting] = useState(null);

    const openQr = async () => {
        if (!permission?.granted) {
            const r = await requestPermission();
            if (!r.granted) { Alert.alert('Camera needed', 'Allow camera to scan store QR.'); return; }
        }
        setQrScanned(false); setQrOpen(true);
    };

    const handleQrScanned = async ({ data }) => {
        if (qrScanned) return;
        setQrScanned(true); setQrOpen(false);
        try {
            const res = await findStoreByQr(data);
            if (res.data) await enterStore(res.data);
            else { Alert.alert('Invalid QR', 'Not a valid store QR.'); setQrScanned(false); }
        } catch (e) { Alert.alert('Error', e.message); setQrScanned(false); }
    };

    const search = async () => {
        setLoading(true); setStores([]);
        try {
            let res;
            if (tab === 0) {
                if (!/^\d{6}$/.test(pincode.trim())) { Alert.alert('Invalid', '6-digit pincode required.'); return; }
                res = await findStoresByPincode(pincode.trim(), brandId);
            } else if (tab === 1) {
                if (!state.trim()) { Alert.alert('Enter state', 'State name required.'); return; }
                res = await findStoresByState(state.trim(), brandId);
            } else {
                if (!district.trim()) { Alert.alert('Enter district', 'District name required.'); return; }
                res = await findStoresByDistrict(district.trim(), brandId);
            }
            const list = res.data || [];
            setStores(list);
            if (!list.length) Alert.alert('No stores', `No ${brandName || ''} stores found here.`);
        } catch (e) { Alert.alert('Error', e.message); }
        finally { setLoading(false); }
    };

    const enterStore = async (store) => {
        if (session) {
            Alert.alert('Active session', `End session at ${session.storeName} and enter ${store.name}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Switch', style: 'destructive', onPress: async () => {
                        try { await endSession(); } catch {}
                        await clearSession();
                        const r = await startSession(store.id);
                        await saveSession(r.data);
                        navigation.navigate('StoreHome');
                    }},
            ]);
            return;
        }
        setStarting(store.id);
        try {
            const r = await startSession(store.id);
            await saveSession(r.data);
            navigation.navigate('StoreHome');
        } catch (e) { Alert.alert('Error', e.message); }
        finally { setStarting(null); }
    };

    const val = tab === 0 ? pincode : tab === 1 ? state : district;

    return (
        <View style={styles.flex}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={20} color="#374151" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Select Store</Text>
                    {brandName && <View style={styles.pill}><Text style={styles.pillText}>{brandName}</Text></View>}
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* QR Option */}
                <Text style={styles.optLabel}>Option 1 — Scan Store QR</Text>
                <TouchableOpacity style={styles.qrCard} onPress={openQr}>
                    <View style={styles.qrIcon}><Icon name="maximize" size={28} color="#2563EB" /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.qrTitle}>Scan QR Code</Text>
                        <Text style={styles.qrSub}>Point camera at store entrance QR</Text>
                    </View>
                    <Icon name="chevron-right" size={18} color="#2563EB" />
                </TouchableOpacity>

                <View style={styles.divRow}>
                    <View style={styles.divLine} />
                    <Text style={styles.divText}>OR</Text>
                    <View style={styles.divLine} />
                </View>

                {/* Search Option */}
                <Text style={styles.optLabel}>Option 2 — Search by Location</Text>
                <View style={styles.tabs}>
                    {TABS.map((t, i) => (
                        <TouchableOpacity key={t} onPress={() => { setTab(i); setStores([]); }}
                                          style={[styles.tab, tab === i && styles.tabActive]}>
                            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={styles.input}
                    placeholder={tab === 0 ? 'e.g. 201014' : tab === 1 ? 'e.g. Uttar Pradesh' : 'e.g. Ghaziabad'}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={tab === 0 ? 'number-pad' : 'default'}
                    maxLength={tab === 0 ? 6 : undefined}
                    value={val}
                    onChangeText={tab === 0 ? setPincode : tab === 1 ? setState : setDistrict}
                    autoCapitalize={tab === 0 ? 'none' : 'words'}
                />

                <TouchableOpacity
                    style={[styles.searchBtn, (!val.trim() || loading) && styles.btnOff]}
                    onPress={search} disabled={!val.trim() || loading}
                >
                    {loading ? <ActivityIndicator color="#fff" />
                        : <><Icon name="search" size={16} color="#fff" /><Text style={styles.searchBtnText}>Find Stores</Text></>
                    }
                </TouchableOpacity>

                {stores.length > 0 && (
                    <>
                        <Text style={styles.resultsLabel}>{stores.length} store{stores.length > 1 ? 's' : ''} found</Text>
                        {stores.map(s => (
                            <TouchableOpacity key={s.id} style={styles.storeCard} onPress={() => enterStore(s)} disabled={starting === s.id}>
                                <View style={styles.storeLogo}><Text style={styles.storeLogoText}>{s.brandName?.charAt(0) || '?'}</Text></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.storeName}>{s.name}</Text>
                                    <Text style={styles.storeAddr} numberOfLines={1}>{s.address}, {s.city}</Text>
                                    <Text style={styles.storeMeta}>{s.pincode} · {s.district} · {s.state}</Text>
                                </View>
                                {starting === s.id
                                    ? <ActivityIndicator color="#2563EB" />
                                    : <View style={styles.enterBtn}><Text style={styles.enterText}>Enter</Text></View>
                                }
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* QR Modal */}
            <Modal visible={qrOpen} animationType="slide" onRequestClose={() => setQrOpen(false)}>
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <View style={styles.qrModalHeader}>
                        <TouchableOpacity onPress={() => setQrOpen(false)} style={styles.qrClose}>
                            <Icon name="x" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.qrModalTitle}>Scan Store QR</Text>
                        <View style={{ width: 36 }} />
                    </View>
                    <CameraView style={StyleSheet.absoluteFill} facing="back"
                                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                                onBarcodeScanned={qrScanned ? undefined : handleQrScanned}
                    />
                    <View style={styles.qrOverlay}>
                        <View style={styles.qrFrame}>
                            {[styles.cTL, styles.cTR, styles.cBL, styles.cBR].map((c, i) =>
                                <View key={i} style={[styles.corner, c]} />)}
                        </View>
                        <Text style={styles.qrHint}>Point at store entrance QR</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const C = { position:'absolute', width:28, height:28, borderColor:'#fff' };
const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { alignItems: 'center', gap: 4 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    pill: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    pillText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
    scroll: { padding: 20, paddingBottom: 48 },
    optLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' },
    qrCard: {
        backgroundColor: '#EFF6FF', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 14,
        borderWidth: 1.5, borderColor: '#BFDBFE', marginBottom: 24,
    },
    qrIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    qrTitle: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
    qrSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    divRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    divLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    divText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
    tabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 14 },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    tabTextActive: { color: '#2563EB' },
    input: {
        height: 48, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16,
        fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12,
    },
    searchBtn: {
        backgroundColor: '#2563EB', height: 48, borderRadius: 12,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 24,
    },
    btnOff: { opacity: 0.45 },
    searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    resultsLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
    storeCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    storeLogo: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
    storeLogoText: { fontSize: 20, fontWeight: '800', color: '#2563EB' },
    storeName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    storeAddr: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    storeMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    enterBtn: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
    enterText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    qrModalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, zIndex: 10,
    },
    qrClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    qrModalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    qrOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    qrFrame: { width: 220, height: 220, position: 'relative' },
    corner: C,
    cTL: { top:0, left:0, borderTopWidth:3, borderLeftWidth:3, borderTopLeftRadius:4 },
    cTR: { top:0, right:0, borderTopWidth:3, borderRightWidth:3, borderTopRightRadius:4 },
    cBL: { bottom:0, left:0, borderBottomWidth:3, borderLeftWidth:3, borderBottomLeftRadius:4 },
    cBR: { bottom:0, right:0, borderBottomWidth:3, borderRightWidth:3, borderBottomRightRadius:4 },
    qrHint: { color: '#E5E7EB', fontSize: 13, fontWeight: '500', marginTop: 24 },
});