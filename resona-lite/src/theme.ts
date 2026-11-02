import { Platform } from 'react-native';

export const colors = {
  background: '#121611',
  surface: '#1b2019',
  surfaceRaised: '#20271d',
  surfaceSelected: '#273121',
  surfaceSubtle: '#171c16',
  ink: '#f5f1e8',
  muted: '#a2a49b',
  dim: '#7e857a',
  accent: '#b9e68c',
  accentInk: '#15200f',
  selectedBorder: '#789763',
  iconSurface: 'rgba(255,255,255,0.06)',
  selectedIconSurface: 'rgba(185,230,140,0.12)',
  line: 'rgba(255,255,255,0.1)',
  error: '#e49b90',
} as const;

export const fonts = {
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) ?? 'System',
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) ?? 'Georgia',
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  page: 22,
} as const;
