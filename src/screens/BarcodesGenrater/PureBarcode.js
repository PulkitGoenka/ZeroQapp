import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import JsBarcode from 'jsbarcode';

export default function PureBarcode({
                                        value,
                                        barWidth = 2.2,
                                        height = 90,
                                    }) {
    // JsBarcode library sirf text se binary pattern calculate karegi
    const binaryBars = useMemo(() => {
        try {
            const cleanVal = String(value || 'CTR000').replace(/[^a-zA-Z0-9]/g, '');
            const canvas = {};
            JsBarcode(canvas, cleanVal, {
                format: 'CODE128',
                xmlDocument: false,
            });

            return canvas._encodings?.[0]?.data || '';
        } catch (e) {
            return '';
        }
    }, [value]);

    if (!binaryBars) return null;

    // Khud ka Native View rendering bina kisi SVG ya native module ke
    return (
        <View style={styles.wrapper}>
            <View style={[styles.barcodeRow, { height }]}>
                {binaryBars.split('').map((bit, index) => (
                    <View
                        key={index}
                        style={{
                            width: barWidth,
                            height: height,
                            backgroundColor: bit === '1' ? '#000000' : '#FFFFFF',
                        }}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24, // 1D Scanner ke liye zaroori Quiet Zone
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    barcodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});