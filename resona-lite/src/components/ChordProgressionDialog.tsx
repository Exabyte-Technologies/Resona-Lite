import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalizedText as Text, useLanguage } from '../i18n';
import { tabletModalOrientations } from '../layout';
import { MotionEntrance, MotionPressable, useReducedMotion } from '../motion';
import { usePlayer } from '../player-context';
import { fonts, useThemeColors } from '../theme';
import BlurBackdrop from './BlurBackdrop';
import Icon from './Icon';
import RangeControl from './RangeControl';

export default function ChordProgressionDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, chordEditor, engineState, command, generateChords, audioReady } = usePlayer();
  const colors = useThemeColors();
  const { t, rtl } = useLanguage();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const generating = engineState?.generating ?? false;
  return <Modal supportedOrientations={tabletModalOrientations} visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
    <View style={[styles.overlay, { paddingTop:Math.max(insets.top,24), paddingBottom:Math.max(insets.bottom,24), direction:rtl?'rtl':'ltr' }]}>
      <BlurBackdrop intensity={22} />
      <Pressable accessible={false} onPress={onClose} style={StyleSheet.absoluteFill} />
      <MotionEntrance dialog visible={visible} accessibilityViewIsModal style={[styles.card, { backgroundColor:colors.surface, borderColor:colors.line }]}>
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor:colors.iconSurface }]}><Icon name="layers" size={20} /></View>
          <Text accessibilityRole="header" style={[styles.title, { color:colors.ink }]}>Chord progression</Text>
          <MotionPressable accessibilityRole="button" accessibilityLabel={t('Close chord progression')} onPress={onClose} style={styles.closeButton}><Text style={{ color:colors.accent, fontWeight:'600', fontSize:14 }}>Done</Text></MotionPressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <View style={styles.switchRow}>
            <Text style={[styles.label, { color:colors.ink }]}>Enable chord progression</Text>
            <Switch accessibilityLabel={t('Enable chord progression')} disabled={!audioReady} value={chordEditor.enabled} onValueChange={enabled => command('setChordProgressionEnabled', enabled)} />
          </View>
          <RangeControl title="Chord transition" description="Ambient and binaural" minimum={0} maximum={4} step={0.1} unit=" s" value={settings.chordTransition} onChange={value => command('setChordTransitions', value)} />
          <MotionPressable accessibilityRole="button" accessibilityState={{ disabled:!audioReady || generating }} disabled={!audioReady || generating} onPress={() => generateChords({ ...chordEditor, seedChords:chordEditor.seed.split(/[\s,]+/).filter(Boolean) })} style={[styles.regenerate, { backgroundColor:colors.surfaceSubtle, borderColor:colors.controlBorder, opacity:!audioReady || generating ? 0.55 : 1 }]}>
            <Icon name="layers" size={17} />
            <Text style={[styles.buttonText, { color:colors.accent }]}>{generating ? 'Generating…' : 'Regenerate chords'}</Text>
          </MotionPressable>
          <Text accessibilityLiveRegion="polite" style={[styles.status, { color:colors.muted }]}>{engineState?.chordStatus ?? 'Offline chord model ready to load.'}</Text>
        </ScrollView>
      </MotionEntrance>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay:{ flex:1, paddingHorizontal:24, alignItems:'center', justifyContent:'center' },
  card:{ width:'100%', maxWidth:420, maxHeight:'100%', borderRadius:26, borderWidth:StyleSheet.hairlineWidth, overflow:'hidden' },
  heading:{ flexDirection:'row', alignItems:'center', gap:10, paddingLeft:20, paddingRight:12, paddingTop:12 },
  icon:{ width:36, height:36, borderRadius:12, alignItems:'center', justifyContent:'center' },
  title:{ flex:1, fontFamily:fonts.display, fontWeight:'600', fontSize:19 },
  closeButton:{ minHeight:44, minWidth:50, maxWidth:'45%', alignItems:'center', justifyContent:'center', padding:4 },
  body:{ paddingHorizontal:20, paddingTop:20, paddingBottom:24, gap:24 },
  switchRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:12 },
  label:{ flex:1, fontFamily:fonts.body, fontSize:15, fontWeight:'600' },
  regenerate:{ minHeight:44, paddingHorizontal:12, paddingVertical:12, borderRadius:12, borderWidth:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 },
  buttonText:{ flexShrink:1, fontFamily:fonts.body, fontSize:14, fontWeight:'600' },
  status:{ fontFamily:fonts.body, fontSize:13, lineHeight:19 },
});
