import React, { useEffect, useRef } from 'react';
import { StyleSheet, ImageBackground, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
    const runnerTranslateX = useRef(new Animated.Value(-width)).current;
    const runnerOpacity = useRef(new Animated.Value(0)).current;

    // Flag taaki animation dobara run na ho
    const animationTriggered = useRef(false);

    useEffect(() => {
        // Agar pehle se chal chuka hai toh wapas na chalayein
        if (animationTriggered.current) return;
        animationTriggered.current = true;

        Animated.parallel([
            Animated.timing(runnerOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(runnerTranslateX, {
                toValue: 0,
                friction: 7,
                tension: 35,
                useNativeDriver: true,
            }),
        ]).start();

        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
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
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
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
});