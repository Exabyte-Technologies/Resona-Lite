import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';

export default function Panel({
  children,
  title,
  compact = false,
}: PropsWithChildren<{ title: string; compact?: boolean }>) {
  return (
    <View style={[styles.panel, compact && styles.compactPanel]}>
      <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  compactPanel: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 24,
  },
  compactTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
});
