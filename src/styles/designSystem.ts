export const designSystem = {
  colors: {
    primary: '#1A2E40',
    secondary: '#C4A76A',
    text: '#2D3436',
    background: '#F9F9F9',
    gold: '#C4A76A',
    petrol: '#1A2E40',
    graphite: '#2D3436',
    snow: '#F9F9F9',
  },
  typography: {
    fontFamily: {
      main: 'Inter, sans-serif',
      headers: 'Söhne, sans-serif',
      ui: 'Manrope, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    base: 8,
    '2x': 16,
    '3x': 24,
    '4x': 32,
    '5x': 40,
    '6x': 48,
    '7x': 56,
    '8x': 64,
  },
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.08)',
    md: '0 4px 16px rgba(0,0,0,0.12)',
    lg: '0 8px 32px rgba(0,0,0,0.16)',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
} as const;

export type DesignSystem = typeof designSystem;
export type ColorKey = keyof typeof designSystem.colors;
export type FontFamily = keyof typeof designSystem.typography.fontFamily;
export type FontSize = keyof typeof designSystem.typography.fontSize;
export type FontWeight = keyof typeof designSystem.typography.fontWeight;