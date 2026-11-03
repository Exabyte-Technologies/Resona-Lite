import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LANGUAGES, LocalizedText as Text, useLanguage } from '../i18n';
import { tabletModalOrientations } from '../layout';
import { MotionEntrance, MotionPressable, useReducedMotion } from '../motion';
import { useThemeColors } from '../theme';
import AccessibilitySettings from './AccessibilitySettings';
import BlurBackdrop from './BlurBackdrop';
import Icon from './Icon';
import { LanguageOptions } from './LanguagePicker';
import { TutorialCard } from './Tutorial';

type Page = 'settings' | 'language' | 'tour';

export default function SettingsDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [page, setPage] = useState<Page>('settings');
  const { language, rtl } = useLanguage();
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const goBack = () => setPage('settings');
  const dismiss = page === 'settings' ? onClose : goBack;

  return <Modal supportedOrientations={tabletModalOrientations} visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={dismiss} statusBarTranslucent>
    <View style={[styles.overlay, {
      paddingTop: Math.max(16, insets.top),
      paddingBottom: Math.max(16, insets.bottom),
      paddingLeft: Math.max(16, insets.left),
      paddingRight: Math.max(16, insets.right),
      direction: rtl ? 'rtl' : 'ltr',
    }]}>
      <BlurBackdrop />
      {page === 'tour' ? <TutorialCard onClose={goBack} /> :
        <MotionEntrance dialog visible={visible} transitionKey={page} accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.surfaceSubtle, borderColor: colors.controlBorder }]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>{page === 'settings' ? 'Settings' : 'Choose your language'}</Text>
            <MotionPressable accessibilityRole="button" onPress={dismiss} style={styles.action}>
              <Text style={[styles.label, { color: colors.accent }]}>{page === 'settings' ? 'Done' : 'Back'}</Text>
            </MotionPressable>
          </View>
          <ScrollView key={page} contentContainerStyle={styles.body}>
            {page === 'language' ? <LanguageOptions /> : <>
              <AccessibilitySettings />
              <View style={[styles.links, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <MotionPressable accessibilityRole="button" onPress={() => setPage('language')} style={styles.link}>
                  <Icon name="language" size={18} />
                  <Text style={[styles.label, styles.flex, { color: colors.ink }]}>Change language</Text>
                  <Text style={[styles.language, { color: colors.muted }]}>{LANGUAGES.find(item => item.code === language)?.name}</Text>
                </MotionPressable>
                <MotionPressable accessibilityRole="button" onPress={() => setPage('tour')} style={[styles.link, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line }]}>
                  <Icon name="layers" size={18} />
                  <Text style={[styles.label, styles.flex, { color: colors.ink }]}>Quick tour</Text>
                </MotionPressable>
              </View>
            </>}
          </ScrollView>
        </MotionEntrance>
      }
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dialog: { width: '100%', maxWidth: 500, maxHeight: '100%', borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  title: { flex: 1, fontSize: 23, fontWeight: '700' },
  action: { minHeight: 44, maxWidth: '40%', paddingHorizontal: 4, justifyContent: 'center' },
  body: { padding: 16, gap: 12 },
  flex: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600' },
  links: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, minHeight: 48 },
  language: { fontSize: 13, maxWidth: '40%' },
});
