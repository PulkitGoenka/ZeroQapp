import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const LETTERS = ['I', 'T', 'S', 'E', 'L', 'F'];

export default function SplashScreen({ navigation }) {
    // Runner translation & opacity
    const runnerTranslateX = useRef(new Animated.Value(-width * 0.8)).current;
    const runnerOpacity = useRef(new Animated.Value(0)).current;

    // Har letter ke liye staggered animation
    const lettersAnim = useRef(
        LETTERS.map(() => ({
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.4),
            translateY: new Animated.Value(-10),
        }))
    ).current;

    // Tagline Fade-in
    const taglineOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Man + Cart left se center mein daudta hua aayega
        const runnerAnim = Animated.parallel([
            Animated.timing(runnerOpacity, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.spring(runnerTranslateX, {
                toValue: 0,
                friction: 7,
                tension: 42,
                useNativeDriver: true,
            }),
        ]);

        // 2. Letters ka smooth reveal (Runner ke rukte hi)
        const letterAnimations = LETTERS.map((_, i) =>
            Animated.parallel([
                Animated.timing(lettersAnim[i].opacity, {
                    toValue: 1,
                    duration: 160,
                    useNativeDriver: true,
                }),
                Animated.spring(lettersAnim[i].scale, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
                Animated.timing(lettersAnim[i].translateY, {
                    toValue: 0,
                    duration: 160,
                    useNativeDriver: true,
                }),
            ])
        );

        // 3. Tagline (SCAN . PAY & GO)
        const taglineAnim = Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        });

        // Sequence start
        Animated.sequence([
            runnerAnim,
            Animated.stagger(100, letterAnimations),
            taglineAnim,
        ]).start();

        // 3.2 seconds baad Login Screen navigate
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
            {/* Central Brand Lockup - Man + Cart + Name + Tagline */}
            <View style={styles.brandLockup}>

                {/* Layer 1: Man + Cart Graphic (Width aligned with ITSELF) */}
                <Animated.View
                    style={[
                        styles.runnerWrapper,
                        {
                            opacity: runnerOpacity,
                            transform: [{ translateX: runnerTranslateX }],
                        },
                    ]}
                >
                    <Animated.Image
                        source={require('../../../assets/running.png')}
                        style={styles.runnerImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Layer 2: ITSELF Letters (Exact match to the cart boundary) */}
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

                {/* Layer 3: Tagline */}
                <Animated.View style={{ opacity: taglineOpacity, alignItems: 'center' }}>
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
    brandLockup: {
        width: 240, // Fixed width container so runner & text perfectly align
        alignItems: 'center',
        justifyContent: 'center',
    },
    runnerWrapper: {
        width: 240,
        height: 115,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -4, // Cart ko text ke paas lane ke liye tighter spacing
    },
    runnerImage: {
        width: 220,
        height: 115,
    },
    lettersRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 210, // Matches width of the runner graphic above
        alignItems: 'center',
        marginVertical: 4,
    },
    letter: {
        fontSize: 44,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginTop: 4,
        textAlign: 'center',
    },
    accent: {
        color: '#F7B32B',
    },
});