/**
 * Unclutr Design Tokens
 * "Calm Command Center" Design System
 * Premium, finance-grade aesthetics for B2B SaaS
 */

export const colors = {
    // Backgrounds
    bg: {
        primary: '#ffffff',
        secondary: '#fafafa', // zinc-50
        tertiary: '#f4f4f5',  // zinc-100
        hover: '#f4f4f5',
        active: '#e4e4e7',    // zinc-200
    },

    // Surfaces
    surface: {
        default: '#ffffff',
        elevated: '#ffffff',
        sunken: '#fafafa',
    },

    // Borders
    border: {
        subtle: '#f4f4f5',    // zinc-100
        default: '#e4e4e7',   // zinc-200
        strong: '#d4d4d8',    // zinc-300
        emphasis: '#18181b',  // zinc-900
    },

    // Text
    text: {
        primary: '#18181b',   // zinc-900
        secondary: '#71717a', // zinc-500
        tertiary: '#a1a1aa',  // zinc-400
        disabled: '#d4d4d8',  // zinc-300
        inverse: '#ffffff',
    },

    // Primary (Indigo)
    primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        500: '#6366f1',
        600: '#4f46e5',
        900: '#312e81',
    },

    // Semantic
    success: {
        bg: '#ecfdf5',        // emerald-50
        border: '#a7f3d0',    // emerald-200
        text: '#059669',      // emerald-600
    },
    warning: {
        bg: '#fffbeb',        // amber-50
        border: '#fde68a',    // amber-200
        text: '#d97706',      // amber-600
    },
    error: {
        bg: '#fef2f2',        // red-50
        border: '#fecaca',    // red-200
        text: '#dc2626',      // red-600
    },
} as const;

export const typography = {
    // Font Families
    fontFamily: {
        sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: '"SF Mono", "Roboto Mono", monospace',
    },

    // Font Sizes
    fontSize: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        base: '1rem',       // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
    },

    // Font Weights
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    // Line Heights
    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Letter Spacing
    letterSpacing: {
        tight: '-0.01em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },
} as const;

export const spacing = {
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    2: '0.5rem',      // 8px
    3: '0.75rem',     // 12px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    8: '2rem',        // 32px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
} as const;

export const borderRadius = {
    none: '0',
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
} as const;

export const shadows = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    drawer: '0 8px 32px rgba(0, 0, 0, 0.12)',
    focus: '0 0 0 3px rgba(79, 70, 229, 0.1)',
} as const;

export const motion = {
    // Durations
    duration: {
        instant: '150ms',
        quick: '200ms',
        standard: '300ms',
        slow: '500ms',
    },

    // Easing
    easing: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
} as const;

export const focusRing = {
    default: '0 0 0 3px rgba(79, 70, 229, 0.1)',
    error: '0 0 0 3px rgba(220, 38, 38, 0.1)',
    success: '0 0 0 3px rgba(5, 150, 105, 0.1)',
} as const;
