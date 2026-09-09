import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, StatusBar, Switch, Modal, ActivityIndicator
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { logout, endSession } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const TEAL_SHADOW = '#36696D';
const BG = '#F5FAFA';
const INK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CARD_BG = '#FFFFFF';
const DANGER = '#EF4444';
const DANGER_SOFT = '#FEE2E2';

export default function ProfileScreen({ navigation }) {
    const { user, logoutUser, session, clearSession } = useAuth();
    const [hideSensitive, setHideSensitive] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Logout Modal State
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Info/Feature Modal State
    const [infoModal, setInfoModal] = useState({
        visible: false,
        title: '',
        icon: 'info',
        content: null,
    });

    const initials = (user?.name || 'S')
        .trim()
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleConfirmLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (session) {
                await endSession();
            }
        } catch (e) {
            console.log('Session termination on logout notice:', e.message);
        } finally {
            if (clearSession) await clearSession();
            try {
                await logout();
            } catch (e) {
                console.log('Logout notice:', e.message);
            } finally {
                setIsLoggingOut(false);
                setLogoutModalVisible(false);
                logoutUser();
            }
        }
    };

    return (
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Icon name="arrow-left" size={20} color={INK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account & Settings</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Profile Identity Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.name}>{user?.name || 'Shopper'}</Text>
                    <Text style={styles.phone}>+91 {user?.phone || 'XXXXXXXXXX'}</Text>
                </View>

                {/* Quick Interactive Actions */}
                <View style={styles.quickRow}>
                    <TouchableOpacity
                        style={styles.quickBox}
                        onPress={() => navigation.navigate('History')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.quickIconBox}>
                            <Icon name="file-text" size={20} color={TEAL} />
                        </View>
                        <Text style={styles.quickText}>Invoices</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickBox}
                        onPress={() => setInfoModal({
                            visible: true,
                            title: 'ZeroQ Wallet',
                            icon: 'credit-card',
                            content: (
                                <View style={styles.modalBodyWrap}>
                                    <Text style={styles.walletBalanceTitle}>Available Cash Balance</Text>
                                    <Text style={styles.walletBalanceAmount}>₹0.00</Text>
                                    <Text style={styles.modalDesc}>Wallet funds are automatically adjusted during your counter or self-checkout payments.</Text>
                                </View>
                            )
                        })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.quickIconBox}>
                            <Icon name="credit-card" size={20} color={TEAL} />
                        </View>
                        <Text style={styles.quickText}>My Wallet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickBox}
                        onPress={() => setInfoModal({
                            visible: true,
                            title: 'Store Support',
                            icon: 'message-circle',
                            content: (
                                <View style={styles.modalBodyWrap}>
                                    <Text style={styles.infoHighlight}>Customer Desk Available: 8 AM - 10 PM</Text>
                                    <Text style={styles.modalDesc}>For billing discrepancies, return inquiries, or scanner support, visit the customer counter or email support@zeroq.app.</Text>
                                </View>
                            )
                        })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.quickIconBox}>
                            <Icon name="message-circle" size={20} color={TEAL} />
                        </View>
                        <Text style={styles.quickText}>Help Desk</Text>
                    </TouchableOpacity>
                </View>

                {/* Preferences */}
                <Text style={styles.sectionTitle}>Preferences</Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                        <Icon name={darkMode ? 'moon' : 'sun'} size={18} color={INK} />
                        <Text style={styles.settingLabel}>Display Mode</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.appearancePill}
                        onPress={() => setDarkMode(!darkMode)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.appearancePillText}>{darkMode ? 'DARK' : 'LIGHT'}</Text>
                        <Icon name="refresh-cw" size={12} color={TEAL} />
                    </TouchableOpacity>
                </View>

                <View style={styles.toggleCard}>
                    <View style={styles.toggleIconBox}>
                        <Icon name="eye-off" size={18} color={TEAL} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleTitle}>Hide sensitive items</Text>
                        <Text style={styles.toggleSub}>
                            Restricted and age-sensitive products remain hidden from browsing cards
                        </Text>
                    </View>
                    <Switch
                        value={hideSensitive}
                        onValueChange={setHideSensitive}
                        trackColor={{ false: '#D1D5DB', true: TEAL }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                {/* Account Details & Utilities */}
                <Text style={styles.sectionTitle}>Your Information</Text>
                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => setInfoModal({
                            visible: true,
                            title: 'Registered Addresses',
                            icon: 'book-open',
                            content: (
                                <View style={styles.modalBodyWrap}>
                                    <Text style={styles.infoHighlight}>Default Billing Address</Text>
                                    <Text style={styles.modalDesc}>Standard retail billing is tied to your verified phone number (+91 {user?.phone || 'XXXXXXXXXX'}).</Text>
                                </View>
                            )
                        })}
                    >
                        <View style={styles.menuIconBox}><Icon name="book-open" size={18} color={TEAL} /></View>
                        <Text style={styles.menuText}>Address Book</Text>
                        <Icon name="chevron-right" size={18} color={MUTED} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuRow, { borderBottomWidth: 0 }]}
                        onPress={() => setInfoModal({
                            visible: true,
                            title: 'E-Gift Cards',
                            icon: 'gift',
                            content: (
                                <View style={styles.modalBodyWrap}>
                                    <Text style={styles.infoHighlight}>No Active Vouchers</Text>
                                    <Text style={styles.modalDesc}>Gift cards issued by supermarket brands can be redeemed at the checkout counter.</Text>
                                </View>
                            )
                        })}
                    >
                        <View style={styles.menuIconBox}><Icon name="gift" size={18} color={TEAL} /></View>
                        <Text style={styles.menuText}>E-Gift Cards</Text>
                        <Icon name="chevron-right" size={18} color={MUTED} />
                    </TouchableOpacity>
                </View>

                {/* Legal & Policies */}
                <Text style={styles.sectionTitle}>Legal</Text>
                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={[styles.menuRow, { borderBottomWidth: 0 }]}
                        onPress={() => setInfoModal({
                            visible: true,
                            title: 'Terms & Privacy',
                            icon: 'shield',
                            content: (
                                <View style={styles.modalBodyWrap}>
                                    <Text style={styles.infoHighlight}>ZeroQ Privacy Compliance</Text>
                                    <Text style={styles.modalDesc}>Your in-store scanning logs and cart data are encrypted and purged after order settlement.</Text>
                                </View>
                            )
                        })}
                    >
                        <View style={styles.menuIconBox}><Icon name="shield" size={18} color={TEAL} /></View>
                        <Text style={styles.menuText}>Terms &amp; Privacy Policy</Text>
                        <Icon name="chevron-right" size={18} color={MUTED} />
                    </TouchableOpacity>
                </View>

                {/* Professional Logout Button */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => setLogoutModalVisible(true)}
                    activeOpacity={0.85}
                >
                    <Icon name="log-out" size={18} color={DANGER} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Custom Feature Dialog Modal */}
            <Modal
                visible={infoModal.visible}
                transparent
                animationType="fade"
                onRequestClose={() => setInfoModal(prev => ({ ...prev, visible: false }))}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.dialogCard}>
                        <View style={styles.dialogIconBox}>
                            <Icon name={infoModal.icon} size={22} color={TEAL} />
                        </View>
                        <Text style={styles.dialogTitle}>{infoModal.title}</Text>
                        {infoModal.content}
                        <TouchableOpacity
                            style={styles.dialogPrimaryBtn}
                            onPress={() => setInfoModal(prev => ({ ...prev, visible: false }))}
                        >
                            <Text style={styles.dialogPrimaryText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Professional Logout Confirmation Modal */}
            <Modal
                visible={logoutModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => !isLoggingOut && setLogoutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.logoutCard}>
                        <View style={styles.logoutIconBox}>
                            <Icon name="alert-triangle" size={24} color={DANGER} />
                        </View>
                        <Text style={styles.logoutModalTitle}>Confirm Sign Out</Text>
                        <Text style={styles.logoutModalDesc}>
                            {session
                                ? `You have an ongoing session at ${session.storeName}. Signing out will close your active shopping session.`
                                : 'Are you sure you want to sign out of your ZeroQ account?'}
                        </Text>

                        <View style={styles.modalActionsRow}>
                            <TouchableOpacity
                                style={styles.modalSecondaryBtn}
                                onPress={() => setLogoutModalVisible(false)}
                                disabled={isLoggingOut}
                            >
                                <Text style={styles.modalSecondaryText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalDestructiveBtn}
                                onPress={handleConfirmLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalDestructiveText}>Sign Out</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
        backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: INK },

    scroll: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 },

    profileCard: {
        backgroundColor: TEAL, borderRadius: 20, padding: 22,
        alignItems: 'center', marginBottom: 18,
        shadowColor: TEAL_SHADOW, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4,
    },
    avatar: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    },
    avatarText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    name: { fontSize: 19, fontWeight: '800', color: '#FFFFFF' },
    phone: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },

    quickRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    quickBox: {
        flex: 1, backgroundColor: CARD_BG, borderRadius: 14, paddingVertical: 14,
        alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: BORDER,
    },
    quickIconBox: {
        width: 38, height: 38, borderRadius: 10, backgroundColor: TEAL_SOFT,
        justifyContent: 'center', alignItems: 'center',
    },
    quickText: { fontSize: 12, fontWeight: '700', color: INK },

    sectionTitle: { fontSize: 12, fontWeight: '800', color: MUTED, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7 },

    settingRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: CARD_BG, borderRadius: 14, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: BORDER,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    settingLabel: { fontSize: 14, fontWeight: '700', color: INK },
    appearancePill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: TEAL_SOFT, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    },
    appearancePillText: { fontSize: 11, fontWeight: '800', color: TEAL },

    toggleCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: CARD_BG, borderRadius: 14, padding: 14, marginBottom: 20,
        borderWidth: 1, borderColor: BORDER,
    },
    toggleIconBox: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: TEAL_SOFT,
        justifyContent: 'center', alignItems: 'center',
    },
    toggleTitle: { fontSize: 13, fontWeight: '700', color: INK },
    toggleSub: { fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 16 },

    menuCard: {
        backgroundColor: CARD_BG, borderRadius: 16, marginBottom: 18,
        borderWidth: 1, borderColor: BORDER,
    },
    menuRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 14, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    menuIconBox: {
        width: 34, height: 34, borderRadius: 9, backgroundColor: TEAL_SOFT,
        justifyContent: 'center', alignItems: 'center',
    },
    menuText: { flex: 1, fontSize: 13, fontWeight: '700', color: INK },

    logoutBtn: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
        backgroundColor: DANGER_SOFT, borderRadius: 14, paddingVertical: 13,
        borderWidth: 1, borderColor: '#FECACA', marginTop: 6,
    },
    logoutText: { color: DANGER, fontSize: 14, fontWeight: '800' },

    // Modals
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.65)',
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
    },
    dialogCard: {
        width: '100%', maxWidth: 330, backgroundColor: CARD_BG,
        borderRadius: 20, padding: 22, alignItems: 'center',
    },
    dialogIconBox: {
        width: 46, height: 46, borderRadius: 14, backgroundColor: TEAL_SOFT,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    dialogTitle: { fontSize: 16, fontWeight: '800', color: INK, marginBottom: 8 },
    modalBodyWrap: { alignItems: 'center', marginVertical: 8 },
    walletBalanceTitle: { fontSize: 12, color: MUTED, fontWeight: '600' },
    walletBalanceAmount: { fontSize: 26, fontWeight: '800', color: INK, marginVertical: 4 },
    infoHighlight: { fontSize: 13, fontWeight: '700', color: TEAL, marginBottom: 4 },
    modalDesc: { fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 18 },
    dialogPrimaryBtn: {
        width: '100%', backgroundColor: TEAL, borderRadius: 12,
        paddingVertical: 11, alignItems: 'center', marginTop: 16,
    },
    dialogPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

    logoutCard: {
        width: '100%', maxWidth: 330, backgroundColor: CARD_BG,
        borderRadius: 20, padding: 22, alignItems: 'center',
    },
    logoutIconBox: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: DANGER_SOFT,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    logoutModalTitle: { fontSize: 17, fontWeight: '800', color: INK, marginBottom: 6 },
    logoutModalDesc: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    modalActionsRow: { flexDirection: 'row', gap: 10, width: '100%' },
    modalSecondaryBtn: {
        flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12,
        paddingVertical: 12, alignItems: 'center',
    },
    modalSecondaryText: { fontSize: 13, fontWeight: '700', color: MUTED },
    modalDestructiveBtn: {
        flex: 1, backgroundColor: DANGER, borderRadius: 12,
        paddingVertical: 12, alignItems: 'center',
    },
    modalDestructiveText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});