import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Modal,
    KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    getBrands, findStoresByPincode, findStoresByState, findStoresByDistrict,
    findStoreByQr, startSession, endSession,
} from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const TEAL = '#4E989E';
const TEAL_SHADOW = '#36696D';
const TEAL_SOFT = '#EAF5F5';
const GOLD = '#F7B32B';
const GOLD_TEXT = '#412402';
const BG = '#F5FAFA';
const INK = '#111827';
const MUTED = '#6B7280';
const PLACEHOLDER = '#9CA3AF';
const BORDER = '#E5E7EB';
const RED_SOFT = '#FEE2E2';
const RED = '#EF4444';
const SUCCESS = '#059669';
const SUCCESS_SOFT = '#ECFDF5';

const BRAND_TINTS = ['#4E989E', '#3F7276', '#6BAAAF', '#2E5457', '#5C9FA4', '#457D81'];
const TABS = ['Pincode', 'District', 'State'];

export default function StoreDiscoveryScreen({ navigation }) {
    const { session, saveSession, clearSession } = useAuth();
    const scrollRef = useRef(null);
    const finderY = useRef(0);

    // Brands
    const [brands, setBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState(null);

    // Manual finder
    const [tab, setTab] = useState(0);
    const [pincode, setPincode] = useState('');
    const [district, setDistrict] = useState('');
    const [state, setState] = useState('');
    const [stores, setStores] = useState([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [starting, setStarting] = useState(null);

    // Session Switch / Exit Dialog State
    const [dialogState, setDialogState] = useState({
        visible: false,
        title: '',
        message: '',
        confirmText: '',
        isDestructive: false,
        onConfirm: null,
    });
    const [endingSession, setEndingSession] = useState(false);

    // QR
    const [qrOpen, setQrOpen] = useState(false);
    const [qrScanned, setQrScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => { loadBrands(); }, []);

    const loadBrands = async () => {
        setLoadingBrands(true);
        try {
            const res = await getBrands();
            setBrands(res.data || []);
        } catch (e) {
            showInfoModal('Connection Error', 'Unable to retrieve brands. Please verify your connection.');
        } finally {
            setLoadingBrands(false);
        }
    };

    const showInfoModal = (title, message) => {
        setDialogState({
            visible: true,
            title,
            message,
            confirmText: 'Understood',
            isDestructive: false,
            onConfirm: () => setDialogState(prev => ({ ...prev, visible: false }))
        });
    };

    const selectBrand = (brand) => {
        setSelectedBrand(brand);
        setStores([]);
        setHasSearched(false);
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: finderY.current - 20, animated: true });
        }, 150);
    };

    const clearBrand = () => {
        setSelectedBrand(null);
        setStores([]);
        setHasSearched(false);
    };

    const val = tab === 0 ? pincode : tab === 1 ? district : state;
    const setVal = tab === 0 ? setPincode : tab === 1 ? setDistrict : setState;

    const search = async () => {
        const query = val.trim();
        if (!query) return;

        if (!selectedBrand) {
            showInfoModal('Select Brand', 'Please choose a supermarket brand first before searching.');
            return;
        }

        if (tab === 0 && !/^\d{6}$/.test(query)) {
            showInfoModal('Invalid Pincode', 'Please enter a valid 6-digit postal pincode.');
            return;
        }

        setSearching(true);
        setStores([]);
        setHasSearched(true);

        try {
            let res;
            if (tab === 0) {
                res = await findStoresByPincode(query, selectedBrand.id);
            } else if (tab === 1) {
                res = await findStoresByDistrict(query, selectedBrand.id);
            } else {
                res = await findStoresByState(query, selectedBrand.id);
            }

            const list = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
            setStores(list);
        } catch (e) {
            setStores([]);
        } finally {
            setSearching(false);
        }
    };

    const enterStore = async (store) => {
        if (session) {
            if (session.storeId === store.id) {
                navigation.navigate('StoreHome');
                return;
            }

            setDialogState({
                visible: true,
                title: 'Switch Active Session?',
                message: `You currently have an active check-in at ${session.storeName}. Switching will close that session and enter ${store.name}.`,
                confirmText: 'Switch Store',
                isDestructive: true,
                onConfirm: async () => {
                    setDialogState(prev => ({ ...prev, visible: false }));
                    try { await endSession(); } catch {}
                    await clearSession();
                    await beginSession(store);
                }
            });
            return;
        }
        await beginSession(store);
    };

    const beginSession = async (store) => {
        setStarting(store.id);
        try {
            const r = await startSession(store.id);
            await saveSession(r.data);
            navigation.navigate('StoreHome');
        } catch (e) {
            showInfoModal('Check-in Failed', e.message || 'Could not start session at this store.');
        } finally {
            setStarting(null);
        }
    };

    const openQr = async () => {
        if (!permission?.granted) {
            const r = await requestPermission();
            if (!r.granted) {
                showInfoModal('Camera Required', 'Camera permission is needed to scan entrance QR codes.');
                return;
            }
        }
        setQrScanned(false);
        setQrOpen(true);
    };

    const handleQrScanned = async ({ data }) => {
        if (qrScanned) return;
        setQrScanned(true);
        setQrOpen(false);
        try {
            const res = await findStoreByQr(data);
            if (res.data) await enterStore(res.data);
            else {
                showInfoModal('Invalid QR', 'The scanned QR does not correspond to an active store.');
                setQrScanned(false);
            }
        } catch (e) {
            showInfoModal('Scan Failed', e.message || 'Store code verification failed.');
            setQrScanned(false);
        }
    };

    const handleBack = () => {
        if (session) {
            setDialogState({
                visible: true,
                title: 'Active Session Running',
                message: `You are currently checked in at ${session.storeName}. Exiting now will terminate your shopping session.`,
                confirmText: 'End Session',
                isDestructive: true,
                onConfirm: async () => {
                    setEndingSession(true);
                    try { await endSession(); } catch {}
                    await clearSession();
                    setEndingSession(false);
                    setDialogState(prev => ({ ...prev, visible: false }));
                    navigation.goBack();
                }
            });
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
                        <Icon name="arrow-left" size={20} color={INK} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.headerTitle}>Select Store</Text>
                        <Text style={styles.headerSub}>Scan entrance QR or pick location</Text>
                    </View>

                    {/* Right Header Button: Direct Scan History */}
                    {session ? (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ScanHistory')}
                            style={styles.scanHistoryHeaderBtn}
                            activeOpacity={0.8}
                        >
                            <Icon name="clock" size={18} color={TEAL} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 36 }} />
                    )}
                </View>

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Active Session Card */}
                    {session && (
                        <View style={styles.activeSessionCard}>
                            <View style={styles.activeTopRow}>
                                <View style={styles.activeStoreIcon}>
                                    <Icon name="map-pin" size={18} color={SUCCESS} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.activeBadgeRow}>
                                        <Text style={styles.activeBadge}>● ACTIVE</Text>
                                    </View>
                                    <Text style={styles.activeStoreName} numberOfLines={1}>
                                        {session.storeName || 'Current Store'}
                                    </Text>
                                </View>
                            </View>

                            {/* Buttons: Scan History & Resume Session */}
                            <View style={styles.sessionBtnRow}>
                                <TouchableOpacity
                                    style={styles.scanHistoryBtn}
                                    onPress={() => navigation.navigate('ScanHistory')}
                                    activeOpacity={0.8}
                                >
                                    <Icon name="clock" size={14} color={TEAL} />
                                    <Text style={styles.scanHistoryText}>Scan History</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.resumeBtn}
                                    onPress={() => navigation.navigate('StoreHome')}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.resumeBtnText}>Resume Cart</Text>
                                    <Icon name="arrow-right" size={13} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* QR Entrance Card */}
                    <View style={styles.qrCard}>
                        <View style={styles.qrCardRow}>
                            <View style={styles.qrIcon}><Icon name="maximize" size={26} color={TEAL} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.qrTitle}>Instant Store Check-In</Text>
                                <Text style={styles.qrSub}>Scan the entrance QR code to start scanning items directly</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.scanBtn} onPress={openQr} activeOpacity={0.85}>
                            <Icon name="camera" size={16} color={GOLD_TEXT} />
                            <Text style={styles.scanBtnText}>Open Scanner</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.divRow}>
                        <View style={styles.divLine} />
                        <Text style={styles.divText}>OR CHOOSE A STORE</Text>
                        <View style={styles.divLine} />
                    </View>

                    {/* Brand row */}
                    <View style={styles.rowBetween}>
                        <Text style={styles.sectionLabel}>Select a brand</Text>
                        <Text style={styles.countLabel}>{brands.length} available</Text>
                    </View>

                    {loadingBrands ? (
                        <ActivityIndicator size="small" color={TEAL} style={{ marginVertical: 20 }} />
                    ) : brands.length === 0 ? (
                        <View style={styles.emptyBrands}>
                            <Icon name="alert-circle" size={28} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No brands available</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={loadBrands}>
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRow}>
                            {brands.map((b, index) => {
                                const isSelected = selectedBrand?.id === b.id;
                                const tint = BRAND_TINTS[index % BRAND_TINTS.length];
                                return (
                                    <TouchableOpacity
                                        key={b.id}
                                        style={[styles.brandCard, isSelected && { borderColor: TEAL }]}
                                        onPress={() => selectBrand(b)}
                                        activeOpacity={0.85}
                                    >
                                        <View style={[styles.brandTop, { backgroundColor: tint }]}>
                                            <Icon name="shopping-bag" size={24} color="#fff" />
                                            {isSelected && (
                                                <View style={styles.checkBadge}>
                                                    <Icon name="check" size={12} color={TEAL} />
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.brandBody}>
                                            <Text style={styles.brandName} numberOfLines={1}>{b.name}</Text>
                                            <Text style={styles.brandDesc} numberOfLines={1}>{b.description || 'Tap to find a store'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Manual Finder */}
                    {selectedBrand && (
                        <View
                            style={styles.finder}
                            onLayout={(e) => { finderY.current = e.nativeEvent.layout.y; }}
                        >
                            <View style={styles.rowBetween}>
                                <View>
                                    <Text style={styles.sectionLabel}>Find {selectedBrand.name} near you</Text>
                                    <Text style={styles.finderSub}>Search by pincode, district or state</Text>
                                </View>
                                <TouchableOpacity onPress={clearBrand} style={styles.clearBtn}>
                                    <Icon name="x" size={12} color={MUTED} />
                                    <Text style={styles.clearText}>Clear</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.tabs}>
                                {TABS.map((t, i) => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => {
                                            setTab(i);
                                            setStores([]);
                                            setHasSearched(false);
                                        }}
                                        style={[styles.tab, tab === i && styles.tabActive]}
                                    >
                                        <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder={tab === 0 ? 'e.g. 600096 (6-digit pincode)' : tab === 1 ? 'e.g. Chennai' : 'e.g. Tamil Nadu'}
                                placeholderTextColor={PLACEHOLDER}
                                keyboardType={tab === 0 ? 'number-pad' : 'default'}
                                maxLength={tab === 0 ? 6 : undefined}
                                value={val}
                                onChangeText={setVal}
                                autoCapitalize={tab === 0 ? 'none' : 'words'}
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollRef.current?.scrollTo({ y: finderY.current - 10, animated: true });
                                    }, 200);
                                }}
                            />

                            <TouchableOpacity
                                style={[styles.searchBtn, (!val.trim() || searching) && styles.btnOff]}
                                onPress={search}
                                disabled={!val.trim() || searching}
                            >
                                {searching ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Icon name="search" size={16} color="#fff" />
                                        <Text style={styles.searchBtnText}>Find Stores</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Results */}
                            {stores.length > 0 && (
                                <>
                                    <Text style={styles.resultsLabel}>{stores.length} store{stores.length > 1 ? 's' : ''} found</Text>
                                    {stores.map((s) => (
                                        <TouchableOpacity key={s.id} style={styles.storeCard} onPress={() => enterStore(s)} disabled={starting === s.id}>
                                            <View style={styles.storeLogo}><Text style={styles.storeLogoText}>{s.brandName?.charAt(0) || selectedBrand.name.charAt(0)}</Text></View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.storeName}>{s.name}</Text>
                                                <Text style={styles.storeAddr} numberOfLines={1}>{s.address}, {s.city}</Text>
                                                <Text style={styles.storeMeta}>{s.pincode} · {s.district} · {s.state}</Text>
                                            </View>
                                            {starting === s.id ? (
                                                <ActivityIndicator color={TEAL} />
                                            ) : (
                                                <View style={styles.enterBtn}><Text style={styles.enterText}>Enter</Text></View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}

                            {hasSearched && !searching && stores.length === 0 && (
                                <View style={styles.noResults}>
                                    <Icon name="map-pin" size={22} color={MUTED} />
                                    <Text style={styles.noResultsTitle}>No Stores Found</Text>
                                    <Text style={styles.noResultsSub}>
                                        No {selectedBrand.name} stores match your search in this area. Try another {TABS[tab].toLowerCase()}.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Session Switch Confirmation Modal */}
                <Modal
                    visible={dialogState.visible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setDialogState(prev => ({ ...prev, visible: false }))}
                >
                    <View style={styles.modalBackdrop}>
                        <View style={styles.dialogCard}>
                            <View style={[styles.dialogIconWrap, !dialogState.isDestructive && { backgroundColor: TEAL_SOFT }]}>
                                <Icon
                                    name={dialogState.isDestructive ? 'alert-triangle' : 'info'}
                                    size={24}
                                    color={dialogState.isDestructive ? RED : TEAL}
                                />
                            </View>
                            <Text style={styles.dialogTitle}>{dialogState.title}</Text>
                            <Text style={styles.dialogBody}>{dialogState.message}</Text>
                            <View style={styles.dialogActions}>
                                {dialogState.isDestructive && (
                                    <TouchableOpacity
                                        style={styles.dialogCancelBtn}
                                        onPress={() => setDialogState(prev => ({ ...prev, visible: false }))}
                                        disabled={endingSession}
                                    >
                                        <Text style={styles.dialogCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.dialogDestructBtn, !dialogState.isDestructive && { backgroundColor: TEAL }]}
                                    onPress={dialogState.onConfirm}
                                    disabled={endingSession}
                                >
                                    {endingSession ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.dialogDestructText}>{dialogState.confirmText || 'OK'}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Entrance QR Scanner Modal */}
                <Modal visible={qrOpen} animationType="slide" onRequestClose={() => setQrOpen(false)}>
                    <View style={{ flex: 1, backgroundColor: '#000' }}>
                        <View style={styles.qrModalHeader}>
                            <TouchableOpacity onPress={() => setQrOpen(false)} style={styles.qrClose}>
                                <Icon name="x" size={22} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.qrModalTitle}>Scan Store QR</Text>
                            <View style={{ width: 36 }} />
                        </View>
                        <CameraView
                            style={StyleSheet.absoluteFill}
                            facing="back"
                            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                            onBarcodeScanned={qrScanned ? undefined : handleQrScanned}
                        />
                        <View style={styles.qrOverlay}>
                            <View style={styles.qrFrame}>
                                {[styles.cTL, styles.cTR, styles.cBL, styles.cBR].map((c, i) => <View key={i} style={[styles.corner, c]} />)}
                            </View>
                            <Text style={styles.qrHint}>Point at store entrance QR</Text>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const C = { position: 'absolute', width: 28, height: 28, borderColor: '#fff' };
const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, backgroundColor: BG,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    scanHistoryHeaderBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: TEAL_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: INK },
    headerSub: { fontSize: 12, color: MUTED, marginTop: 2, fontWeight: '500' },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },

    activeSessionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: SUCCESS,
        shadowColor: SUCCESS,
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
        gap: 12,
    },
    activeTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    activeStoreIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: SUCCESS_SOFT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeBadgeRow: { flexDirection: 'row', alignItems: 'center' },
    activeBadge: { fontSize: 10, fontWeight: '800', color: SUCCESS, letterSpacing: 0.5 },
    activeStoreName: { fontSize: 14, fontWeight: '800', color: INK, marginTop: 2 },

    sessionBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scanHistoryBtn: {
        flex: 1,
        backgroundColor: TEAL_SOFT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    scanHistoryText: { color: TEAL, fontSize: 12, fontWeight: '700' },
    resumeBtn: {
        flex: 1,
        backgroundColor: SUCCESS,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    resumeBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

    qrCard: { backgroundColor: TEAL, borderRadius: 20, padding: 20, marginTop: 4, shadowColor: TEAL_SHADOW, shadowOpacity: 0.25, shadowRadius: 14, elevation: 5 },
    qrCardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    qrIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: TEAL_SOFT, justifyContent: 'center', alignItems: 'center' },
    qrTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
    qrSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 17 },
    scanBtn: { backgroundColor: GOLD, marginTop: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
    scanBtnText: { fontSize: 14, fontWeight: '700', color: GOLD_TEXT },

    divRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
    divLine: { flex: 1, height: 1, backgroundColor: BORDER },
    divText: { fontSize: 10, fontWeight: '700', color: PLACEHOLDER, letterSpacing: 0.7 },

    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: INK },
    countLabel: { fontSize: 11, color: MUTED, fontWeight: '500' },

    emptyBrands: { alignItems: 'center', gap: 10, paddingVertical: 20 },
    emptyText: { fontSize: 13, color: '#9CA3AF' },
    retryBtn: { backgroundColor: TEAL_SOFT, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
    retryText: { color: TEAL, fontWeight: '700', fontSize: 12 },

    brandRow: { gap: 12, paddingRight: 4, paddingBottom: 4 },
    brandCard: { width: 150, borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden', borderWidth: 1.5, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    brandTop: { height: 80, justifyContent: 'center', alignItems: 'center' },
    checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    brandBody: { paddingHorizontal: 12, paddingVertical: 10 },
    brandName: { fontSize: 13, fontWeight: '700', color: INK },
    brandDesc: { fontSize: 11, color: MUTED, marginTop: 2 },

    finder: { marginTop: 26, paddingTop: 22, borderTopWidth: 1, borderTopColor: BORDER, borderStyle: 'dashed' },
    finderSub: { fontSize: 11, color: MUTED, marginTop: 2 },
    clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    clearText: { fontSize: 11, fontWeight: '600', color: MUTED },

    tabs: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 3, marginBottom: 14 },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
    tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 13, fontWeight: '600', color: MUTED },
    tabTextActive: { color: TEAL, fontWeight: '700' },

    input: { height: 50, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, fontSize: 14, color: INK, borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
    searchBtn: { backgroundColor: TEAL, height: 48, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    btnOff: { opacity: 0.5 },
    searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    resultsLabel: { fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 20, marginBottom: 12 },
    storeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    storeLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: TEAL_SOFT, justifyContent: 'center', alignItems: 'center' },
    storeLogoText: { fontSize: 18, fontWeight: '800', color: TEAL },
    storeName: { fontSize: 14, fontWeight: '700', color: INK },
    storeAddr: { fontSize: 12, color: MUTED, marginTop: 2 },
    storeMeta: { fontSize: 11, color: PLACEHOLDER, marginTop: 2 },
    enterBtn: { backgroundColor: TEAL, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
    enterText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    noResults: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#F3F4F6', gap: 8 },
    noResultsTitle: { fontSize: 15, fontWeight: '700', color: INK },
    noResultsSub: { fontSize: 12, color: MUTED, lineHeight: 18, textAlign: 'center' },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.65)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    dialogCard: { width: '100%', maxWidth: 330, backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 18, elevation: 10 },
    dialogIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: RED_SOFT, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    dialogTitle: { fontSize: 17, fontWeight: '800', color: INK, marginBottom: 6, textAlign: 'center' },
    dialogBody: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 22 },
    dialogActions: { flexDirection: 'row', gap: 10, width: '100%' },
    dialogCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    dialogCancelText: { fontSize: 13, fontWeight: '700', color: MUTED },
    dialogDestructBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
    dialogDestructText: { fontSize: 13, fontWeight: '700', color: '#fff' },

    qrModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, zIndex: 10 },
    qrClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    qrModalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    qrOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    qrFrame: { width: 220, height: 220, position: 'relative' },
    corner: C,
    cTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
    cTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
    cBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
    cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
    qrHint: { color: '#E5E7EB', fontSize: 13, fontWeight: '500', marginTop: 24 },
});