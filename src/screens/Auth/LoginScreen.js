import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { sendOtp } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [name,  setName]  = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim().length >= 2 && /^[6-9]\d{9}$/.test(phone.trim());

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await sendOtp(phone.trim(), name.trim());
      navigation.navigate('Otp', {
        phone: phone.trim(),
        expirySeconds: res.data?.expirySeconds || 120,
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>ZQ</Text>
            </View>
            <Text style={styles.logoTitle}>ZeroQ</Text>
            <Text style={styles.logoSub}>Shop smarter. Skip the queue.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardSub}>Enter your details to get started</Text>

            <Text style={styles.label}>Full Name <Text style={styles.req}>*</Text></Text>
            <View style={[styles.inputWrap, name.trim() && styles.inputActive]}>
              <Icon name="user" size={16} color={name.trim() ? '#2563EB' : '#9CA3AF'} />
              <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
              />
            </View>

            <Text style={styles.label}>Mobile Number <Text style={styles.req}>*</Text></Text>
            <View style={[styles.inputWrap, phone.trim() && styles.inputActive]}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>🇮🇳 +91</Text>
              </View>
              <View style={styles.divider} />
              <TextInput
                  style={styles.input}
                  placeholder="10-digit number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
              />
            </View>

            <TouchableOpacity
                style={[styles.btn, (!canSubmit || loading) && styles.btnOff]}
                onPress={handleSend}
                disabled={!canSubmit || loading}
            >
              {loading
                  ? <ActivityIndicator color="#fff" />
                  : <><Icon name="send" size={16} color="#fff" /><Text style={styles.btnText}>Send OTP</Text></>
              }
            </TouchableOpacity>

            <Text style={styles.note}>We'll send a 6-digit OTP to verify your number</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoText: { fontSize: 26, fontWeight: '900', color: '#fff' },
  logoTitle: { fontSize: 28, fontWeight: '800', color: '#1E3A8A' },
  logoSub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  req: { color: '#EF4444' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 16, height: 50,
  },
  inputActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  input: { flex: 1, fontSize: 15, color: '#111827', height: 50 },
  prefix: { paddingRight: 4 },
  prefixText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  divider: { width: 1, height: 22, backgroundColor: '#E5E7EB' },
  btn: {
    backgroundColor: '#2563EB', height: 52, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 4,
  },
  btnOff: { opacity: 0.45 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 16 },
});