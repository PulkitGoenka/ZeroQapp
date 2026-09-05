import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Animated } from 'react-native';

export default function SplashScreen({ navigation }) {
    // Animation Values
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        // Step-by-step Animation Chalu karo
        Animated.sequence([
            // 1. Logo Fade-in aur Scale hoga
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Logo ke baad Text Slide-up hokar aayega
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(textTranslateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // 2.5 second baad Login screen par bhej do
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <ImageBackground
            source={require('../../../assets/Background _image.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.centerBox}>
                {/* Animated Logo Image */}
                <Animated.Image
                    source={require('../../../assets/Logo.jpg')}
                    style={[
                        styles.logo,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                    resizeMode="contain"
                />

                {/* Animated Text Block */}
                <Animated.View
                    style={{
                        opacity: textOpacity,
                        transform: [{ translateY: textTranslateY }],
                        alignItems: 'center',
                    }}
                >
                    <Text style={styles.title}>ITSELF</Text>
                    <Text style={styles.tagline}>
                        SCAN . PAY <Text style={styles.accent}>&amp; GO</Text>
                    </Text>
                </Animated.View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerBox: {
        alignItems: 'center',
    },
    logo: {
        width: 140,
        height: 100,
        marginBottom: 10,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 3,
    },
    tagline: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginTop: 4,
    },
    accent: {
        color: '#F7B32B',
    },
});