import { Platform, StyleSheet, useWindowDimensions, type ModalProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibilitySettings } from './accessibility';

export function useTwoColumnLayout() {
  const { width } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const { fontScale } = useAccessibilitySettings();
  // Keep enough room for labels and sliders in both columns at the current text size.
  return (width - left - right) / Math.max(1, fontScale) >= 740;
}

export const cardLayout = StyleSheet.create({
  page: { width: '100%', maxWidth: 1180, alignSelf: 'center' },
  group: { gap: 16 },
  sideBySide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1, minWidth: 0 },
});

export const tabletModalOrientations: ModalProps['supportedOrientations'] =
  Platform.OS === 'ios' && Platform.isPad
    ? ['portrait', 'portrait-upside-down', 'landscape-left', 'landscape-right']
    : undefined;
