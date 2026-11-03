import { LocalizedText as Text } from '../i18n';
import { StyleSheet } from 'react-native';
import { fonts, spacing, useThemeColors } from '../theme';

export default function AudioErrorNotice({ message }: { message: string }) {
  const colors = useThemeColors();

  return (
    <Text
      accessibilityRole="alert"
      style={[
        styles.notice,
        {
          borderColor: colors.error,
          backgroundColor: colors.surface,
          color: colors.error,
        },
      ]}
    >
      Audio could not be prepared: {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: {
    marginHorizontal: spacing.page,
    marginTop: spacing.sm,
    padding: spacing.md,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
