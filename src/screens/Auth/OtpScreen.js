import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ImageBackground, Dimensions, Animated, StatusBar,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { verifyOtp, resendOtp } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

// 'screen' se status bar aur navigation bar sahit poori physical display milti hai
const { width, height } = Dimensions.get('screen');

export default function OtpScreen({ navigation, route }) {
  const { phone, expirySeconds = 120 } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(expirySeconds);
  const inputRef = useRef(null);

  // Animations
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Card Entrance Animation
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 35,
        useNativeDriver: true,
      }),
    ]).start();

    // Timer Countdown
    const t = setInterval(() => setTimer(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (otp.length === 6) verify(otp);
  }, [otp]);

  const handleChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setOtp(clean);
  };

  const onPressIn = () => {
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(btnScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const verify = async (code = otp) => {
    if (code.length < 6) {
      Alert.alert('Incomplete', 'Enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code);
      await login({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken }, res.data.user);
    } catch (e) {
      Alert.alert('Invalid OTP', e.message);
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await resendOtp(phone);
      setTimer(res.data?.cooldownSeconds || 60);
      setOtp('');
      inputRef.current?.focus();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setResending(false);
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
      <View style={styles.root}>
        {/* Edge-to-edge transparent status bar */}
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* 100% Full-Screen Pattern Background */}
        <ImageBackground
            source={require('../../../assets/Background _image.png')}
            style={styles.fullScreenBg}
            resizeMode="cover"
        >
          <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.container}>
              {/* Back Button */}
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                <Icon name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Form Card */}
              <Animated.View
                  style={[
                    styles.card,
                    {
                      opacity: cardFade,
                      transform: [{ translateY: cardTranslateY }],
                    },
                  ]}
              >
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.sub}>
                  Sent to <Text style={styles.phone}>+91 {phone}</Text>
                </Text>
                <Text style={styles.pasteHint}>Enter the 6-digit code sent to your phone</Text>

                {/* Hidden real input + 6 Display Boxes */}
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => inputRef.current?.focus()}
                    style={styles.otpRow}
                >
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
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                      <View
                          key={i}
                          style={[
                            styles.box,
                            otp.length > i && styles.boxFilled,
                            otp.length === i && styles.boxFocused,
                          ]}
                      >
                        <Text style={styles.boxText}>{otp[i] || ''}</Text>
                        {otp.length === i && <View style={styles.cursor} />}
                      </View>
                  ))}
                </TouchableOpacity>

                {/* Expiry Timer */}
                <Text style={styles.timer}>
                  {timer > 0 ? `Expires in ${fmt(timer)}` : 'OTP expired'}
                </Text>

                {/* Verify Button */}
                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                  <TouchableOpacity
                      style={[styles.btn, (otp.length < 6 || loading) && styles.btnOff]}
                      onPress={() => verify()}
                      onPressIn={onPressIn}
                      onPressOut={onPressOut}
                      disabled={otp.length < 6 || loading}
                      activeOpacity={0.9}
                  >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>Verify & Continue</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Resend Action */}
                <TouchableOpacity
                    onPress={handleResend}
                    disabled={timer > 0 || resending}
                    style={styles.resendBtn}
                >
                  {resending ? (
                      <ActivityIndicator size="small" color="#4E989E" />
                  ) : (
                      <Text style={[styles.resendText, timer > 0 && styles.resendOff]}>
                        {timer > 0 ? `Resend in ${fmt(timer)}` : 'Resend OTP'}
                      </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#69AEB4',
  },
  fullScreenBg: {
    width: width,
    height: height,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 24,
    padding: 8,
    zIndex: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 7,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  phone: {
    fontWeight: '700',
    color: '#4E989E',
  },
  pasteHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    zIndex: 1,
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFilled: {
    borderColor: '#4E989E',
    backgroundColor: '#F0F9FA',
  },
  boxFocused: {
    borderColor: '#4E989E',
    borderWidth: 2,
  },
  boxText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  cursor: {
    position: 'absolute',
    bottom: 8,
    width: 2,
    height: 18,
    backgroundColor: '#4E989E',
    borderRadius: 1,
  },
  timer: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#4E989E',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#36696D',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 14,
  },
  btnOff: {
    opacity: 0.5,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    padding: 6,
  },
  resendText: {
    fontSize: 14,
    color: '#4E989E',
    fontWeight: '600',
  },
  resendOff: {
    color: '#9CA3AF',
  },
});