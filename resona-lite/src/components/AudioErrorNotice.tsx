import { StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '../theme';

export default function AudioErrorNotice({ message }: { message: string }) {
  return (
    <Text accessibilityRole="alert" style={styles.notice}>
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
    borderColor: colors.error,
    backgroundColor: colors.surface,
    color: colors.error,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
