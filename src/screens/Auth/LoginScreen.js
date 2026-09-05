import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
  Animated,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { sendOtp } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Entrance Animations
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-20)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

  // Button Press Animation
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Screen open hote hi smooth entrance animation
    Animated.parallel([
      // Logo Fade-in + Drop
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      // Card Slide-up
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 35,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const canSubmit = name.trim().length >= 2 && /^[6-9]\d{9}$/.test(phone.trim());

  const onPressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

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

          {/* Animated Brand Logo */}
          <Animated.View
              style={[
                styles.logoWrap,
                {
                  opacity: logoFade,
                  transform: [{ translateY: logoTranslateY }],
                },
              ]}
          >
            <Animated.Image
                source={require('../../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
            />
          </Animated.View>

          {/* Animated Form Card */}
          <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardFade,
                  transform: [{ translateY: cardTranslateY }],
                },
              ]}
          >
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardSub}>Enter your details to get started</Text>

            {/* Full Name */}
            <Text style={styles.label}>
              Full Name <Text style={styles.req}>*</Text>
            </Text>
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

            {/* Mobile Number */}
            <Text style={styles.label}>
              Mobile Number <Text style={styles.req}>*</Text>
            </Text>
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

            {/* Animated Send OTP Button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                  style={[styles.btn, (!canSubmit || loading) && styles.btnOff]}
                  onPress={handleSend}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  disabled={!canSubmit || loading}
                  activeOpacity={0.9}
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
            </Animated.View>

            <Text style={styles.note}>We'll send a 6-digit OTP to verify your number</Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#69AEB4',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 210,
    height: 120,
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
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  req: {
    color: '#EF4444',
  },
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
  inputActive: {
    borderColor: '#69AEB4',
    backgroundColor: '#F0F9FA',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: 50,
  },
  prefix: {
    paddingRight: 4,
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#E5E7EB',
  },
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
  btnOff: {
    opacity: 0.5,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 16,
  },
});