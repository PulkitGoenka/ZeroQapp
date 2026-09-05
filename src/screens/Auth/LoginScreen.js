import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { sendOtp } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
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

          {/* Logo Section (Correct 3-level path ../../../assets/Logo.jpg) */}
          <View style={styles.logoWrap}>
            <Image
                source={require('../../../assets/Logo.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
            />
            <Text style={styles.logoTitle}>ITSELF</Text>
            <Text style={styles.logoSub}>
              SCAN . PAY <Text style={styles.subAccent}>&amp; GO</Text>
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardSub}>Enter your details to get started</Text>

            <Text style={styles.label}>Full Name <Text style={styles.req}>*</Text></Text>
            <View style={[styles.inputWrap, name.trim() && styles.inputActive]}>
              <Icon name="user" size={16} color={name.trim() ? '#4D8E94' : '#9CA3AF'} />
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
              {loading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <>
                    <Icon name="send" size={16} color="#fff" />
                    <Text style={styles.btnText}>Send OTP</Text>
                  </>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>We'll send a 6-digit OTP to verify your number</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#69AEB4' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoImage: {
    width: 130,
    height: 70,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.5,
    marginTop: 6,
  },
  logoSub: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  subAccent: { color: '#F7B32B' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  req: { color: '#EF4444' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    height: 50,
  },
  inputActive: { borderColor: '#69AEB4', backgroundColor: '#F0F9FA' },
  input: { flex: 1, fontSize: 15, color: '#111827', height: 50 },
  prefix: { paddingRight: 4 },
  prefixText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  divider: { width: 1, height: 22, backgroundColor: '#E5E7EB' },
  btn: {
    backgroundColor: '#4E989E',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#36696D',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  btnOff: { opacity: 0.5 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  note: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 16 },
});