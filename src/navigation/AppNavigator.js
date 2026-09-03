import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';

// Screens
import SplashScreen     from '../screens/Loading/SplashScreen'; // <-- Step 2 wala screen file
import LoginScreen      from '../screens/Auth/LoginScreen';
import OtpScreen        from '../screens/Auth/OtpScreen';
import HomeScreen       from '../screens/Home/HomeScreen';
import BrandSelectScreen from '../screens/Brand/Brandselectscreen';
import StoreSelectScreen from '../screens/Store/StoreSelectScreen';
import StoreHomeScreen  from '../screens/Store/StoreHomeScreen';
import CartScreen       from '../screens/Cart/CartScreen';
import ScannerScreen    from '../screens/Cart/ScannerScreen';
import PaymentScreen    from '../screens/Payment/PaymentScreen';
import OnlineCheckoutScreen from '../screens/Payment/OnlineCheckoutScreen';
import PaymentQrScreen  from '../screens/Payment/PaymentQrScreen';
import HistoryScreen    from '../screens/History/HistoryScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#4E989E', // Theme matching teal
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#E5E7EB',
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom + 6,
                    paddingTop: 6,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarIcon: ({ color, size }) => {
                    const icons = {
                        Home: 'home',
                        Cart: 'shopping-cart',
                        History: 'clock',
                    };

                    return (
                        <Icon
                            name={icons[route.name] || 'circle'}
                            size={size}
                            color={color}
                        />
                    );
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
        </Tab.Navigator>
    );
}

function AppStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs"       component={MainTabs} />
            <Stack.Screen name="BrandSelect"    component={BrandSelectScreen} />
            <Stack.Screen name="StoreSelect"    component={StoreSelectScreen} />
            <Stack.Screen name="StoreHome"      component={StoreHomeScreen} />
            <Stack.Screen name="Cart"           component={CartScreen} />
            <Stack.Screen name="History"        component={HistoryScreen} />
            <Stack.Screen name="Scanner"        component={ScannerScreen} />
            <Stack.Screen name="Payment"        component={PaymentScreen} />
            <Stack.Screen name="OnlineCheckout" component={OnlineCheckoutScreen} />
            <Stack.Screen name="PaymentQr"      component={PaymentQrScreen} />
        </Stack.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login"  component={LoginScreen} />
            <Stack.Screen name="Otp"    component={OtpScreen} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useAuth();
    const [isSplashDone, setIsSplashDone] = useState(false);

    // Jab tak auth check ho raha hai ya initial splash time chal raha hai
    if (isLoading || !isSplashDone) {
        return (
            <SafeAreaProvider>
                <SplashScreen navigation={{ replace: () => setIsSplashDone(true) }} />
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                {user ? <AppStack /> : <AuthStack />}
            </NavigationContainer>
        </SafeAreaProvider>
    );
}