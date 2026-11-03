import { LocalizedText as Text } from '../i18n';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { MotionEntrance } from '../motion';
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
    <MotionEntrance style={[
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
    </MotionEntrance>
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
    flexShrink: 1,
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
