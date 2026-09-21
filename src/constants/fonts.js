// ─────────────────────────────────────────────────────────────
//  fonts.js — Shared typography constants matching its3lf.com
//  Manrope  → Headings / Brand / Titles
//  DM Sans  → Body / Buttons / Labels / UI Text
// ─────────────────────────────────────────────────────────────

export const Fonts = {
    // Manrope — headings
    heading: 'Manrope_800ExtraBold',
    headingBold: 'Manrope_700Bold',
    headingSemiBold: 'Manrope_600SemiBold',
    headingMedium: 'Manrope_500Medium',
    headingRegular: 'Manrope_400Regular',

    // DM Sans — body / UI
    body: 'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
    bodySemiBold: 'DMSans_600SemiBold',
    bodyBold: 'DMSans_700Bold',
};

// Letter spacing matching its3lf.com
export const LetterSpacing = {
    hero: -1.5,        // hero headings: -.075em on ~20px
    heading: -1.1,     // section h2: -.055em
    brand: -2,         // brand wordmark
    eyebrow: 1.6,      // uppercase badges / labels
    ticker: 2,         // all-caps ticker text
    body: -0.3,        // body paragraphs
};
