import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';

export default function Panel({
  children,
  title,
  eyebrow,
}: PropsWithChildren<{ title: string; eyebrow?: string }>) {
  return (
    <View style={styles.panel}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 26,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  eyebrow: {
    marginBottom: -spacing.sm,
    color: colors.accent,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
  },
});
