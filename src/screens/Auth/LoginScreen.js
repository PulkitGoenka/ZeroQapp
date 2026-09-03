import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { Feather as Icon } from '@expo/vector-icons';
import { sendOtp } from '../../services/api';

// Self-contained ITSELF Graphic
function ItselfGraphic({ size = 1 }) {
  return (
      <Svg width={140 * size} height={70 * size} viewBox="0 0 200 110">
        {/* Speed Lines */}
        <G stroke="#F7B32B" strokeWidth="2.5" strokeLinecap="round">
          <Line x1="28" y1="41" x2="52" y2="41" />
          <Line x1="22" y1="48" x2="48" y2="48" />
          <Line x1="31" y1="55" x2="60" y2="55" />
          <Line x1="16" y1="63" x2="44" y2="63" />
          <Line x1="21" y1="69" x2="40" y2="69" />
        </G>

        {/* Runner */}
        <G fill="#FFFFFF">
          <Circle cx="83" cy="22.5" r="7" />
          <Path d="M78 32 C82 31 87 31 92 35 L106 49 L101 54 L90 44 L87 56 L103 76 L97 81 L82 62 L73 68 L66 50 C71 42 74 36 78 32 Z" />
          <Path d="M83 63 L92 78 L99 91 L108 92 L108 96 L94 96 L86 82 L77 68 Z" />
          <Path d="M72 67 L57 85 L44 85 L44 93 L49 93 L61 88 L74 72 Z" />
          <Path d="M90 40 L108 44 L110 52 L105 52 L104 47 L89 44 Z" />
        </G>

        {/* Trolley Basket */}
        <G fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M109 48 L142 50 L138 72 L114 72 Z" />
          <Path d="M115 49 L118 72" />
          <Path d="M123 49 L125 72" />
          <Path d="M131 49 L132 72" />
          <Path d="M112 55 L140 56" />
          <Path d="M113 63 L139 64" />
          <Path d="M115 72 L111 81 L138 81" strokeWidth="2.2" />
        </G>
        <Circle cx="114" cy="86" r="3.5" fill="#FFFFFF" />
        <Circle cx="135" cy="86" r="3.5" fill="#FFFFFF" />
      </Svg>
  );
}

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

          {/* Updated ITSELF Branding */}
          <View style={styles.logoWrap}>
            <ItselfGraphic size={1.1} />
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
  logoWrap: { alignItems: 'center', marginBottom: 26 },
  logoTitle: {
    fontSize: 34,
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