import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Mode, SoundSettings } from '../model';
import { MODES } from '../model';
import AudioErrorNotice from '../components/AudioErrorNotice';
import Icon, { type IconName } from '../components/Icon';
import RangeControl from '../components/RangeControl';
import Panel from '../components/Panel';
import { fonts, spacing, useThemeColors, type ThemeColors } from '../theme';

type Props = {
  settings: SoundSettings;
  isPlaying: boolean;
  audioReady: boolean;
  audioError: string | null;
  onTogglePlayback: () => void;
  onSelectMode: (mode: Mode) => void;
  onMasterVolumeChange: (value: number) => void;
};

const modeIcons: Record<Mode, IconName> = {
  sleep: 'sleep',
  meditation: 'meditation',
  focus: 'focus',
  awake: 'awake',
};

export default function HomeScreen({
  settings,
  isPlaying,
  audioReady,
  audioError,
  onTogglePlayback,
  onSelectMode,
  onMasterVolumeChange,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [playFocused, setPlayFocused] = useState(false);
  const [focusedMode, setFocusedMode] = useState<Mode | null>(null);

  return (
    <>
      {audioError ? <AudioErrorNotice message={audioError} /> : null}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrowText}>A little space to reset</Text>
          </View>
          <Text style={styles.title}>Make room for quiet</Text>
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
            <Pressable
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
                pressed && audioReady && styles.playButtonPressed,
              ]}
            >
              <PlayGlyph isPlaying={isPlaying} />
            </Pressable>
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
        </View>

        <Panel title="Choose a mood" icon="meditation" compact>
          <Text style={styles.modeNote}>
            Each mode tunes your binaural beat and ambient layers. Fine-tune everything in Advanced.
          </Text>
          <View style={styles.modeGrid}>
            {MODES.map((mode) => {
              const selected = settings.mode === mode.id;
              return (
                <Pressable
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
                  {selected ? <View style={styles.selectedMark} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Panel>
      </ScrollView>
    </>
  );
}

function WaterRings({ isPlaying }: { isPlaying: boolean }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    if (!isPlaying || reduceMotion !== false) return;

    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 3200,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [isPlaying, progress, reduceMotion]);

  const firstWave = {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0] }),
    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.28] }) }],
  };
  const secondWave = {
    opacity: progress.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 0.3, 0],
    }),
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0.76, 0.86, 1.3],
        }),
      },
    ],
  };
  const animate = isPlaying && reduceMotion === false;

  return (
    <View pointerEvents="none" style={styles.rings}>
      <Animated.View
        style={[styles.ring, styles.outerRing, animate ? firstWave : styles.stillRing]}
      />
      <Animated.View
        style={[styles.ring, styles.innerRing, animate ? secondWave : styles.stillRing]}
      />
    </View>
  );
}

function PlayGlyph({ isPlaying }: { isPlaying: boolean }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return isPlaying ? (
    <View style={styles.pauseGlyph}>
      <View style={styles.pauseBar} />
      <View style={styles.pauseBar} />
    </View>
  ) : (
    <View style={styles.playGlyph} />
  );
}

function createStyles(colors: ThemeColors) {
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
      borderRadius: 24,
      backgroundColor: colors.surfaceSelected,
    },
    playerHeading: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    playerCopy: {
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
    playButtonPressed: {
      transform: [{ scale: 0.95 }],
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
      width: '48%',
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceSubtle,
    },
    modeButtonSelected: {
      borderColor: colors.selectedBorder,
      backgroundColor: colors.surfaceSelected,
    },
    modeButtonPressed: {
      opacity: 0.82,
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
    selectedMark: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
  });
}
