import { tabletModalOrientations } from '../layout';
import { LocalizedText as Text, useLanguage } from '../i18n';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { type IconName } from './Icon';
import BlurBackdrop from './BlurBackdrop';
import { MotionPressable, useReducedMotion } from '../motion';
import { fonts, useThemeColors, type ThemeColors } from '../theme';
import { useAccessibilitySettings } from '../accessibility';

const steps = [
  { eyebrow:'A little space for you', title:'Find your kind of quiet', description:'On Home, choose Sleep, Meditation, Focus or Awake. Each mood gently tunes your soundscape. You can change it whenever you like.', hint:'No setup needed. Just choose how you want to feel.', icon:'meditation' },
  { eyebrow:'Your first listening session', title:'Press play. Settle in.', description:'Tap the round play button to start ambient music and binaural beats together. Use Master volume to find a comfortable level, and tap again to pause.', hint:'Headphones help you hear the separate binaural tones.', icon:'headphones' },
  { eyebrow:'Make it your own', title:'Shape your sound', description:'Open Advanced to blend ambient layers, choose an atmosphere and tonal centre, or add rain, ocean and other noise textures. Each track has its own play button and volume.', hint:'Start with small changes. You can keep things simple on Home.', icon:'tune' },
  { eyebrow:'Let the harmony unfold', title:'Explore living chords', description:'In Advanced, find Chord progression and tap Generate & apply. Starting chords are optional. Try C Amin F G, then turn on Continuous sets for evolving harmony.', hint:'The chord model runs on your device. To replay this tour, open Settings at the bottom of Advanced.', icon:'layers' },
] as const;

export default function Tutorial({ visible, showNotice, onClose }: { visible: boolean; showNotice: boolean; onClose: () => void }) {
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const noticeVisible = showNotice && !noticeDismissed;
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { rtl } = useLanguage();
  return <Modal supportedOrientations={tabletModalOrientations} visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => { if (!noticeVisible) onClose(); }} statusBarTranslucent>
    <View style={[overlayStyle, { paddingTop:Math.max(insets.top,20), paddingBottom:Math.max(insets.bottom,20),direction:rtl?'rtl':'ltr' }]}>
      <BlurBackdrop intensity={30} />
      <TutorialCard noticeVisible={noticeVisible} onAcceptNotice={() => setNoticeDismissed(true)} onClose={onClose} />
    </View>
  </Modal>;
}

const overlayStyle = StyleSheet.create({
  backdrop: { flex:1, paddingHorizontal:20, justifyContent:'center', alignItems:'center' },
}).backdrop;

