import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';

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
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#2563EB',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E5E7EB', height: 60, paddingBottom: 6, paddingTop: 6 },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ color, size }) => {
                    const icons = { Home: 'home', Cart: 'shopping-cart', History: 'clock' };
                    return <Icon name={icons[route.name] || 'circle'} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home"    component={HomeScreen} />
            <Tab.Screen name="Cart"    component={CartScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
        </Tab.Navigator>
    );
}

function AppStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs"    component={MainTabs} />
            <Stack.Screen name="BrandSelect" component={BrandSelectScreen} />
            <Stack.Screen name="StoreSelect" component={StoreSelectScreen} />
            <Stack.Screen name="StoreHome"   component={StoreHomeScreen} />
            <Stack.Screen name="Cart"        component={CartScreen} />
            <Stack.Screen name="History"     component={HistoryScreen} />
            <Stack.Screen name="Scanner"     component={ScannerScreen} />
            <Stack.Screen name="Payment"     component={PaymentScreen} />
            <Stack.Screen name="OnlineCheckout" component={OnlineCheckoutScreen} />
            <Stack.Screen name="PaymentQr"   component={PaymentQrScreen} />
        </Stack.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Otp"   component={OtpScreen} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useAuth();
    if (isLoading) return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
            <ActivityIndicator size="large" color="#2563EB" />
        </View>
    );
    return (
        <NavigationContainer>
            {user ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
}