import { useHomeQuote } from '../quotes';
import SleepTimer from '../components/SleepTimer';
import { LocalizedText as Text } from '../i18n';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { Mode, SoundSettings } from '../model';
import { MODES } from '../model';
import AudioErrorNotice from '../components/AudioErrorNotice';
import { useAccessibilitySettings } from '../accessibility';
import Icon, { type IconName } from '../components/Icon';
import RangeControl from '../components/RangeControl';
import Panel from '../components/Panel';
import LayerBalanceDialog from '../components/LayerBalanceDialog';
import type { LayerVolumeKey } from '../components/LayerBalanceControls';
import { fonts, spacing, useThemeColors, type ThemeColors } from '../theme';
import { MotionPressable, SelectionWash, useMotionValue, useReducedMotion } from '../motion';

type Props = {
  timer?: {deadline:number|null;remaining:number;finished:boolean;onChange:(minutes:number|null)=>void};
  controls?: {supported:boolean;enabled:boolean;error:string|null;toggle:()=>void};
  settings: SoundSettings;
  isPlaying: boolean;
  audioReady: boolean;
  audioError: string | null;
  onTogglePlayback: () => void;
  onSelectMode: (mode: Mode) => void;
  onMasterVolumeChange: (value: number) => void;
  onLayerVolumeChange: (key: LayerVolumeKey, value: number) => void;
};

const modeIcons: Record<Mode, IconName> = {
  sleep: 'sleep',
  meditation: 'meditation',
  focus: 'focus',
  awake: 'awake',
};

export default function HomeScreen({
  settings,
  timer, controls,
  isPlaying,
  audioReady,
  audioError,
  onTogglePlayback,
  onSelectMode,
  onMasterVolumeChange,
  onLayerVolumeChange,
}: Props) {
  const { quote } = useHomeQuote();
  const colors = useThemeColors();
  const { spacious } = useAccessibilitySettings();
  const styles = useMemo(() => createStyles(colors, spacious), [colors, spacious]);
  const [playFocused, setPlayFocused] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [focusedMode, setFocusedMode] = useState<Mode | null>(null);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {audioError ? <AudioErrorNotice message={audioError} /> : null}
        <View style={styles.intro}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrowText}>A little space to reset</Text>
          </View>
          <Text style={styles.title}>{quote}</Text>
          <Text style={styles.description}>
            Choose a listening mode and shape the sound around you.
          </Text>
        </View>

        <View style={styles.player}>
          <View style={styles.playerHeading}>
            <View style={styles.playerCopy}>
              <Text style={styles.playerTitle}>Your soundscape</Text>
              <View style={styles.headphones}>
                <Icon name="headphones" color={colors.muted} size={14} />
                <Text style={styles.playerHint}>Headphones recommended</Text>
              </View>
            </View>
            <View style={[styles.statusPill, isPlaying && styles.statusPillPlaying]}>
              <View style={[styles.statusDot, isPlaying && styles.statusDotPlaying]} />
              <Text accessibilityLiveRegion="polite" style={styles.playState}>
                {isPlaying ? 'Playing' : audioReady ? 'Ready' : 'Tuning'}
              </Text>
            </View>
          </View>

          <View style={styles.listeningArea}>
            <WaterRings isPlaying={isPlaying} />
            <MotionPressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !audioReady }}
              accessibilityLabel={isPlaying ? 'Pause your soundscape' : 'Play your soundscape'}
              disabled={!audioReady}
              onPress={onTogglePlayback}
              onFocus={() => setPlayFocused(true)}
              onBlur={() => setPlayFocused(false)}
              style={({ pressed }) => [
                styles.playButton,
                isPlaying && styles.playButtonActive,
                !audioReady && styles.playButtonDisabled,
                playFocused && styles.focused,
                pressed && audioReady && styles.playButtonActive,
              ]}
            >
              <PlayGlyph isPlaying={isPlaying} />
            </MotionPressable>
          </View>
          <Text style={styles.playPrompt}>
            {audioReady ? (isPlaying ? 'Pause soundscape' : 'Start listening') : 'Preparing sound'}
          </Text>

          <View style={styles.volumeArea}>
            <RangeControl
              title="Master volume"
              description="All sound layers"
              value={settings.masterVolume}
              minimum={0}
              maximum={100}
              unit="%"
              onChange={onMasterVolumeChange}
            />
          </View>
          <MotionPressable accessibilityRole="button" accessibilityLabel="Open layer balance" onPress={() => setBalanceVisible(true)} style={styles.balanceButton}>
            <Icon name="balance" size={17} />
            <Text style={styles.balanceButtonText}>Layer balance</Text>
          </MotionPressable>
        </View>

        <Panel title="Choose a mood" icon="meditation" compact>
          <Text style={styles.modeNote}>
            Each mode tunes your binaural beat and ambient layers. Fine-tune everything in Advanced.
          </Text>
          <View style={styles.modeGrid}>
            {MODES.map((mode) => {
              const selected = settings.mode === mode.id;
              return (
                <MotionPressable
                  key={mode.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSelectMode(mode.id)}
                  onFocus={() => setFocusedMode(mode.id)}
                  onBlur={() => setFocusedMode(null)}
                  style={({ pressed }) => [
                    styles.modeButton,
                    selected && styles.modeButtonSelected,
                    focusedMode === mode.id && styles.focused,
                    pressed && styles.modeButtonPressed,
                  ]}
                >
                  <SelectionWash selected={selected} color={colors.surfaceSelected} />
                  <View style={[styles.modeIcon, selected && styles.modeIconSelected]}>
                    <Icon
                      name={modeIcons[mode.id]}
                      color={selected ? colors.accent : colors.dim}
                      size={18}
                    />
                  </View>
                  <View style={styles.modeCopy}>
                    <Text style={[styles.modeName, selected && styles.modeNameSelected]}>
                      {mode.title}
                    </Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                  </View>
                  {selected && <Icon name="check" size={16} />}
                </MotionPressable>
              );
            })}
          </View>
        </Panel>
        {timer?<SleepTimer {...timer}/>:null}
        {controls?.supported?<View><MotionPressable accessibilityRole="button" onPress={controls.toggle} style={{minHeight:44,justifyContent:'center',alignItems:'center'}}><Text style={{color:colors.accent,textDecorationLine:'underline',fontSize:13}}>{controls.enabled?'Disable Live Activity':'Enable Live Activity'}</Text></MotionPressable>{controls.error?<Text accessibilityLiveRegion="polite" style={{color:colors.muted,fontSize:12}}>{controls.error}</Text>:null}</View>:null}
      </ScrollView>
      <LayerBalanceDialog visible={balanceVisible} onClose={() => setBalanceVisible(false)} settings={settings} onChange={onLayerVolumeChange} />
    </>
  );
}

