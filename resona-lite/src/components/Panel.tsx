import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon, { type IconName } from './Icon';
import { fonts, spacing, useThemeColors } from '../theme';

export default function Panel({
  children,
  title,
  icon = 'layers',
  compact = false,
}: PropsWithChildren<{ title: string; icon?: IconName; compact?: boolean }>) {
  const colors = useThemeColors();

  return (
    <View style={[
      styles.panel,
      { backgroundColor: colors.surface, borderColor: colors.line },
      compact && styles.compactPanel,
    ]}>
      <View style={styles.heading}>
        <View style={[styles.iconWell, { backgroundColor: colors.iconSurface }]}>
          <Icon name={icon} color={colors.accent} size={18} />
        </View>
        <Text style={[styles.title, { color: colors.ink }, compact && styles.compactTitle]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    gap: spacing.sm,
  },
  compactPanel: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 24,
  },
  compactTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  heading: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
});
