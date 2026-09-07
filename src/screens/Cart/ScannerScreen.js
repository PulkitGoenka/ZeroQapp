import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather as Icon } from '@expo/vector-icons';
import { scanBarcode } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const TEAL = '#4E989E';
const TEAL_SOFT = '#EAF5F5';
const GOLD = '#F7B32B';
const SUCCESS = '#059669';
const DANGER = '#DC2626';

export default function ScannerScreen({ navigation }) {
  const { session } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, type: '', title: '', message: '' });
  const cooldown = useRef(false);

  const showBanner = (type, title, message) => {
    setFeedback({ visible: true, type, title, message });
    setTimeout(() => {
      setFeedback({ visible: false, type: '', title: '', message: '' });
    }, 2800);
  };

  const handleBarcodeScanned = useCallback(async ({ data }) => {
    if (!scanning || cooldown.current || !data || processing) return;

    cooldown.current = true;
    setProcessing(true);
    setScanning(false);
    Vibration.vibrate(80);

    try {
      const res = await scanBarcode(data);
      const name = res?.data?.productName || res?.data?.name || 'Product';
      showBanner('success', 'Item Added to Cart', `${name} registered successfully.`);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Product not recognized';
      showBanner(
          'error',
          'Not in Store Catalog',
          msg.includes('not found') ? 'This item does not exist in store records.' : msg
      );
    } finally {
      setProcessing(false);
      setTimeout(() => {
        cooldown.current = false;
        setScanning(true);
      }, 1800);
    }
  }, [scanning, processing, session]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
        <View style={styles.permBox}>
          <View style={styles.permIcon}>
            <Icon name="camera" size={32} color={TEAL} />
          </View>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSub}>
            Allow camera access to scan shelf barcodes directly into your digital cart.
          </Text>
          <TouchableOpacity style={styles.allowBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.allowText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 14 }} onPress={() => navigation.goBack()}>
            <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a'],
            }}
            onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
        />

        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Icon name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.title}>Scan Product Barcode</Text>
              <Text style={styles.subTitle}>{session?.storeName || 'Store'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.iconBtn}>
              <Icon name="shopping-cart" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Target */}
          <View style={styles.targetBox}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            {processing && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={GOLD} />
                </View>
            )}
          </View>

          <Text style={styles.guideText}>Point camera at shelf product tag</Text>

          {/* Dynamic Card Alert */}
          {feedback.visible && (
              <View style={[styles.alertCard, feedback.type === 'success' ? styles.alertSuccess : styles.alertError]}>
                <Icon
                    name={feedback.type === 'success' ? 'check-circle' : 'alert-circle'}
                    size={20}
                    color="#FFFFFF"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{feedback.title}</Text>
                  <Text style={styles.alertMessage} numberOfLines={2}>{feedback.message}</Text>
                </View>
              </View>
          )}

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => navigation.navigate('StoreHome')}
                activeOpacity={0.85}
            >
              <Icon name="check" size={16} color={TEAL} />
              <Text style={styles.doneBtnText}>Finish</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.cartBtn}
                onPress={() => navigation.navigate('Cart')}
                activeOpacity={0.85}
            >
              <Icon name="shopping-cart" size={16} color="#412402" />
              <Text style={styles.cartBtnText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center' },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  subTitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  targetBox: { width: 240, height: 240, marginTop: 70, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#FFFFFF' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 6 },
  loadingBox: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 16, borderRadius: 12 },

  guideText: { color: '#E5E7EB', fontSize: 13, marginTop: 24, fontWeight: '600' },

  alertCard: {
    position: 'absolute',
    top: 390,
    width: '88%',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  alertSuccess: { backgroundColor: SUCCESS },
  alertError: { backgroundColor: DANGER },
  alertTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  alertMessage: { fontSize: 12, color: 'rgba(255,255,255,0.92)', marginTop: 2 },

  bottomBar: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
  },
  doneBtnText: { color: TEAL, fontSize: 14, fontWeight: '800' },
  cartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    paddingVertical: 14,
    borderRadius: 14,
  },
  cartBtnText: { color: '#412402', fontSize: 14, fontWeight: '800' },

  permBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#FFFFFF' },
  permIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: TEAL_SOFT, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  permTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  permSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19, marginBottom: 24 },
  allowBtn: { backgroundColor: TEAL, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  allowText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});