function WaterRings({ isPlaying }: { isPlaying: boolean }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [progress] = useState(() => new Animated.Value(0));
  const reduceMotion = useReducedMotion();
  const activity = useMotionValue(isPlaying && !reduceMotion ? 1 : 0, 650);
  useEffect(() => {
    if (!isPlaying || reduceMotion) {
      const settle = Animated.timing(progress, { toValue:0, duration:reduceMotion ? 0 : 650, easing:Easing.out(Easing.cubic), useNativeDriver:true, isInteraction:false });
      settle.start();
      return () => settle.stop();
    }
    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue:1, duration:2600, easing:Easing.inOut(Easing.sin), useNativeDriver:true, isInteraction:false }),
      Animated.timing(progress, { toValue:0, duration:2600, easing:Easing.inOut(Easing.sin), useNativeDriver:true, isInteraction:false }),
    ]), { iterations:-1, resetBeforeIteration:false });
    breathe.start();
    return () => breathe.stop();
  }, [isPlaying, progress, reduceMotion]);
  if (reduceMotion) return <View pointerEvents="none" style={styles.rings}>
    <View style={[styles.ring, styles.outerRing, styles.stillRing]} />
    <View style={[styles.ring, styles.innerRing, styles.stillRing]} />
  </View>;
  return <View pointerEvents="none" style={styles.rings}>
    <Animated.View style={[styles.ring,styles.outerRing, { opacity:activity.interpolate({ inputRange:[0,1],outputRange:[0.35,0.16] }) }]} />
    <Animated.View style={[styles.ring,styles.innerRing, { opacity:activity.interpolate({ inputRange:[0,1],outputRange:[0.35,0.2] }) }]} />
    <Animated.View style={[styles.rings,{ opacity:activity }]}>
      <Animated.View style={[styles.ring,styles.outerRing,{ opacity:progress.interpolate({ inputRange:[0,1],outputRange:[0.22,0.5] }),transform:[{ scale:progress.interpolate({ inputRange:[0,1],outputRange:[0.86,1.17] }) }] }]} />
      <Animated.View style={[styles.ring,styles.innerRing,{ opacity:progress.interpolate({ inputRange:[0,1],outputRange:[0.42,0.2] }),transform:[{ scale:progress.interpolate({ inputRange:[0,1],outputRange:[0.94,1.13] }) }] }]} />
    </Animated.View>
  </View>;
}

function PlayGlyph({ isPlaying }: { isPlaying: boolean }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = useMotionValue(isPlaying ? 1 : 0, 240);
  return <View style={{ width:28,height:28,alignItems:'center',justifyContent:'center' }}>
    <Animated.View style={{ position:'absolute',opacity:progress.interpolate({ inputRange:[0,1],outputRange:[1,0] }),transform:[{ scale:progress.interpolate({ inputRange:[0,1],outputRange:[1,0.75] }) }] }}><View style={styles.playGlyph} /></Animated.View>
    <Animated.View style={{ position:'absolute',opacity:progress,transform:[{ scale:progress.interpolate({ inputRange:[0,1],outputRange:[0.75,1] }) }] }}><View style={styles.pauseGlyph}><View style={styles.pauseBar} /><View style={styles.pauseBar} /></View></Animated.View>
  </View>;
}

