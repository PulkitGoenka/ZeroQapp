import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const LETTERS = ['I', 'T', 'S', 'E', 'L', 'F'];

export default function SplashScreen({ navigation }) {
    // Runner run-in animation (left side se aayega)
    const runnerTranslateX = useRef(new Animated.Value(-width)).current;
    const runnerOpacity = useRef(new Animated.Value(0)).current;

    // Har letter ke liye alag animated values
    const lettersAnim = useRef(
        LETTERS.map(() => ({
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.3),
            translateY: new Animated.Value(-15),
        }))
    ).current;

    // Tagline Fade-in
    const taglineOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Runner running.png daudta hua center mein aayega
        const runnerAnimation = Animated.parallel([
            Animated.timing(runnerOpacity, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.spring(runnerTranslateX, {
                toValue: 0,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
            }),
        ]);

        // 2. I - T - S - E - L - F ek-ek karke appear honge
        const letterAnimations = LETTERS.map((_, i) =>
            Animated.parallel([
                Animated.timing(lettersAnim[i].opacity, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.spring(lettersAnim[i].scale, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
                Animated.timing(lettersAnim[i].translateY, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ])
        );

        // 3. Tagline reveal
        const taglineAnimation = Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        });

        // Sequence execution
        Animated.sequence([
            runnerAnimation,
            Animated.stagger(120, letterAnimations),
            taglineAnimation,
        ]).start();

        // 3.2 seconds baad Login screen
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3200);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <ImageBackground
            source={require('../../../assets/Background _image.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.contentWrap}>
                {/* Animated Running PNG Graphic */}
                <Animated.Image
                    source={require('../../../assets/running.png')}
                    style={[
                        styles.runnerImage,
                        {
                            opacity: runnerOpacity,
                            transform: [{ translateX: runnerTranslateX }],
                        },
                    ]}
                    resizeMode="contain"
                />

                {/* Animated Letters: I - T - S - E - L - F */}
                <View style={styles.lettersRow}>
                    {LETTERS.map((char, index) => (
                        <Animated.Text
                            key={index}
                            style={[
                                styles.letter,
                                {
                                    opacity: lettersAnim[index].opacity,
                                    transform: [
                                        { scale: lettersAnim[index].scale },
                                        { translateY: lettersAnim[index].translateY },
                                    ],
                                },
                            ]}
                        >
                            {char}
                        </Animated.Text>
                    ))}
                </View>

                {/* Animated Tagline */}
                <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
                    SCAN . PAY <Text style={styles.accent}>&amp; GO</Text>
                </Animated.Text>
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
    contentWrap: {
        alignItems: 'center',
    },
    runnerImage: {
        width: 140,
        height: 90,
        marginBottom: 6,
    },
    lettersRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    letter: {
        fontSize: 46,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 4,
    },
    tagline: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginTop: 6,
    },
    accent: {
        color: '#F7B32B',
    },
});