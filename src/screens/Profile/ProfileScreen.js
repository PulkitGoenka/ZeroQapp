import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, StatusBar, Modal, ActivityIndicator
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { logout, endSession } from '../../services/api';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const TEAL_SHADOW = '#36696D';
const DANGER = '#EF4444';
const DANGER_SOFT = '#FEE2E2';

export default function ProfileScreen({ navigation }) {
    const { user, logoutUser, session, clearSession } = useAuth();
    const BG      = '#F5FAFA';
    const INK     = '#111827';
    const MUTED   = '#6B7280';
    const BORDER  = '#E5E7EB';
    const CARD_BG = '#FFFFFF';

    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [infoModal, setInfoModal] = useState({ visible: false, title: '', icon: 'info', content: null });

    const initials = (user?.name || 'S').trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const handleConfirmLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (session) await endSession();
        } catch (e) {
            console.log('Session termination notice:', e.message);
        } finally {
            if (clearSession) await clearSession();
            try { await logout(); } catch (e) { console.log('Logout notice:', e.message); }
            finally {
                setIsLoggingOut(false);
                setLogoutModalVisible(false);
                logoutUser();
            }
        }
    };

    return (
        <SafeAreaView style={[styles.flex, { backgroundColor: BG }]} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: BG, borderBottomColor: BORDER }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Icon name="arrow-left" size={20} color={INK} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: INK }]}>Account & Settings</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.name}>{user?.name || 'Shopper'}</Text>
                    <Text style={styles.phone}>+91 {user?.phone || 'XXXXXXXXXX'}</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickRow}>
                    <TouchableOpacity style={[styles.quickBox, { backgroundColor: CARD_BG, borderColor: BORDER }]} onPress={() => navigation.navigate('History')} activeOpacity={0.7}>
                        <View style={styles.quickIconBox}><Icon name="file-text" size={20} color={TEAL} /></View>
                        <Text style={[styles.quickText, { color: INK }]}>Invoices</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickBox, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                        onPress={() => setInfoModal({ visible: true, title: 'itself Wallet', icon: 'credit-card', content: (
                            <View style={styles.modalBodyWrap}>
                                <Text style={styles.walletBalanceTitle}>Available Cash Balance</Text>
                                <Text style={styles.walletBalanceAmount}>₹0.00</Text>
                                <Text style={styles.modalDesc}>Wallet funds are automatically adjusted during your payments.</Text>
                            </View>
                        )})} activeOpacity={0.7}>
                        <View style={styles.quickIconBox}><Icon name="credit-card" size={20} color={TEAL} /></View>
                        <Text style={[styles.quickText, { color: INK }]}>My Wallet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickBox, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                        onPress={() => setInfoModal({ visible: true, title: 'Store Support', icon: 'message-circle', content: (
                            <View style={styles.modalBodyWrap}>
                                <Text style={styles.infoHighlight}>Customer Desk: 8 AM - 10 PM</Text>
                                <Text style={styles.modalDesc}>For billing issues or scanner support, visit the customer counter or email support@itself.app.</Text>
                            </View>
                        )})} activeOpacity={0.7}>
                        <View style={styles.quickIconBox}><Icon name="message-circle" size={20} color={TEAL} /></View>
                        <Text style={[styles.quickText, { color: INK }]}>Help Desk</Text>
                    </TouchableOpacity>
                </View>



                {/* Your Information */}
                <Text style={[styles.sectionTitle, { color: MUTED }]}>Your Information</Text>
                <View style={[styles.menuCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                    <TouchableOpacity style={[styles.menuRow, { borderBottomColor: '#F3F4F6' }]}
                        onPress={() => setInfoModal({ visible: true, title: 'Registered Addresses', icon: 'book-open', content: (
                            <View style={styles.modalBodyWrap}>
                                <Text style={styles.infoHighlight}>Default Billing Address</Text>
                                <Text style={styles.modalDesc}>Billing is tied to your verified phone (+91 {user?.phone || 'XXXXXXXXXX'}).</Text>
                            </View>
                        )})}>
                        <View style={styles.menuIconBox}><Icon name="book-open" size={18} color={TEAL} /></View>
                        <Text style={[styles.menuText, { color: INK }]}>Address Book</Text>
                        <Icon name="chevron-right" size={18} color={MUTED} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]}
                        onPress={() => setInfoModal({ visible: true, title: 'E-Gift Cards', icon: 'gift', content: (
                            <View style={styles.modalBodyWrap}>
                                <Text style={styles.infoHighlight}>No Active Vouchers</Text>
                                <Text style={styles.modalDesc}>Gift cards can be redeemed at the checkout counter.</Text>
                            </View>
                        )})}>
                        <View style={styles.menuIconBox}><Icon name="gift" size={18} color={TEAL} /></View>
                        <Text style={[styles.menuText, { color: INK }]}>E-Gift Cards</Text>
                        <Icon name="chevron-right" size={18} color={MUTED} />
                    </TouchableOpacity>
                </View>

                {/* Legal */}
                <Text style={[styles.sectionTitle, { color: MUTED }]}>Legal</Text>
                <View style={[styles.menuCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                    <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]}
                        onPress={() => setInfoModal({ visible: true, title: 'Terms & Privacy', icon: 'shield', content: (
                            <View style={styles.modalBodyWrap}>
                                <Text style={styles.infoHighlight}>itself Privacy Compliance</Text>
                                <Text style={styles.modalDesc}>Your scanning logs and cart data are encrypted and purged after order settlement.</Text>
                            </View>
                        )})}>
                        <View style={styles.menuIconBox}><Icon name="shield" size={18} color={TEAL} /></View>
                        <Text style={[styles.menuText, { color: INK }]}>Terms & Privacy Policy</Text>
                        <Icon name="chevron-right" size={18} color={MUTED} />
                    </TouchableOpacity>
                </View>

                {/* Sign Out */}
                <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutModalVisible(true)} activeOpacity={0.85}>
                    <Icon name="log-out" size={18} color={DANGER} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Feature Dialog */}
            <Modal visible={infoModal.visible} transparent animationType="fade" onRequestClose={() => setInfoModal(p => ({ ...p, visible: false }))}>
                <View style={styles.modalOverlay}>
                    <View style={styles.dialogCard}>
                        <View style={styles.dialogIconBox}><Icon name={infoModal.icon} size={22} color={TEAL} /></View>
                        <Text style={styles.dialogTitle}>{infoModal.title}</Text>
                        {infoModal.content}
                        <TouchableOpacity style={styles.dialogPrimaryBtn} onPress={() => setInfoModal(p => ({ ...p, visible: false }))}>
                            <Text style={styles.dialogPrimaryText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Logout Confirmation */}
            <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => !isLoggingOut && setLogoutModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.logoutCard}>
                        <View style={styles.logoutIconBox}><Icon name="alert-triangle" size={24} color={DANGER} /></View>
                        <Text style={styles.logoutModalTitle}>Confirm Sign Out</Text>
                        <Text style={styles.logoutModalDesc}>
                            {session ? `You have an ongoing session at ${session.storeName}. Signing out will close it.` : 'Are you sure you want to sign out?'}
                        </Text>
                        <View style={styles.modalActionsRow}>
                            <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setLogoutModalVisible(false)} disabled={isLoggingOut}>
                                <Text style={styles.modalSecondaryText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalDestructiveBtn} onPress={handleConfirmLogout} disabled={isLoggingOut}>
                                {isLoggingOut ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalDestructiveText}>Sign Out</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, borderBottomWidth: 1 },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'Manrope_700Bold', fontSize: 17, letterSpacing: -0.5 },
    scroll: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 },

    profileCard: {
        backgroundColor: TEAL, borderRadius: 20, padding: 22,
        alignItems: 'center', marginBottom: 18,
        shadowColor: TEAL_SHADOW, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4,
    },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 22, color: '#FFFFFF' },
    name: { fontFamily: 'Manrope_700Bold', fontSize: 19, letterSpacing: -0.6, color: '#FFFFFF' },
    phone: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

    quickRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    quickBox: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 6, borderWidth: 1 },
    quickIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: TEAL_SOFT, justifyContent: 'center', alignItems: 'center' },
    quickText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12 },

    sectionTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.6 },

    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    settingLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },
    appearancePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    appearancePillText: { fontSize: 12, fontWeight: '800' },

    menuCard: { borderRadius: 16, marginBottom: 18, borderWidth: 1 },
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1 },
    menuIconBox: { width: 34, height: 34, borderRadius: 9, backgroundColor: TEAL_SOFT, justifyContent: 'center', alignItems: 'center' },
    menuText: { flex: 1, fontFamily: 'DMSans_600SemiBold', fontSize: 13 },

    logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: DANGER_SOFT, borderRadius: 14, paddingVertical: 13, borderWidth: 1, borderColor: '#FECACA', marginTop: 6 },
    logoutText: { fontFamily: 'DMSans_700Bold', color: DANGER, fontSize: 14, letterSpacing: 0.2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.65)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    dialogCard: { width: '100%', maxWidth: 330, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, alignItems: 'center' },
    dialogIconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: TEAL_SOFT, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    dialogTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
    modalBodyWrap: { alignItems: 'center', marginVertical: 8 },
    walletBalanceTitle: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    walletBalanceAmount: { fontSize: 26, fontWeight: '800', color: '#111827', marginVertical: 4 },
    infoHighlight: { fontSize: 13, fontWeight: '700', color: TEAL, marginBottom: 4 },
    modalDesc: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
    dialogPrimaryBtn: { width: '100%', backgroundColor: TEAL, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 16 },
    dialogPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

    logoutCard: { width: '100%', maxWidth: 330, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, alignItems: 'center' },
    logoutIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: DANGER_SOFT, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    logoutModalTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 6 },
    logoutModalDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    modalActionsRow: { flexDirection: 'row', gap: 10, width: '100%' },
    modalSecondaryBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    modalSecondaryText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
    modalDestructiveBtn: { flex: 1, backgroundColor: DANGER, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    modalDestructiveText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});