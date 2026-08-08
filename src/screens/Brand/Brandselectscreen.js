import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    ActivityIndicator, Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { getBrands } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const COLORS = ['#2563EB','#059669','#D97706','#7C3AED','#DC2626','#0891B2'];

export default function BrandSelectScreen({ navigation }) {
    const { clearSession } = useAuth();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const handleBack = () => {
        Alert.alert('End Session', 'Going back will end your current session.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'End Session',
                style: 'destructive',
                onPress: async () => {
                    await clearSession();
                    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                },
            },
        ]);
    };

    const load = async () => {
        setLoading(true);
        try {
            const res = await getBrands();
            setBrands(res.data || []);
        } catch (e) { Alert.alert('Error', e.message); }
        finally { setLoading(false); }
    };

    const renderItem = ({ item, index }) => {
        const color = COLORS[index % COLORS.length];
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('StoreSelect', { brandId: item.id, brandName: item.name })}
                activeOpacity={0.8}
            >
                <View style={[styles.logo, { backgroundColor: color + '18' }]}>
                    <Text style={[styles.logoText, { color }]}>{item.name?.charAt(0) || '?'}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.description ? <Text style={styles.desc} numberOfLines={1}>{item.description}</Text> : null}
                </View>
                <View style={[styles.arrow, { backgroundColor: color + '18' }]}>
                    <Icon name="chevron-right" size={18} color={color} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.flex}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Icon name="arrow-left" size={20} color="#374151" />
                </TouchableOpacity>

                <View>
                    <Text style={styles.headerTitle}>Choose Brand</Text>
                    <Text style={styles.headerSub}>Select where you'd like to shop</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            {loading
                ? <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
                : brands.length === 0
                    ? <View style={styles.center}>
                        <Icon name="alert-circle" size={40} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No brands available</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={load}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                    : <FlatList
                        data={brands}
                        keyExtractor={i => i.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
    headerSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 14, color: '#9CA3AF' },
    retryBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: '#2563EB', fontWeight: '700' },
    list: { padding: 16, gap: 10 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 14,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    logo: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: '800' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: '#111827' },
    desc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    arrow: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});