import { Modal, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibilitySettings } from '../accessibility';
import { LocalizedText as Text, useLanguage } from '../i18n';
import { MotionPressable, useReducedMotion } from '../motion';
import { useThemeColors } from '../theme';
import BlurBackdrop from './BlurBackdrop';
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

export default function AccessibilitySettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const { preferences, updatePreferences } = useAccessibilitySettings();
  const { t, rtl } = useLanguage();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  return <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
    <View style={[styles.overlay, {
      paddingTop: Math.max(16, insets.top),
      paddingBottom: Math.max(16, insets.bottom),
      direction: rtl ? 'rtl' : 'ltr',
    }]}>
      <BlurBackdrop />
      <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.controlBorder }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>Accessibility</Text>
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
        </ScrollView>
        <View style={styles.footer}>
          <MotionPressable accessibilityRole="button" onPress={onClose} style={[styles.done, { backgroundColor: colors.accent }]}>
            <Text style={[styles.label, { color: colors.accentInk }]}>Done</Text>
          </MotionPressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  card: { width: '100%', maxWidth: 420, maxHeight: '100%', borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  content: { padding: 20, gap: 14 },
  title: { fontSize: 23, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '600' },
  appearances: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { maxWidth: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  option: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  optionLabel: { flex: 1 },
  footer: { paddingHorizontal: 20, paddingBottom: 20 },
  done: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 8 },
});
