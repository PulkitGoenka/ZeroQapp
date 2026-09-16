import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import barcodes from 'jsbarcode/src/barcodes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PureBarcode({
                                        value,
                                        height = 80,
                                        lineColor = '#000000',
                                        backgroundColor = '#FFFFFF',
                                        maxWidth = SCREEN_WIDTH - 64, // Card container ke hisab se safe max width
                                    }) {
    const [containerWidth, setContainerWidth] = useState(maxWidth);

    const binaryBars = useMemo(() => {
        try {
            const cleanVal = String(value || 'DEFAULT128')
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 12);

            if (!cleanVal) return '';

            const Encoder = barcodes.CODE128;
            const encoderInstance = new Encoder(cleanVal, { format: 'CODE128' });

            if (encoderInstance.valid()) {
                const encoding = encoderInstance.encode();
                return encoding?.data || '';
            }
            return '';
        } catch (e) {
            console.log('Barcode encoding error:', e);
            return '';
        }
    }, [value]);

    if (!binaryBars) return null;

    // Auto-fit bar width calculation: Container width / Total bits
    // 32px padding (16px left + 16px right) ke liye space chhodta hai
    const totalBits = binaryBars.length;
    const availableWidth = Math.max(containerWidth - 32, 180);
    const calculatedBarWidth = Math.min(2.2, availableWidth / totalBits);

    return (
        <View
            style={[styles.wrapper, { backgroundColor }]}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - containerWidth) > 5) {
                    setContainerWidth(w);
                }
            }}
        >
            <View style={[styles.barcodeRow, { height }]}>
                {binaryBars.split('').map((bit, index) => (
                    <View
                        key={index}
                        style={{
                            width: calculatedBarWidth,
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
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    barcodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});