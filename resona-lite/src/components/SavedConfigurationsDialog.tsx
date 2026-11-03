import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text as UserText, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibilitySettings } from '../accessibility';
import { LocalizedText as Text, useLanguage } from '../i18n';
import { tabletModalOrientations } from '../layout';
import { MotionPressable, useReducedMotion } from '../motion';
import { usePlayer } from '../player-context';
import { sameConfiguration, type SavedConfiguration } from '../sound-configurations';
import { useThemeColors } from '../theme';
import BlurBackdrop from './BlurBackdrop';

type Form = { item?: SavedConfiguration; name: string };
type Confirmation = { message: string; label: string; run: () => boolean | void };

export default function SavedConfigurationsDialog({ onClose }: { onClose: () => void }) {
  const player = usePlayer();
  const colors = useThemeColors();
  const { textMultiplier } = useAccessibilitySettings();
  const { t, rtl } = useLanguage();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [form, setForm] = useState<Form>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [error, setError] = useState('');
  const clear = () => { setForm(undefined); setConfirmation(undefined); setError(''); };
  const dismiss = form || confirmation ? clear : onClose;
  const finish = (result: boolean | void) => {
    if (result === false) setError('Could not save configurations.');
    else clear();
  };
  const ask = (message: string, label: string, run: Confirmation['run']) => {
    setError('');
    setConfirmation({ message, label, run });
  };
  const load = (item: SavedConfiguration) => {
    if (!sameConfiguration(player.currentConfiguration(), item.configuration)) {
      ask('Replace your current sound settings?', 'Load', () => {
        player.loadConfiguration(item.configuration);
        onClose();
      });
    } else onClose();
  };
  const save = () => {
    const name = form?.name.trim();
    if (!name) { setError('Enter a name.'); return; }
    if (player.savedConfigurations.some(item => item.id !== form?.item?.id &&
      item.name.toLowerCase() === name.toLowerCase())) {
      setError('This name is already in use.');
      return;
    }
    finish(form?.item ? player.renameConfiguration(form.item.id, name) : player.saveConfiguration(name));
  };
  const button = (label: string, action: () => void, disabled = false, name?: string) => (
    <MotionPressable accessibilityRole="button" accessibilityLabel={name ? `${t(label)} ${name}` : label}
      disabled={disabled} accessibilityState={{ disabled }} onPress={action}
      style={[styles.button, { borderColor: colors.controlBorder, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={{ color: colors.accent, fontWeight: '600' }}>{label}</Text>
    </MotionPressable>
  );

  return <Modal visible supportedOrientations={tabletModalOrientations} transparent statusBarTranslucent
    animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={dismiss}>
    <View style={[styles.overlay, {
      paddingTop: Math.max(16, insets.top), paddingBottom: Math.max(16, insets.bottom),
      paddingLeft: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right),
      direction: rtl ? 'rtl' : 'ltr',
    }]}>
      <BlurBackdrop />
      <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.surfaceSubtle, borderColor: colors.controlBorder }]}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>Saved configurations</Text>
          {button(form || confirmation ? 'Back' : 'Done', dismiss)}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          {form ? <>
            <TextInput accessibilityLabel={t('Configuration name')} placeholder={t('Configuration name')}
              placeholderTextColor={colors.muted} value={form.name} maxLength={60}
              onChangeText={name => { setForm({ ...form, name }); setError(''); }}
              onSubmitEditing={save} returnKeyType="done"
              style={[styles.input, { color: colors.ink, borderColor: colors.controlBorder, fontSize: 17 * textMultiplier }]} />
            <View style={styles.actions}>{button('Cancel', clear)}{button('Save', save)}</View>
          </> : confirmation ? <>
            <Text style={{ color: colors.ink }}>{confirmation.message}</Text>
            <View style={styles.actions}>{button('Cancel', clear)}{button(confirmation.label, () => finish(confirmation.run()))}</View>
          </> : <>
            <Text style={{ color: colors.muted }}>Saved on device</Text>
            <View style={styles.actions}>
              {button('Save current configuration', () => { setError(''); setForm({ name: '' }); }, !player.audioReady)}
            </View>
            {player.savedConfigurations.map((item, index) => (
              <View key={item.id} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.controlBorder }]}>
                <UserText style={[styles.name, { color: colors.ink, fontSize: 16 * textMultiplier }]}>{item.name}</UserText>
                <View style={styles.actions}>
                  {button('Load', () => load(item), !player.audioReady, item.name)}
                  {button('Rename', () => { setError(''); setForm({ item, name: item.name }); }, false, item.name)}
                  {button('Delete', () => ask('Delete this configuration?', 'Delete', () => player.deleteConfiguration(item.id)), false, item.name)}
                  {button('Move up', () => finish(player.moveConfiguration(item.id, -1)), index === 0, item.name)}
                  {button('Move down', () => finish(player.moveConfiguration(item.id, 1)), index === player.savedConfigurations.length - 1, item.name)}
                </View>
              </View>
            ))}
            <View style={styles.actions}>
              {button('Reset current sound', () => ask('Restore the default sound settings?', 'Reset', () => player.resetSound(false)), !player.audioReady)}
              {button('Reset all sound settings', () => ask('Restore the default sound settings and delete all saved configurations?', 'Reset', () => player.resetSound(true)), !player.audioReady)}
            </View>
          </>}
          {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 560, maxHeight: '100%', borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  title: { flex: 1, fontSize: 21, fontWeight: '700' },
  body: { padding: 16, gap: 14 },
  item: { padding: 12, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  name: { fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { maxWidth: '100%', minHeight: 44, paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10 },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, padding: 10 },
});
