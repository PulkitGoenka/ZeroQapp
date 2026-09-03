import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

function CartPattern({ top, left, rotate, size = 38 }) {
    return (
        <View style={[styles.cartIcon, { top, left, transform: [{ rotate }] }]}>
            <Svg width={size} height={size} viewBox="0 0 36 34" fill="none">
                <Path
                    d="M4 6h6l4.8 15.2a3 3 0 0 0 2.8 2.1h15.8a3 3 0 0 0 2.9-2.2l3.4-11.1H12.5"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Circle cx="18" cy="27" r="2.5" fill="#FFFFFF" />
                <Circle cx="27" cy="27" r="2.5" fill="#FFFFFF" />
            </Svg>
        </View>
    );
}

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 2000);
        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            {/* Scattered Background Watermarks */}
            <CartPattern top={height * 0.08} left={width * 0.15} rotate="15deg" />
            <CartPattern top={height * 0.05} left={width * 0.70} rotate="-20deg" />
            <CartPattern top={height * 0.22} left={width * 0.80} rotate="10deg" />
            <CartPattern top={height * 0.35} left={width * 0.08} rotate="-35deg" />
            <CartPattern top={height * 0.65} left={width * 0.12} rotate="25deg" />
            <CartPattern top={height * 0.68} left={width * 0.75} rotate="-15deg" />
            <CartPattern top={height * 0.85} left={width * 0.25} rotate="10deg" />
            <CartPattern top={height * 0.88} left={width * 0.65} rotate="-30deg" />

            {/* Main Logo */}
            <View style={styles.centerLogo}>
                <Svg width={180} height={90} viewBox="0 0 200 110">
                    <G stroke="#F7B32B" strokeWidth="2.5" strokeLinecap="round">
                        <Line x1="28" y1="41" x2="52" y2="41" />
                        <Line x1="22" y1="48" x2="48" y2="48" />
                        <Line x1="31" y1="55" x2="60" y2="55" />
                        <Line x1="16" y1="63" x2="44" y2="63" />
                        <Line x1="21" y1="69" x2="40" y2="69" />
                    </G>
                    <G fill="#FFFFFF">
                        <Circle cx="83" cy="22.5" r="7" />
                        <Path d="M78 32 C82 31 87 31 92 35 L106 49 L101 54 L90 44 L87 56 L103 76 L97 81 L82 62 L73 68 L66 50 C71 42 74 36 78 32 Z" />
                        <Path d="M83 63 L92 78 L99 91 L108 92 L108 96 L94 96 L86 82 L77 68 Z" />
                        <Path d="M72 67 L57 85 L44 85 L44 93 L49 93 L61 88 L74 72 Z" />
                        <Path d="M90 40 L108 44 L110 52 L105 52 L104 47 L89 44 Z" />
                    </G>
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

                <Text style={styles.title}>ITSELF</Text>
                <Text style={styles.tagline}>
                    SCAN . PAY <Text style={styles.accent}>&amp; GO</Text>
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#69AEB4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartIcon: {
        position: 'absolute',
        opacity: 0.18,
    },
    centerLogo: {
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 3,
        marginTop: 8,
    },
    tagline: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginTop: 4,
    },
    accent: {
        color: '#F7B32B',
    },
});