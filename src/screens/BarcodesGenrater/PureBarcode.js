import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import barcodes from 'jsbarcode/src/barcodes';

export default function PureBarcode({
                                        value,
                                        barWidth = 2,
                                        height = 80,
                                        lineColor = '#000000',
                                        backgroundColor = '#FFFFFF',
                                    }) {
    const binaryBars = useMemo(() => {
        try {
            const cleanVal = String(value || 'DEFAULT128')
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 12);

            if (!cleanVal) return '';

            // Direct CODE128 Encoder use karna bina kisi Canvas dependency ke
            const Encoder = barcodes.CODE128;
            const encoderInstance = new Encoder(cleanVal, {
                format: 'CODE128',
            });

            // Valid check aur binary bars generate karna
            if (encoderInstance.valid()) {
                const encoding = encoderInstance.encode();
                if (encoding && encoding.data) {
                    return encoding.data;
                }
            }
            return '';
        } catch (e) {
            console.log('PureBarcode generation error:', e);
            return '';
        }
    }, [value]);

    if (!binaryBars) {
        return null;
    }

    return (
        <View style={[styles.wrapper, { backgroundColor }]}>
            <View style={[styles.barcodeRow, { height }]}>
                {binaryBars.split('').map((bit, index) => (
                    <View
                        key={index}
                        style={{
                            width: barWidth,
                            height: height,
                            backgroundColor: bit === '1' ? lineColor : backgroundColor,
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    barcodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});