function createStyles(colors: ThemeColors, spacious = false) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: spacing.page,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    intro: {
      gap: spacing.xs,
      paddingBottom: spacing.xs,
    },
    eyebrow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xxs,
    },
    eyebrowMark: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    eyebrowText: {
      flexShrink: 1,
      color: colors.accent,
      fontFamily: fonts.body,
      fontSize: 12,
      fontWeight: '600',
    },
    title: {
      color: colors.ink,
      fontFamily: fonts.display,
      fontSize: 31,
      fontWeight: '500',
      lineHeight: 37,
      letterSpacing: -0.5,
    },
    description: {
      color: colors.muted,
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 22,
    },
    player: {
      padding: spacing.md,
      borderRadius: 26,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.selectedIconSurface,
      backgroundColor: colors.surfaceSelected,
    },
    balanceButton:{ alignSelf:'flex-end', minHeight:44, maxWidth:'100%', marginTop:12, paddingHorizontal:12, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:colors.surface, borderRadius:12, borderWidth:1, borderColor:colors.controlBorder },
    balanceButtonText:{ flexShrink:1, fontFamily:fonts.body, fontSize:13, fontWeight:'600', color:colors.accent },
    playerHeading: {
      flexDirection: spacious ? 'column' : 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    playerCopy: {
      maxWidth: '100%',
      gap: 5,
    },
    playerTitle: {
      color: colors.ink,
      fontFamily: fonts.display,
      fontSize: 19,
      fontWeight: '600',
    },
    headphones: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    playerHint: {
      flexShrink: 1,
      color: colors.muted,
      fontFamily: fonts.body,
      fontSize: 12,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    statusPillPlaying: {
      backgroundColor: colors.selectedIconSurface,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.dim,
    },
    statusDotPlaying: {
      backgroundColor: colors.accent,
    },
    playState: {
      flexShrink: 1,
      color: colors.muted,
      fontFamily: fonts.body,
      fontSize: 11,
      fontWeight: '600',
    },
    listeningArea: {
      height: 190,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rings: {
      position: 'absolute',
      width: 184,
      height: 184,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      borderRadius: 100,
      borderWidth: 1,
      borderColor: colors.ripple,
    },
    outerRing: {
      width: 154,
      height: 154,
    },
    innerRing: {
      width: 122,
      height: 122,
    },
    stillRing: {
      opacity: 0.35,
      transform: [{ scale: 1 }],
    },
    playButton: {
      width: 76,
      height: 76,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 40,
      backgroundColor: colors.accent,
    },
    playButtonActive: {
      backgroundColor: colors.accentHighlight,
    },
    playButtonDisabled: {
      opacity: 0.55,
    },
    focused: {
      borderWidth: 2,
      borderColor: colors.ink,
    },
    playGlyph: {
      width: 0,
      height: 0,
      marginLeft: 5,
      borderTopWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 16,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: colors.accentInk,
    },
    pauseGlyph: {
      height: 20,
      flexDirection: 'row',
      gap: 5,
    },
    pauseBar: {
      width: 5,
      borderRadius: 2,
      backgroundColor: colors.accentInk,
    },
    playPrompt: {
      alignSelf: 'center',
      textAlign: 'center',
      color: colors.ink,
      fontFamily: fonts.body,
      fontSize: 14,
      fontWeight: '600',
      marginTop: -spacing.xs,
      marginBottom: spacing.sm,
    },
    volumeArea: {
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.line,
    },
    modeNote: {
      color: colors.muted,
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
    },
    modeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingTop: spacing.xxs,
    },
    modeButton: {
      width: spacious ? '100%' : '48%',
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.controlBorder,
      backgroundColor: colors.surfaceSubtle,
    },
    modeButtonSelected: {
      borderColor: colors.selectedBorder,
    },
    modeButtonPressed: {
      backgroundColor: colors.surfaceSelected,
    },
    modeIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: colors.iconSurface,
    },
    modeIconSelected: {
      backgroundColor: colors.selectedIconSurface,
    },
    modeCopy: {
      flex: 1,
      gap: 2,
    },
    modeName: {
      color: colors.ink,
      fontFamily: fonts.body,
      fontSize: 14,
      fontWeight: '600',
    },
    modeNameSelected: {
      color: colors.accent,
    },
    modeDescription: {
      color: colors.dim,
      fontFamily: fonts.body,
      fontSize: 11,
    },
  });
}
