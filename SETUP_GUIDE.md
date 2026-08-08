# ZeroQ Frontend — Complete Step-by-Step Build Guide

## What You're Building

A React Native app (iOS + Android) that connects to your Spring Boot ZeroQ backend.

```
User Flow:
Login (Phone + OTP)
    ↓
Home Dashboard
    ↓
Select Store (Pincode / State / QR Scan)
    ↓
Start Shopping Session
    ↓
Scan Product Barcodes → Cart Updates Live
    ↓
Choose Payment (Online / Cash)
    ↓
Get QR Code → Show at Exit Gate / Billing Counter
    ↓
Session Ends → History Updated
```

---

## STEP 1 — Setup Development Environment

### 1.1 Install Node.js & React Native CLI
```bash
# Install Node.js 18+ from https://nodejs.org

# Install React Native CLI globally
npm install -g react-native@latest

# Install Java 17 (for Android)
# Windows: Download from https://adoptium.net
# Mac: brew install openjdk@17
```

### 1.2 Android Setup
```bash
# 1. Download Android Studio from https://developer.android.com/studio
# 2. Open Android Studio → SDK Manager → Install:
#    - Android SDK Platform 34
#    - Android SDK Build-Tools 34
#    - Android Emulator

# Set environment variables (add to ~/.bashrc or ~/.zshrc):
export ANDROID_HOME=$HOME/Library/Android/sdk   # Mac
# export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 1.3 iOS Setup (Mac only)
```bash
# Install Xcode from App Store (free)
# Then install CocoaPods:
sudo gem install cocoapods
```

---

## STEP 2 — Create the React Native Project

```bash
# Create new project
npx react-native@latest init ZeroQApp

cd ZeroQApp
```

---

## STEP 3 — Install All Dependencies

```bash
# Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# Storage (saves tokens / user info between app restarts)
npm install @react-native-async-storage/async-storage

# Icons
npm install react-native-vector-icons

# Barcode Scanner (Camera)
npm install react-native-vision-camera
npm install vision-camera-code-scanner

# For iOS — install pods
cd ios && pod install && cd ..
```

---

## STEP 4 — Copy All Source Files

Copy the provided files into your project:

```
ZeroQApp/
├── App.js                          ← Replace existing App.js
├── src/
│   ├── services/
│   │   └── api.js                  ← All backend API calls
│   ├── store/
│   │   └── AuthContext.js          ← Global auth + session state
│   ├── navigation/
│   │   └── AppNavigator.js         ← All screen routes
│   └── screens/
│       ├── Auth/
│       │   ├── LoginScreen.js      ← Phone number entry
│       │   └── OtpScreen.js        ← OTP verification
│       ├── Home/
│       │   └── HomeScreen.js       ← Dashboard
│       ├── Store/
│       │   └── StoreSelectScreen.js ← Find store
│       ├── Cart/
│       │   ├── CartScreen.js       ← Cart view + manage
│       │   └── ScannerScreen.js    ← Barcode scanner
│       ├── Payment/
│       │   ├── PaymentScreen.js    ← Choose payment method
│       │   └── PaymentQrScreen.js  ← Show QR code
│       └── History/
│           └── HistoryScreen.js    ← Purchase history
```

---

## STEP 5 — Configure the API URL

Open `src/services/api.js` and set the correct `BASE_URL`:

```js
// For Android Emulator (connects to your PC's localhost):
export const BASE_URL = 'http://10.0.2.2:8080';

// For iOS Simulator:
export const BASE_URL = 'http://localhost:8080';

