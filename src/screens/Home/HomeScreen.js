import React, { useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, StatusBar,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';

export default function HomeScreen({ navigation }) {
    const { user, session } = useAuth();

    // Session hai to seedha StoreHome pe
    useEffect(() => {
        if (session) navigation.navigate('StoreHome');
    }, [session]);

    if (session) return null;

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // User ke naam ka pehla letter avatar ke liye
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5FAFA" />

            {/* Header with Greeting + Profile Avatar Button */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{greeting()}</Text>
                    <Text style={styles.name}>{user?.name || 'Shopper'}</Text>
                </View>

                {/* Profile Avatar Icon (Clickable) */}
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                >
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{userInitial}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* CTA Banner */}
                <View style={styles.ctaCard}>
                    <Text style={styles.ctaEmoji}>🛒</Text>
                    <Text style={styles.ctaTitle}>Ready to shop?</Text>
                    <Text style={styles.ctaText}>
                        Pick a brand, find your nearest store, scan products and pay — no queue needed.
                    </Text>
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={() => navigation.navigate('BrandSelect')}
                        activeOpacity={0.85}
                    >
                        <Icon name="tag" size={16} color="#412402" />
                        <Text style={styles.ctaBtnText}>Select Brand</Text>
                    </TouchableOpacity>
                </View>

                {/* How It Works */}
                <Text style={styles.sectionTitle}>How It Works</Text>
                <View style={styles.stepsCard}>
                    {[
                        { n: '1', icon: '🏬', title: 'Pick Brand', sub: 'DMart, Reliance, BigBazaar...' },
                        { n: '2', icon: '📍', title: 'Find Store', sub: 'By pincode, state, district or QR' },
                        { n: '3', icon: '📷', title: 'Scan Items', sub: 'Point camera at barcode' },
                        { n: '4', icon: '💳', title: 'Pay & Go', sub: 'Pay online, show QR at exit' },
                    ].map(({ n, icon, title, sub }) => (
                        <View key={n} style={styles.stepRow}>
                            <View style={styles.stepNum}><Text style={styles.stepN}>{n}</Text></View>
                            <Text style={styles.stepIcon}>{icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>{title}</Text>
                                <Text style={styles.stepSub}>{sub}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Quick Links Section */}
                <Text style={styles.sectionTitle}>Account & Orders</Text>

                {/* Past Orders / History */}
                <TouchableOpacity
                    style={styles.histRow}
                    onPress={() => navigation.navigate('History')}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconBadge}>
                        <Icon name="clock" size={16} color="#4E989E" />
                    </View>
                    <Text style={styles.histText}>View past orders</Text>
                    <Icon name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                {/* My Profile Shortcut */}
                <TouchableOpacity
                    style={[styles.histRow, { marginTop: 10 }]}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
                        <Icon name="user" size={16} color="#D97706" />
                    </View>
                    <Text style={styles.histText}>My Profile & Details</Text>
                    <Icon name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F5FAFA' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 20,
        backgroundColor: '#F5FAFA',
    },
    greeting: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 2 },
    name: { fontSize: 24, fontWeight: '800', color: '#111827' },
    profileBtn: {
        padding: 2,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4E989E',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#36696D',
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    ctaCard: {
        backgroundColor: '#4E989E',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 28,
        shadowColor: '#36696D',
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 5,
    },
    ctaEmoji: { fontSize: 52, marginBottom: 12 },
    ctaTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
    ctaText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    ctaBtn: {
        backgroundColor: '#F7B32B',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 13,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    ctaBtnText: { color: '#412402', fontWeight: '700', fontSize: 15 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    stepsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        gap: 16,
        marginBottom: 20,
    },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepNum: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#EAF5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepN: { fontSize: 13, fontWeight: '800', color: '#4E989E' },
    stepIcon: { fontSize: 20 },
    stepTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
    stepSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
    histRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#EAF5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    histText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600' },
});