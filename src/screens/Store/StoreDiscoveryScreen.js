import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    ActivityIndicator, Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { getBrands } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const COLORS = ['#4E989E', '#3F7276', '#6BAAAF', '#2E5457', '#5C9FA4', '#457D81'];

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
                activeOpacity={0.85}
            >
                <View style={[styles.cardTop, { backgroundColor: color }]}>
                    <Icon name="shopping-bag" size={24} color="#fff" />
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    {item.description
                        ? <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
                        : <Text style={styles.desc} numberOfLines={1}>Tap to find a store</Text>}
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
                ? <View style={styles.center}><ActivityIndicator size="large" color="#4E989E" /></View>
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
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.list}
                        snapToAlignment="start"
                        decelerationRate="fast"
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
    retryBtn: { backgroundColor: '#EAF5F5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: '#4E989E', fontWeight: '700' },
    // horizontal row, not a vertical column — this is the left/right scroll list
    list: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
    card: {
        width: 150, borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    cardTop: {
        height: 72, justifyContent: 'center', alignItems: 'center',
    },
    cardBody: { paddingHorizontal: 12, paddingVertical: 10 },
    name: { fontSize: 14, fontWeight: '700', color: '#111827' },
    desc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
});