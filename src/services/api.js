// ─────────────────────────────────────────────────────────────
//  ZeroQ API Service
//  Base URL: your Spring Boot backend (port 8080)
//  Change BASE_URL to your server IP/domain when deploying
// ─────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';


export const BASE_URL = 'https://zeroq-backend.onrender.com';

// ── Token helpers ──────────────────────────────────────────────
const getAccessToken  = async () => AsyncStorage.getItem('accessToken');
const getRefreshToken = async () => AsyncStorage.getItem('refreshToken');

export const saveTokens = async (accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
    ]);
};

export const clearTokens = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
};

// ── Core fetch wrapper ─────────────────────────────────────────
async function apiFetch(path, options = {}, requiresAuth = true) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    if (requiresAuth) {
        const token = await getAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    // 401 → try refresh
    if (response.status === 401 && requiresAuth) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            const newToken = await getAccessToken();
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryRes  = await fetch(`${BASE_URL}${path}`, { ...options, headers });
            const retryData = await retryRes.json();
            if (!retryRes.ok) throw new Error(retryData?.message || 'Request failed');
            return retryData;
        }
        throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Something went wrong');
    }
    return data;
}

async function tryRefresh() {
    try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return false;
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        await saveTokens(data.data.accessToken, data.data.refreshToken);
        return true;
    } catch {
        return false;
    }
}

// ══════════════════════════════════════════════════════════════
//  AUTH ENDPOINTS
// ══════════════════════════════════════════════════════════════

/** Send OTP – works for new & existing users */
export const sendOtp = (phone, name = null) =>
    apiFetch('/api/v1/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, name }),
    }, false);

/** Resend OTP */
export const resendOtp = (phone) =>
    apiFetch('/api/v1/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
    }, false);

/** Verify OTP → returns accessToken + refreshToken */
export const verifyOtp = (phone, otp) =>
    apiFetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
    }, false);

/** Logout – revoke refresh token */
export const logout = async () => {
    const refreshToken = await getRefreshToken();
    try {
        await apiFetch('/api/v1/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
    } finally {
        await clearTokens();
    }
};

// ══════════════════════════════════════════════════════════════
//  BRAND ENDPOINTS
// ══════════════════════════════════════════════════════════════

/** Get all active brands — public, no auth needed. Call this right after login. */
export const getBrands = () =>
    apiFetch('/api/v1/brands', {}, false);

// ══════════════════════════════════════════════════════════════
//  STORE ENDPOINTS
// ══════════════════════════════════════════════════════════════

/** Find stores by pincode, filtered by the brand selected earlier */
export const findStoresByPincode = (pincode, brandId = null) =>
    apiFetch('/api/v1/stores/by-pincode', {
        method: 'POST',
        // brandId must always be a plain string (or null) — never an object.
        // Sending {leastSigBits, mostSigBits} crashes Jackson's UUID parser.
        body: JSON.stringify({ pincode, brandId: brandId ? String(brandId) : null }),
    }, false);

/** Find stores by state, filtered by the brand selected earlier */
export const findStoresByState = (state, brandId = null) =>
    apiFetch('/api/v1/stores/by-state', {
        method: 'POST',
        body: JSON.stringify({ state, brandId: brandId ? String(brandId) : null }),
    }, false);

/** Find stores by district, filtered by brand */
export const findStoresByDistrict = (district, brandId = null) =>
    apiFetch('/api/v1/stores/by-district', {
        method: 'POST',
        body: JSON.stringify({ district, brandId: brandId ? String(brandId) : null }),
    }, false);

/** Find store by QR code (public, no auth needed) */
export const findStoreByQr = (qrCode) =>
    apiFetch(`/api/v1/stores/by-qr/${qrCode}`, {}, false);

// ══════════════════════════════════════════════════════════════
//  CART ENDPOINTS
// ══════════════════════════════════════════════════════════════

/** Start a shopping session at a store */
export const startSession = (storeId) =>
    apiFetch('/api/v1/cart/session/start', {
        method: 'POST',
        body: JSON.stringify({ storeId }),
    });

/** End current session (user leaves without buying or wants to switch store) */
export const endSession = () =>
    apiFetch('/api/v1/cart/session/end', { method: 'POST' });

/** Scan a product barcode */
export const scanBarcode = (barcode) =>
    apiFetch('/api/v1/cart/scan', {
        method: 'POST',
        body: JSON.stringify({ barcode}),
    });

/** Get current cart */
export const getCart = () =>
    apiFetch('/api/v1/cart');

/** Update item quantity (0 = remove) */
export const updateQuantity = (barcode, quantity) =>
    apiFetch('/api/v1/cart/quantity', {
        method: 'PATCH',
        body: JSON.stringify({ barcode, quantity }),
    });

/** Remove item from cart */
export const removeItem = (barcode) =>
    apiFetch('/api/v1/cart/item', {
        method: 'DELETE',
        body: JSON.stringify({ barcode }),
    });

/** Get scan history for current session */
export const getScanHistory = () =>
    apiFetch('/api/v1/cart/scan-history');

// ══════════════════════════════════════════════════════════════
//  PAYMENT ENDPOINTS
// ══════════════════════════════════════════════════════════════

/** Poll payment/order status */
export const getPaymentStatus = (orderId) =>
    apiFetch(`/api/v1/payment/status/${orderId}`);

/** Initiate online payment → returns QR code (already PAID) */
export const initiateOnlinePayment = (gateway) =>
    apiFetch('/api/v1/payment/initiate/online', {
        method: 'POST',
        body: JSON.stringify({ gateway }),
    });

/** Initiate cash payment → returns QR for billing counter */
export const initiateCashPayment = () =>
    apiFetch('/api/v1/payment/initiate/cash', { method: 'POST' });

/** Get payment history */
export const getPaymentHistory = (page = 0, size = 20) =>
    apiFetch(`/api/v1/payment/history?page=${page}&size=${size}`);