export function TutorialCard({ noticeVisible = false, onAcceptNotice, onClose }: { noticeVisible?: boolean; onAcceptNotice?: () => void; onClose: () => void }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const { spacious } = useAccessibilitySettings();
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [progress] = useState(() => new Animated.Value(1));
  useEffect(() => () => progress.stopAnimation(), [progress]);
  useEffect(() => {
    if (!reduceMotion) return;
    progress.stopAnimation(() => {
      progress.setValue(1);
      setTransitioning(false);
    });
  }, [progress, reduceMotion]);
  const current = steps[step];
  const {t}=useLanguage();
  const go = (next: number) => {
    if (transitioning || next === step) return;
    const update = () => {
      setStep(next);
      AccessibilityInfo.announceForAccessibility(t('Step {{current}} of {{total}}',{current:next+1,total:steps.length})+'. '+t(steps[next].title));
    };
    if (reduceMotion) { update(); return; }
    setTransitioning(true);
    Animated.timing(progress, { toValue:0, duration:120, useNativeDriver:true }).start(({ finished }) => {
      if (!finished) return;
      update();
      Animated.timing(progress, { toValue:1, duration:260, easing:Easing.out(Easing.cubic), useNativeDriver:true }).start(() => setTransitioning(false));
    });
  };
  return <View style={styles.card} accessibilityViewIsModal>
    <View style={styles.topBar}>
      <Text style={styles.brand}>resona<Text style={{ color:colors.accent }}>.</Text><Text style={styles.lite}>  LITE</Text></Text>
      {!noticeVisible && <MotionPressable accessibilityRole="button" accessibilityLabel="Skip tutorial" onPress={onClose} style={styles.textButton}><Text style={styles.secondaryText}>Skip tour</Text></MotionPressable>}
    </View>
    {noticeVisible ? <>
      <ScrollView contentContainerStyle={styles.noticeBody}>
        <Text accessibilityRole="header" style={styles.title}>Health notice</Text>
        <Text style={styles.description}>Resona Lite is for relaxation. It does not provide medical advice or diagnose, treat, or cure any health condition. It is not a substitute for professional care.</Text>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.actions}>
          <MotionPressable accessibilityRole="button" onPress={onAcceptNotice} style={styles.nextButton}>
            <Text style={styles.nextText}>Continue</Text>
          </MotionPressable>
        </View>
      </View>
    </> : <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <Animated.View style={{ opacity:progress, transform:[{ translateY:progress.interpolate({ inputRange:[0,1], outputRange:[10,0] }) }] }}>
          {!spacious && <TutorialArtwork step={step} icon={current.icon} />}
          <Text style={styles.eyebrow}>{current.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>
          <View style={styles.hint}><View style={styles.hintDot} /><Text style={styles.hintText}>{current.hint}</Text></View>
        </Animated.View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.progressRow}>
          <Text style={styles.stepText}>{t('Step {{current}} of {{total}}',{current:step+1,total:steps.length})}</Text>
          {!spacious && <View style={styles.dots}>
            {steps.map((item,index) => <View key={item.title} accessible={false} style={styles.dotTarget}><View style={[styles.dot,index === step && styles.dotActive]} /></View>)}
          </View>}
        </View>
        <View style={styles.actions}>
          {step > 0 ? <MotionPressable accessibilityRole="button" disabled={transitioning} onPress={() => go(step-1)} style={styles.backButton}><Text style={styles.secondaryText}>Back</Text></MotionPressable> : null}
          <MotionPressable accessibilityRole="button" disabled={transitioning} onPress={() => step === steps.length-1 ? onClose() : go(step+1)} style={[styles.nextButton, transitioning && { opacity:0.6 }]}><Text style={styles.nextText}>{step === steps.length-1 ? 'Let’s begin' : 'Continue'}<Text>  →</Text></Text></MotionPressable>
        </View>
      </View>
    </>}
  </View>;
}

