import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Animated, Dimensions, StatusBar } from 'react-native';

// 'screen' se navigation bar sahit poori physical display milti hai
const { width, height } = Dimensions.get('screen');

const LETTERS = ['I', 'T', 'S', 'E', 'L', 'F'];

export default function SplashScreen({ navigation }) {
    const runnerTranslateX = useRef(new Animated.Value(-width)).current;
    const runnerOpacity = useRef(new Animated.Value(0)).current;

    const lettersAnim = useRef(
        LETTERS.map(() => ({
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.3),
            translateY: new Animated.Value(-12),
        }))
    ).current;

    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const animationTriggered = useRef(false);

    useEffect(() => {
        if (animationTriggered.current) return;
        animationTriggered.current = true;

        const runnerAnim = Animated.parallel([
            Animated.timing(runnerOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(runnerTranslateX, {
                toValue: 0,
                friction: 7,
                tension: 38,
                useNativeDriver: true,
            }),
        ]);

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

        const taglineAnim = Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        });

        Animated.sequence([
            runnerAnim,
            Animated.stagger(110, letterAnimations),
            taglineAnim,
        ]).start();

        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3200);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.root}>
            {/* Status bar ko transparent banata hai taaki background upar tak jaye */}
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <ImageBackground
                source={require('../../../assets/Background _image.png')}
                style={styles.fullScreen}
                resizeMode="cover"
            >
                <Animated.Image
                    source={require('../../../assets/running.png')}
                    style={[
                        styles.fullScreenOverlay,
                        {
                            opacity: runnerOpacity,
                            transform: [{ translateX: runnerTranslateX }],
                        },
                    ]}
                    resizeMode="contain"
                />

                <View style={styles.textContainer}>
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

                    <Animated.View style={{ opacity: taglineOpacity, alignItems: 'center' }}>
                        <Text style={styles.tagline}>
                            SCAN . PAY <Text style={styles.accent}>&amp; GO</Text>
                        </Text>
                    </Animated.View>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#69AEB4', // Agar image load hone me 1 microsecond le toh gap na dikhe
    },
    fullScreen: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
    },
    textContainer: {
        position: 'absolute',
        bottom: height * 0.38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lettersRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    letter: {
        fontSize: 44,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 3,
    },
    tagline: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginTop: 6,
    },
    accent: {
        color: '#F7B32B',
    },
});