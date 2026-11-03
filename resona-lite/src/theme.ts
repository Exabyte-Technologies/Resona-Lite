import { Platform } from 'react-native';
import { useAccessibilitySettings, useAppColorScheme } from './accessibility';

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
  controlBorder: string;
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
  muted: '#4e6263',
  dim: '#4e6261',
  accent: '#125f62',
  accentInk: '#f8fbf6',
  accentHighlight: '#10595d',
  selectedBorder: '#478688',
  iconSurface: '#e5ece8',
  selectedIconSurface: '#c7e2de',
  line: '#d6e0dc',
  controlBorder: '#647c78',
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
  controlBorder: '#819892',
  shade: '#0a1213',
  ripple: '#73bdb2',
  error: '#f0a19a',
};

const lightHighContrast: ThemeColors = {
  ...lightColors,
  ink: '#102526', muted: '#253c3b', dim: '#334a49', accent: '#084e51',
  accentHighlight: '#064448', line: '#536a66', controlBorder: '#425b56', selectedBorder: '#084e51',
};

const darkHighContrast: ThemeColors = {
  ...darkColors,
  ink: '#f7fffc', muted: '#d8e9e4', dim: '#c0d4ce', accent: '#a3e6d9',
  accentHighlight: '#bcf5ea', line: '#819892', controlBorder: '#aec6bf', selectedBorder: '#a3e6d9',
};

export function useThemeColors() {
  const isDark = useAppColorScheme() === 'dark';
  const { highContrast } = useAccessibilitySettings();
  return isDark ? (highContrast ? darkHighContrast : darkColors) : (highContrast ? lightHighContrast : lightColors);
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
