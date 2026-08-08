// ─────────────────────────────────────────────────────────────
//  ScannerScreen.js
//  Scan barcode → add to cart → wapas StoreHome pe jaao
//  "View Cart" button bhi hai agar user seedha cart dekhna chahe
// ─────────────────────────────────────────────────────────────
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather as Icon } from '@expo/vector-icons';
import { scanBarcode } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

export default function ScannerScreen({ navigation }) {
  const { session } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning,    setScanning]    = useState(true);
  const [lastScanned, setLastScanned] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const cooldown = useRef(false);

  const showFeedback = (msg, type) => {
    setFeedbackMsg(msg);
    setFeedbackType(type);
    setTimeout(() => { setFeedbackMsg(''); setFeedbackType(''); }, 2500);
  };

  const handleBarcode = useCallback(async ({ data }) => {
    if (!scanning || cooldown.current || !data) return;
    if (data === lastScanned) return;
    cooldown.current = true;
    setTimeout(() => { cooldown.current = false; }, 2000);
    setLastScanned(data);
    setScanning(false);
    Vibration.vibrate(80);
    try {
      await scanBarcode(data);
      showFeedback('✓ Added to cart!', 'success');
    } catch (e) {
      showFeedback(`✗ ${e.message}`, 'error');
    } finally {
      setTimeout(() => setScanning(true), 2000);
    }
  }, [scanning, lastScanned, session]);

  if (!permission) return <View style={styles.flex} />;

  if (!permission.granted) {
    return (
        <View style={styles.permBox}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permText}>Allow camera to scan product barcodes.</Text>
          <TouchableOpacity style={styles.allowBtn} onPress={requestPermission}>
            <Text style={styles.allowText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
    );
  }

  return (
      <View style={styles.flex}>
        <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13','ean8','qr','code128','code39','upc_a'] }}
            onBarcodeScanned={scanning ? handleBarcode : undefined}
        />

        <View style={styles.overlay}>

          {/* Top bar */}
          <View style={styles.topBar}>
            {/* ✅ Back → StoreHome pe jaata hai */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Scan Product</Text>
            {/* ✅ Cart shortcut — user chahiye toh seedha cart dekhe */}
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.iconBtn}>
              <Icon name="shopping-cart" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder */}
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>

          <Text style={styles.hint}>Point at product barcode</Text>

          {/* Feedback */}
          {!!feedbackMsg && (
              <View style={[styles.feedback, feedbackType === 'success' ? styles.fSuccess : styles.fError]}>
                <Text style={styles.feedbackText}>{feedbackMsg}</Text>
              </View>
          )}

          {lastScanned && (
              <View style={styles.lastRow}>
                <Text style={styles.lastLabel}>Last scanned:</Text>
                <Text style={styles.lastCode}>{lastScanned}</Text>
              </View>
          )}

          {/* Bottom buttons */}
          <View style={styles.bottomRow}>
            {/* ✅ Done scanning → StoreHome pe wapas */}
            <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => navigation.navigate('StoreHome')}
            >
              <Icon name="check" size={16} color="#2563EB" />
              <Text style={styles.doneBtnText}>Done Scanning</Text>
            </TouchableOpacity>

            {/* View Cart */}
            <TouchableOpacity
                style={styles.cartBtn}
                onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="shopping-cart" size={16} color="#fff" />
              <Text style={styles.cartBtnText}>View Cart</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
  );
}

const CS = 24; const CT = 3;
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  permBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#111' },
  permIcon: { fontSize: 56, marginBottom: 16 },
  permTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  permText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  allowBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginBottom: 10 },
  allowText: { color: '#fff', fontWeight: '700' },
  backBtn: { backgroundColor: '#374151', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  backText: { color: '#fff', fontWeight: '700' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center' },
  topBar: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

  viewfinder: { width: 240, height: 240, marginTop: 60, position: 'relative' },
  corner: { position: 'absolute', width: CS, height: CS, borderColor: '#fff' },
  tl: { top:0, left:0,  borderTopWidth:CT, borderLeftWidth:CT,  borderTopLeftRadius:4 },
  tr: { top:0, right:0, borderTopWidth:CT, borderRightWidth:CT, borderTopRightRadius:4 },
  bl: { bottom:0, left:0,  borderBottomWidth:CT, borderLeftWidth:CT,  borderBottomLeftRadius:4 },
  br: { bottom:0, right:0, borderBottomWidth:CT, borderRightWidth:CT, borderBottomRightRadius:4 },

  hint: { color: '#E5E7EB', fontSize: 13, marginTop: 20, fontWeight: '500' },

  feedback: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minWidth: 220, alignItems: 'center' },
  fSuccess: { backgroundColor: '#059669' },
  fError:   { backgroundColor: '#DC2626' },
  feedbackText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  lastRow: { marginTop: 14, alignItems: 'center' },
  lastLabel: { color: '#9CA3AF', fontSize: 11 },
  lastCode: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 1, marginTop: 2 },

  bottomRow: {
    position: 'absolute', bottom: 48,
    flexDirection: 'row', gap: 12,
  },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 13,
    borderRadius: 14,
  },
  doneBtnText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  cartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 13,
    borderRadius: 14, elevation: 4,
    shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 10,
  },
  cartBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});