// For real device on same WiFi (find your PC's IP):
export const BASE_URL = 'http://192.168.1.XXX:8080';
// Run on Windows: ipconfig | find "IPv4"
// Run on Mac/Linux: ifconfig | grep "inet "
```

> **Important:** Your Spring Boot backend must be running on port 8080.
> Check: `src/main/resources/application.properties` → `server.port=8080` ✓

---

## STEP 6 — Android Permissions

Add to `android/app/src/main/AndroidManifest.xml` inside `<manifest>`:

```xml
<!-- Internet (required for API calls) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Camera (required for barcode scanning) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- For cleartext HTTP in development (remove in production) -->
```

Also inside `<application>` tag, add:
```xml
android:usesCleartextTraffic="true"
```

> Remove `usesCleartextTraffic` when you deploy with HTTPS in production.

---

## STEP 7 — iOS Permissions

Add to `ios/ZeroQApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>ZeroQ needs camera access to scan product barcodes</string>
```

---

## STEP 8 — Vector Icons Setup

### Android
Add to `android/app/build.gradle`:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### iOS
Add to `ios/Podfile`:
```ruby
pod 'RNVectorIcons', :path => '../node_modules/react-native-vector-icons'
```
Then run: `cd ios && pod install`

---

## STEP 9 — Vision Camera (Barcode Scanner) Setup

### Android
Add to `android/app/build.gradle` under `android { defaultConfig { ... } }`:
```gradle
minSdkVersion 26
```

### iOS
Add to `ios/Podfile`:
```ruby
$VisionCameraVersion = '4'
```

---

## STEP 10 — Run the App

### Start your Spring Boot backend first:
```bash
# In your backend project:
cd demo/demo
./mvnw spring-boot:run
# Wait for: "Started QpayApplication on port 8080"
```

### Run on Android:
```bash
# Start Android emulator from Android Studio first, OR connect a real device with USB debugging ON
npx react-native run-android
```

### Run on iOS (Mac only):
```bash
npx react-native run-ios
```

---

## STEP 11 — Test the Complete Flow

### Test Checklist:

**Auth:**
- [ ] Enter phone number → OTP sent
- [ ] Enter OTP → logged in, JWT saved
- [ ] Close & reopen app → still logged in (token persists)

**Store Selection:**
- [ ] Enter pincode → list of stores appears
- [ ] Tap a store → session starts → goes to Cart

**Scanning:**
- [ ] Tap Scan button → camera opens
- [ ] Scan a product barcode → "Product added to cart!" feedback
- [ ] Go to Cart → item shows with name, price, image

**Cart:**
- [ ] Increase/decrease quantity
- [ ] Remove item
- [ ] Total updates correctly

**Payment:**
- [ ] Choose Online → QR generated
- [ ] Choose Cash → QR generated
- [ ] QR shows countdown timer

**History:**
- [ ] After payment confirmed by staff → appears in history

---

## STEP 12 — Connect to Real Device

### Android (real phone):
1. Enable Developer Options on phone: Settings → About Phone → tap "Build Number" 7 times
2. Enable USB Debugging: Settings → Developer Options → USB Debugging ON
3. Connect phone to PC via USB
4. Run: `adb devices` → your device should appear
5. Change `BASE_URL` to your PC's IP address
6. `npx react-native run-android`

### iOS (real iPhone):
1. Connect iPhone via USB
2. Open Xcode → ZeroQApp.xcworkspace
3. Select your iPhone as the target device
4. Trust the developer certificate on iPhone
5. Press ▶ Play in Xcode

---

## Backend CORS Configuration

Your Spring Boot needs to allow requests from your app's IP.
Add to `SecurityConfig.java` if not already there:

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("*"));
    config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

## Screen → API Mapping (Quick Reference)

| Screen | API Endpoint | Method |
|--------|-------------|--------|
| LoginScreen | `/api/v1/auth/send-otp` | POST |
| OtpScreen | `/api/v1/auth/verify-otp` | POST |
| StoreSelectScreen | `/api/v1/stores/by-pincode` | POST |
| StoreSelectScreen | `/api/v1/stores/by-state` | POST |
| StoreSelectScreen (start) | `/api/v1/cart/session/start` | POST |
| ScannerScreen | `/api/v1/cart/scan` | POST |
| CartScreen | `/api/v1/cart` | GET |
| CartScreen (qty) | `/api/v1/cart/quantity` | PATCH |
| CartScreen (remove) | `/api/v1/cart/item` | DELETE |
| PaymentScreen (online) | `/api/v1/payment/initiate/online` | POST |
| PaymentScreen (cash) | `/api/v1/payment/initiate/cash` | POST |
| HistoryScreen | `/api/v1/payment/history` | GET |

---

## Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `Network request failed` | Check BASE_URL, ensure backend is running, check firewall |
| `Camera not working` | Add CAMERA permission in AndroidManifest.xml / Info.plist |
| `Token expired` | The app auto-refreshes tokens; if it fails, re-login |
| `Cleartext HTTP blocked` | Add `android:usesCleartextTraffic="true"` for development |
| `Metro bundler error` | `npx react-native start --reset-cache` |
| `Pod install fails` | `cd ios && pod deintegrate && pod install` |

---

## Production Checklist (Before Publishing)

- [ ] Change `BASE_URL` to your production server URL (HTTPS)
- [ ] Remove `android:usesCleartextTraffic="true"`
- [ ] Change `twilio.sms-enabled=true` in backend properties
- [ ] Set strong JWT secret in backend
- [ ] Enable ProGuard in Android release build
- [ ] Test on multiple devices (different screen sizes)
