// ─────────────────────────────────────────────────────────────
//  globalStyles.js — App-wide typography system
//  Matches its3lf.com: Manrope (headings) + DM Sans (body)
// ─────────────────────────────────────────────────────────────

import { StyleSheet } from 'react-native';

// ── Font family constants ──────────────────────────────────────
export const F = {
    // Manrope — headings, brand, titles
    h1: { fontFamily: 'Manrope_800ExtraBold', letterSpacing: -1.5 },
    h2: { fontFamily: 'Manrope_700Bold', letterSpacing: -1.1 },
    h3: { fontFamily: 'Manrope_600SemiBold', letterSpacing: -0.6 },
    brand: { fontFamily: 'Manrope_800ExtraBold', letterSpacing: -2 },
    // DM Sans — body / UI
    body: { fontFamily: 'DMSans_400Regular' },
    bodyMd: { fontFamily: 'DMSans_500Medium' },
    bodySb: { fontFamily: 'DMSans_600SemiBold' },
    bodyBold: { fontFamily: 'DMSans_700Bold' },
    // Eyebrow / badge labels (uppercase small text)
    eyebrow: { fontFamily: 'DMSans_600SemiBold', letterSpacing: 1.6 },
};

export const typography = StyleSheet.create({
    // Headings — Manrope
    heroTitle: {
        fontFamily: 'Manrope_800ExtraBold',
        letterSpacing: -1.5,
    },
    sectionTitle: {
        fontFamily: 'Manrope_700Bold',
        letterSpacing: -1.1,
    },
    cardTitle: {
        fontFamily: 'Manrope_600SemiBold',
        letterSpacing: -0.6,
    },
    subTitle: {
        fontFamily: 'Manrope_500Medium',
        letterSpacing: -0.3,
    },
    // Body — DM Sans
    body: {
        fontFamily: 'DMSans_400Regular',
    },
    bodyMedium: {
        fontFamily: 'DMSans_500Medium',
    },
    bodySemiBold: {
        fontFamily: 'DMSans_600SemiBold',
    },
    bodyBold: {
        fontFamily: 'DMSans_700Bold',
    },
    // Badge / Eyebrow
    eyebrow: {
        fontFamily: 'DMSans_600SemiBold',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
    },
    // Button text
    button: {
        fontFamily: 'DMSans_700Bold',
        letterSpacing: 0.2,
    },
});
