import React, { useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, StatusBar,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { logout } from '../../services/api';

export default function HomeScreen({ navigation }) {
    const { user, session, logoutUser } = useAuth();

    // Session hai to seedha StoreHome pe
    useEffect(() => {
        if (session) navigation.navigate('StoreHome');
    }, [session]);

    if (session) return null;

    const handleLogout = () => Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
                try { await logout(); } catch {}
                logoutUser();
            }},
    ]);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{greeting()},</Text>
                    <Text style={styles.name}>{user?.name || 'Shopper'} 👋</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Icon name="log-out" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* CTA */}
                <View style={styles.ctaCard}>
                    <Text style={styles.ctaEmoji}>🛒</Text>
                    <Text style={styles.ctaTitle}>Ready to shop?</Text>
                    <Text style={styles.ctaText}>
                        Pick a brand, find your nearest store, scan products and pay — no queue needed.
                    </Text>
                    <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('BrandSelect')}>
                        <Icon name="tag" size={16} color="#fff" />
                        <Text style={styles.ctaBtnText}>Select Brand</Text>
                    </TouchableOpacity>
                </View>

                {/* How it works */}
                <Text style={styles.sectionTitle}>How It Works</Text>
                <View style={styles.stepsCard}>
                    {[
                        { n:'1', icon:'🏬', title:'Pick Brand',  sub:'DMart, Reliance, BigBazaar...' },
                        { n:'2', icon:'📍', title:'Find Store',  sub:'By pincode, state, district or QR' },
                        { n:'3', icon:'📷', title:'Scan Items',  sub:'Point camera at barcode' },
                        { n:'4', icon:'💳', title:'Pay & Go',    sub:'Pay online, show QR at exit' },
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

                {/* History shortcut */}
                <TouchableOpacity style={styles.histRow} onPress={() => navigation.navigate('History')}>
                    <Icon name="clock" size={16} color="#6B7280" />
                    <Text style={styles.histText}>View past orders</Text>
                    <Icon name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F0F4FF' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20, backgroundColor: '#F0F4FF',
    },
    greeting: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    name: { fontSize: 22, fontWeight: '800', color: '#111827' },
    logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    ctaCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 24,
        alignItems: 'center', marginBottom: 28,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    ctaEmoji: { fontSize: 52, marginBottom: 12 },
    ctaTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
    ctaText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    ctaBtn: {
        backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center',
        gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14,
        shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
    },
    ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    stepsCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 18,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        gap: 16, marginBottom: 16,
    },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepNum: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
    stepN: { fontSize: 13, fontWeight: '800', color: '#2563EB' },
    stepIcon: { fontSize: 20 },
    stepTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
    stepSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
    histRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fff', borderRadius: 12, padding: 14,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    histText: { flex: 1, fontSize: 13, color: '#6B7280', fontWeight: '500' },
});