function TutorialArtwork({ step, icon }: { step: number; icon: IconName }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View accessible={false} style={styles.artwork}>
    <View style={styles.orbitOuter} /><View style={styles.orbitInner} />
    <View style={styles.artworkIcon}><Icon name={icon} size={32} color={colors.accent} /></View>
    {step === 0 ? <View style={styles.artworkChips}>{['Sleep','Meditation','Focus'].map((label,index) => <View key={label} style={[styles.chip,index === 1 && styles.chipSelected]}><Text style={styles.chipText}>{label}</Text></View>)}</View> : null}
    {step === 1 ? <View style={styles.artworkChips}><View style={styles.miniTrack}><View style={styles.miniFill} /><View style={styles.miniThumb} /></View></View> : null}
    {step === 2 ? <View style={styles.artworkChips}>{['Warmth','Space','Texture'].map(label => <View key={label} style={styles.chip}><Text style={styles.chipText}>{label}</Text></View>)}</View> : null}
    {step === 3 ? <View style={styles.artworkChips}>{['C','Amin','F','G'].map((label,index) => <View key={label} style={[styles.chip,index === 0 && styles.chipSelected]}><Text style={styles.chipText}>{label}</Text></View>)}</View> : null}
  </View>;
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card:{ width:'100%', maxWidth:420, maxHeight:'100%', backgroundColor:c.surface, borderRadius:28, borderWidth:1, borderColor:c.line, overflow:'hidden' },
    topBar:{ flexDirection:'row', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', paddingHorizontal:24, paddingTop:12, gap:8 },
    brand:{ fontSize:23, fontWeight:'700', letterSpacing:-1, color:c.ink, fontFamily:fonts.body },
    lite:{ fontSize:10, letterSpacing:2, fontWeight:'500', color:c.dim },
    textButton:{ minHeight:44, maxWidth:'100%', paddingHorizontal:4, justifyContent:'center' },
    body:{ paddingHorizontal:24, paddingTop:8, paddingBottom:8 },
    noticeBody:{ paddingHorizontal:24, paddingTop:20, paddingBottom:16 },
    artwork:{ height:170, alignItems:'center', justifyContent:'center', marginBottom:20, marginTop:8, backgroundColor:c.surfaceSubtle, borderRadius:22, overflow:'hidden' },
    orbitOuter:{ position:'absolute', width:156, height:156, top:-15, borderRadius:80, borderWidth:1, borderColor:c.line },
    orbitInner:{ position:'absolute', width:114, height:114, top:6, borderRadius:60, borderWidth:1, borderColor:c.selectedBorder, opacity:0.35 },
    artworkIcon:{ width:74, height:74, marginTop:-40, borderRadius:38, backgroundColor:c.selectedIconSurface, alignItems:'center', justifyContent:'center' },
    artworkChips:{ position:'absolute', bottom:18, flexDirection:'row', justifyContent:'center', gap:6 },
    chip:{ paddingVertical:8, paddingHorizontal:10, backgroundColor:c.surface, borderRadius:10, borderWidth:1, borderColor:c.line },
    chipSelected:{ backgroundColor:c.surfaceSelected, borderColor:c.selectedBorder },
    chipText:{ color:c.accent, fontSize:11, fontWeight:'500' },
    miniTrack:{ width:178, height:5, backgroundColor:c.line, borderRadius:4, marginVertical:15 },
    miniFill:{ width:'60%', height:5, borderRadius:4, backgroundColor:c.accent },
    miniThumb:{ position:'absolute', top:-5, left:'58%', width:15, height:15, backgroundColor:c.accent, borderRadius:8 },
    eyebrow:{ fontSize:11, fontWeight:'600', letterSpacing:0.6, color:c.accent, marginBottom:9 },
    title:{ fontSize:28, lineHeight:34, letterSpacing:-0.6, fontWeight:'600', color:c.ink, marginBottom:12, fontFamily:fonts.display },
    description:{ fontSize:15, lineHeight:23, color:c.muted, fontFamily:fonts.body },
    hint:{ flexDirection:'row', gap:8, paddingTop:16, paddingBottom:8 },
    hintDot:{ width:5, height:5, borderRadius:3, backgroundColor:c.accent, marginTop:6 },
    hintText:{ flex:1, color:c.dim, fontSize:12, lineHeight:18 },
    footer:{ paddingHorizontal:24, paddingBottom:24, paddingTop:4 },
    progressRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
    stepText:{ fontSize:11, color:c.dim },
    dots:{ flexDirection:'row' },
    dotTarget:{ minHeight:44, width:28, alignItems:'center', justifyContent:'center' },
    dot:{ width:5, height:5, borderRadius:3, backgroundColor:c.line },
    dotActive:{ width:16, backgroundColor:c.accent },
    actions:{ flexDirection:'row', gap:10 },
    backButton:{ minHeight:50, maxWidth:'44%', paddingHorizontal:8, paddingVertical:6, borderRadius:16, borderWidth:1, borderColor:c.controlBorder, alignItems:'center', justifyContent:'center' },
    secondaryText:{ fontSize:13, fontWeight:'500', color:c.muted, textAlign:'center' },
    nextButton:{ flex:1, minHeight:50, padding:8, borderRadius:16, alignItems:'center', justifyContent:'center', backgroundColor:c.accent },
    nextText:{ fontSize:14, fontWeight:'600', color:c.accentInk, textAlign:'center' },
  });
}
