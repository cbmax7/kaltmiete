import type { TextStyle } from 'react-native';

/**
 * Editorial dark palette — concrete greys with one acid accent, so the price
 * numerals stay the loudest thing on every screen.
 */
export const colors = {
  bg: '#0B0B0C',
  surface: '#141416',
  surfaceRaised: '#1C1C1F',
  border: '#2A2A2E',
  text: '#F5F5F0',
  muted: '#86868B',
  accent: '#D6FF3E',
  over: '#FF5A45',
  under: '#4EA8FF',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/**
 * Tight tracking on the display sizes; numerals are tabular so they don't jitter
 * when animating. `satisfies` (rather than `as const`) keeps the literal types
 * narrow while leaving `fontVariant` a mutable array RN will accept.
 */
export const type = {
  display: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
} satisfies Record<string, TextStyle>;
