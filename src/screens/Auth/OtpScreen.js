import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { verifyOtp, resendOtp } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

export default function OtpScreen({ navigation, route }) {
  const { phone, expirySeconds = 120 } = route.params;
  const { login } = useAuth();
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer]     = useState(expirySeconds);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTimer(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (otp.length === 6) verify(otp);
  }, [otp]);

  const handleChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setOtp(clean);
  };

  const verify = async (code = otp) => {
    if (code.length < 6) { Alert.alert('Incomplete', 'Enter all 6 digits.'); return; }
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code);
      await login({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken }, res.data.user);
    } catch (e) {
      Alert.alert('Invalid OTP', e.message);
      setOtp('');
      inputRef.current?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await resendOtp(phone);
      setTimer(res.data?.cooldownSeconds || 60);
      setOtp('');
      inputRef.current?.focus();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setResending(false); }
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconBox}><Text style={styles.iconText}>📱</Text></View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.sub}>Sent to <Text style={styles.phone}>+91 {phone}</Text></Text>
            <Text style={styles.pasteHint}>You can paste the OTP directly</Text>
          </View>

          {/* Hidden real input + 6 display boxes */}
          <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
            <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={handleChange}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                autoFocus
                style={styles.hiddenInput}
                editable={!loading}
            />
            {[0,1,2,3,4,5].map(i => (
                <View key={i} style={[
                  styles.box,
                  otp.length > i && styles.boxFilled,
                  otp.length === i && styles.boxFocused,
                ]}>
                  <Text style={styles.boxText}>{otp[i] || ''}</Text>
                  {otp.length === i && <View style={styles.cursor} />}
                </View>
            ))}
          </TouchableOpacity>

          <Text style={styles.timer}>
            {timer > 0 ? `Expires in ${fmt(timer)}` : 'OTP expired'}
          </Text>

          <TouchableOpacity
              style={[styles.btn, (otp.length < 6 || loading) && styles.btnOff]}
              onPress={() => verify()}
              disabled={otp.length < 6 || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} disabled={timer > 0 || resending} style={styles.resendBtn}>
            {resending
                ? <ActivityIndicator size="small" color="#2563EB" />
                : <Text style={[styles.resendText, timer > 0 && styles.resendOff]}>
                  {timer > 0 ? `Resend in ${fmt(timer)}` : 'Resend OTP'}
                </Text>
            }
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  back: { position: 'absolute', top: 56, left: 24, padding: 8 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconBox: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  iconText: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6 },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  phone: { fontWeight: '700', color: '#2563EB' },
  pasteHint: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  otpRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 10,
    marginBottom: 16, position: 'relative',
  },
  hiddenInput: {
    position: 'absolute', width: '100%', height: '100%', opacity: 0, zIndex: 1,
  },
  box: {
    width: 46, height: 54, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  boxFilled: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  boxFocused: { borderColor: '#2563EB', borderWidth: 2 },
  boxText: { fontSize: 22, fontWeight: '700', color: '#111827' },
  cursor: {
    position: 'absolute', bottom: 8, width: 2, height: 20,
    backgroundColor: '#2563EB', borderRadius: 1,
  },
  timer: { textAlign: 'center', color: '#6B7280', fontSize: 13, marginBottom: 28 },
  btn: {
    backgroundColor: '#2563EB', height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 16,
  },
  btnOff: { opacity: 0.45 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendBtn: { alignItems: 'center', padding: 8 },
  resendText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  resendOff: { color: '#9CA3AF' },
});