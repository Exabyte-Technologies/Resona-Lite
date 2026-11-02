import { Platform } from 'react-native';

export const colors = {
  background: '#f4f7f3',
  surface: '#fbfcf8',
  surfaceRaised: '#edf2ee',
  surfaceSelected: '#dcefeb',
  surfaceSubtle: '#eef3f1',
  ink: '#183032',
  muted: '#526768',
  dim: '#697a79',
  accent: '#176d70',
  accentInk: '#f8fbf6',
  accentHighlight: '#10595d',
  selectedBorder: '#478688',
  iconSurface: '#e5ece8',
  selectedIconSurface: '#c7e2de',
  line: '#d6e0dc',
  shade: '#c5dcd5',
  ripple: '#5fa9a7',
  error: '#a64b45',
} as const;

export const fonts = {
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) ?? 'System',
  display: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) ?? 'System',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  page: 20,
} as const;
