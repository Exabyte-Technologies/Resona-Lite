import { StyleSheet, Switch, View } from 'react-native';
import { useAccessibilitySettings } from '../accessibility';
import { LocalizedText as Text, useLanguage } from '../i18n';
import { MotionPressable } from '../motion';
import { useThemeColors } from '../theme';
import Panel from './Panel';
import Icon from './Icon';

const appearances = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
] as const;

const options = [
  ['highContrast', 'Increase contrast'],
  ['reduceMotion', 'Reduce motion'],
  ['largerText', 'Larger text (200%)'],
] as const;

export default function AccessibilitySettings() {
  const colors = useThemeColors();
  const { preferences, updatePreferences } = useAccessibilitySettings();
  const { t } = useLanguage();
  return <Panel title="Accessibility" icon="tune" compact>
    <Text style={[styles.label, { color: colors.ink }]}>Appearance</Text>
    <View style={styles.appearances}>
      {appearances.map(([value, label]) => {
        const selected = preferences.appearance === value;
        return <MotionPressable
          key={value}
          accessibilityRole="radio"
          aria-checked={selected}
          onPress={() => updatePreferences({ appearance: value })}
          style={[styles.choice, { borderColor: colors.controlBorder, backgroundColor: selected ? colors.surfaceSelected : colors.surface }]}
        >
          <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
          {selected && <Icon name="check" size={16} />}
        </MotionPressable>;
      })}
    </View>
    {options.map(([key, label]) => <View key={key} style={styles.option}>
      <Text style={[styles.label, styles.optionLabel, { color: colors.ink }]}>{label}</Text>
      <Switch
        accessibilityLabel={t(label)}
        value={preferences[key]}
        onValueChange={value => updatePreferences({ [key]: value })}
        ios_backgroundColor={colors.controlBorder}
        trackColor={{ false: colors.controlBorder, true: colors.accent }}
        thumbColor={preferences[key] ? colors.accentInk : colors.surface}
      />
    </View>)}
  </Panel>;
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '600' },
  appearances: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { maxWidth: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  option: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  optionLabel: { flex: 1 },
});
