import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, StatusBar, Switch,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { logout } from '../../services/api';

export default function ProfileScreen({ navigation }) {
    const { user, logoutUser } = useAuth();
    const [hideSensitive, setHideSensitive] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const initials = (user?.name || 'S')
        .trim()
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    // Safe navigation handler taaki unbuilt screens par app crash na ho
    const handleNavigate = (screenName, title) => {
        // Agar screen navigator me registered hai to navigate karega
        try {
            navigation.navigate(screenName);
        } catch {
            Alert.alert(title, 'This feature is coming soon!');
        }
    };

    const handleLogout = () => Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
                try { await logout(); } catch {}
                logoutUser();
            },
        },
    ]);

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5FAFA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={20} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
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
                    <TouchableOpacity
                        style={styles.quickBox}
                        onPress={() => navigation.navigate('History')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.quickIconBox}>
                            <Icon name="shopping-bag" size={20} color="#4E989E" />
                        </View>
                        <Text style={styles.quickText}>Your Orders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickBox}
                        onPress={() => handleNavigate('Wallet', 'My Wallet')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.quickIconBox}>
                            <Icon name="credit-card" size={20} color="#4E989E" />
                        </View>
                        <Text style={styles.quickText}>My Wallet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickBox}
                        onPress={() => handleNavigate('Support', 'Help & Support')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.quickIconBox}>
                            <Icon name="message-circle" size={20} color="#4E989E" />
                        </View>
                        <Text style={styles.quickText}>Need help?</Text>
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <Text style={styles.sectionTitle}>Preferences</Text>

                {/* Appearance */}
                <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                        <Icon name={darkMode ? 'moon' : 'sun'} size={18} color="#374151" />
                        <Text style={styles.settingLabel}>Appearance</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.appearancePill}
                        onPress={() => {
                            setDarkMode(!darkMode);
                            Alert.alert('Theme', `${!darkMode ? 'Dark' : 'Light'} theme mode toggled.`);
                        }}
                    >
                        <Text style={styles.appearancePillText}>{darkMode ? 'DARK' : 'LIGHT'}</Text>
                        <Icon name="chevron-down" size={14} color="#4E989E" />
                    </TouchableOpacity>
                </View>

                {/* Hide Sensitive Items Toggle */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleIconBox}>
                        <Icon name="eye-off" size={18} color="#4E989E" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleTitle}>Hide sensitive items</Text>
                        <Text style={styles.toggleSub}>
                            Sexual wellness, tobacco and other sensitive items will be hidden during store browsing
                        </Text>
                    </View>
                    <Switch
                        value={hideSensitive}
                        onValueChange={setHideSensitive}
                        trackColor={{ false: '#D1D5DB', true: '#4E989E' }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Your Information */}
                <Text style={styles.sectionTitle}>Your Information</Text>
                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => handleNavigate('AddressBook', 'Address Book')}
                    >
                        <View style={styles.menuIconBox}><Icon name="book-open" size={18} color="#4E989E" /></View>
                        <Text style={styles.menuText}>Address Book</Text>
                        <Icon name="chevron-right" size={18} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => handleNavigate('Wishlist', 'Your Wishlist')}
                    >
                        <View style={styles.menuIconBox}><Icon name="heart" size={18} color="#4E989E" /></View>
                        <Text style={styles.menuText}>Your Wishlist</Text>
                        <Icon name="chevron-right" size={18} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => handleNavigate('GSTDetails', 'GST Details')}
                    >
                        <View style={styles.menuIconBox}><Icon name="file-text" size={18} color="#4E989E" /></View>
                        <Text style={styles.menuText}>GST Details</Text>
                        <Icon name="chevron-right" size={18} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuRow, { borderBottomWidth: 0 }]}
                        onPress={() => handleNavigate('GiftCards', 'E-Gift Cards')}
                    >
                        <View style={styles.menuIconBox}><Icon name="gift" size={18} color="#4E989E" /></View>
                        <Text style={styles.menuText}>E-Gift Cards</Text>
                        <Icon name="chevron-right" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Support */}
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => handleNavigate('Support', 'Help & Support')}
                    >
                        <View style={styles.menuIconBox}><Icon name="help-circle" size={18} color="#4E989E" /></View>
                        <Text style={styles.menuText}>Help &amp; Support</Text>
                        <Icon name="chevron-right" size={18} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuRow, { borderBottomWidth: 0 }]}
                        onPress={() => handleNavigate('Terms', 'Terms & Privacy Policy')}
                    >
                        <View style={styles.menuIconBox}><Icon name="shield" size={18} color="#4E989E" /></View>
                        <Text style={styles.menuText}>Terms &amp; Privacy Policy</Text>
                        <Icon name="chevron-right" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <Icon name="log-out" size={18} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F5FAFA' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
        backgroundColor: '#F5FAFA', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111827', marginRight: 36 },

    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

    profileCard: {
        backgroundColor: '#4E989E', borderRadius: 20, padding: 24,
        alignItems: 'center', marginBottom: 20,
        shadowColor: '#36696D', shadowOpacity: 0.25, shadowRadius: 14, elevation: 5,
    },
    avatar: {
        width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
    name: { fontSize: 20, fontWeight: '800', color: '#fff' },
    phone: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

    quickRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    quickBox: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16,
        alignItems: 'center', gap: 8,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    quickIconBox: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#EAF5F5',
        justifyContent: 'center', alignItems: 'center',
    },
    quickText: { fontSize: 12, fontWeight: '600', color: '#111827', textAlign: 'center' },

    settingRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    settingLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
    appearancePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#EAF5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    },
    appearancePillText: { fontSize: 12, fontWeight: '700', color: '#4E989E' },

    toggleCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    toggleIconBox: {
        width: 34, height: 34, borderRadius: 10, backgroundColor: '#EAF5F5',
        justifyContent: 'center', alignItems: 'center', marginTop: 2,
    },
    toggleTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
    toggleSub: { fontSize: 12, color: '#6B7280', marginTop: 3, lineHeight: 17 },

    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    menuCard: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    menuRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 15,
        borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0',
    },
    menuIconBox: {
        width: 34, height: 34, borderRadius: 10, backgroundColor: '#EAF5F5',
        justifyContent: 'center', alignItems: 'center',
    },
    menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },

    logoutBtn: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
        backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 14,
        borderWidth: 1, borderColor: '#FECACA', marginTop: 4,
    },
    logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});