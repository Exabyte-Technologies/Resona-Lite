import { Platform, useColorScheme } from 'react-native';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceSelected: string;
  surfaceSubtle: string;
  ink: string;
  muted: string;
  dim: string;
  accent: string;
  accentInk: string;
  accentHighlight: string;
  selectedBorder: string;
  iconSurface: string;
  selectedIconSurface: string;
  line: string;
  shade: string;
  ripple: string;
  error: string;
};

const lightColors: ThemeColors = {
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
};

const darkColors: ThemeColors = {
  background: '#101a1c',
  surface: '#192628',
  surfaceRaised: '#202f30',
  surfaceSelected: '#203b3a',
  surfaceSubtle: '#1d2b2d',
  ink: '#e4eeea',
  muted: '#b2c4bf',
  dim: '#91a5a0',
  accent: '#83c9bd',
  accentInk: '#102221',
  accentHighlight: '#a0d9ce',
  selectedBorder: '#5c9f96',
  iconSurface: '#293938',
  selectedIconSurface: '#2a4b47',
  line: '#344543',
  shade: '#0a1213',
  ripple: '#73bdb2',
  error: '#f0a19a',
};

export function useThemeColors() {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

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
