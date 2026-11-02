import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Mode, SoundSettings } from '../model';
import { MODES } from '../model';
import AudioErrorNotice from '../components/AudioErrorNotice';
import RangeControl from '../components/RangeControl';
import Panel from '../components/Panel';
import { colors, fonts, spacing } from '../theme';

type Props = {
  settings: SoundSettings;
  isPlaying: boolean;
  audioReady: boolean;
  audioError: string | null;
  onTogglePlayback: () => void;
  onSelectMode: (mode: Mode) => void;
  onMasterVolumeChange: (value: number) => void;
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
          <Text style={styles.title}>A calmer way to listen</Text>
          <Text style={styles.description}>
            Choose a mode, press play, and let the sound adapt around you.
          </Text>
        </View>

        <Panel title="Your soundscape" eyebrow="Now playing">
          <Text style={styles.headphones}>Headphones recommended</Text>
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
            <Text style={styles.playLabel}>
              {audioReady ? (isPlaying ? 'Pause' : 'Play') : 'Tuning'}
            </Text>
          </Pressable>
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
        </Panel>

        <Panel title="How do you want to feel?" eyebrow="Choose a mode">
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
                    <Text style={[styles.modeSymbol, selected && styles.modeSymbolSelected]}>
                      {mode.symbol}
                    </Text>
                  </View>
                  <View style={styles.modeCopy}>
                    <Text style={styles.modeName}>{mode.title}</Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.modeNote}>
            Each mode tunes your binaural beat and ambient layers. Fine-tune everything in Advanced.
          </Text>
        </Panel>
      </ScrollView>
    </>
  );
}

function PlayGlyph({ isPlaying }: { isPlaying: boolean }) {
  return isPlaying ? (
    <View style={styles.pauseGlyph}>
      <View style={styles.pauseBar} />
      <View style={styles.pauseBar} />
    </View>
  ) : (
    <View style={styles.playGlyph} />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  intro: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1.1,
  },
  description: {
    maxWidth: 360,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
  },
  headphones: {
    marginTop: -spacing.sm,
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  playButton: {
    width: 128,
    height: 128,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 64,
    backgroundColor: colors.accent,
  },
  playButtonActive: {
    backgroundColor: colors.ink,
  },
  playButtonDisabled: {
    opacity: 0.55,
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  playButtonPressed: {
    transform: [{ scale: 0.97 }],
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
  playLabel: {
    color: colors.accentInk,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  volumeArea: {
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeButton: {
    width: '48%',
    minHeight: 74,
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSubtle,
  },
  modeButtonSelected: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.surfaceSelected,
  },
  modeButtonPressed: {
    opacity: 0.76,
  },
  modeIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.iconSurface,
  },
  modeIconSelected: {
    backgroundColor: colors.selectedIconSurface,
  },
  modeSymbol: {
    color: colors.muted,
    fontSize: 17,
  },
  modeSymbolSelected: {
    color: colors.accent,
  },
  modeCopy: {
    flexShrink: 1,
    gap: 3,
  },
  modeName: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  modeDescription: {
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  modeNote: {
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
});
