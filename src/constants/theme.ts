export const Palette = {
  light: {
    background: '#F4F7F6',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF2F1',
    border: '#E2E8E6',
    text: '#0F172A',
    textMuted: '#64748B',
    primary: '#10B981',
    primaryDark: '#059669',
    onPrimary: '#FFFFFF',
    income: '#059669',
    expense: '#DC2626',
    transfer: '#2563EB',
    warning: '#D97706',
  },
  dark: {
    background: '#0B1210',
    surface: '#131C19',
    surfaceAlt: '#1B2622',
    border: '#24322D',
    text: '#E8F0ED',
    textMuted: '#94A3B8',
    primary: '#34D399',
    primaryDark: '#10B981',
    onPrimary: '#052E22',
    income: '#34D399',
    expense: '#F87171',
    transfer: '#60A5FA',
    warning: '#FBBF24',
  },
} as const;

export type Colors = { [K in keyof typeof Palette.light]: string };

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;
export const MaxContentWidth = 900;
