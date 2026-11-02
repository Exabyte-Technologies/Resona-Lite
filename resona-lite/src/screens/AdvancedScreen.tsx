import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AudioErrorNotice from '../components/AudioErrorNotice';
import Panel from '../components/Panel';
import RangeControl from '../components/RangeControl';
import {
  BEAT_BANDS,
  NOISE_TYPES,
  type NoiseType,
  type SoundSettings,
} from '../model';
import { colors, fonts, spacing } from '../theme';

type SettingKey =
  | 'beatHz'
  | 'droneFrequency'
  | 'drone'
  | 'pads'
  | 'textures'
  | 'melody'
  | 'spatial'
  | 'noise'
  | 'binauralVolume'
  | 'ambientVolume'
  | 'noiseVolume';

type Props = {
  settings: SoundSettings;
  binauralPlaying: boolean;
  ambientPlaying: boolean;
  noisePlaying: boolean;
  audioReady: boolean;
  audioError: string | null;
  onSettingChange: <Key extends SettingKey>(key: Key, value: SoundSettings[Key]) => void;
  onToggleBinaural: () => void;
  onToggleAmbient: () => void;
  onToggleNoise: () => void;
};

export default function AdvancedScreen({
  settings,
  binauralPlaying,
  ambientPlaying,
  noisePlaying,
  audioReady,
  audioError,
  onSettingChange,
  onToggleBinaural,
  onToggleAmbient,
  onToggleNoise,
}: Props) {
  const [focusedBand, setFocusedBand] = useState<number | null>(null);

  return (
    <>
      {audioError ? <AudioErrorNotice message={audioError} /> : null}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text style={styles.title}>Shape your soundscape</Text>
          <Text style={styles.description}>
            Tune focused binaural rhythms or build a living ambient composition from layered sound.
          </Text>
        </View>

        <Panel title="Binaural beats" eyebrow="Binaural engine">
          <Text style={styles.cardIntro}>
            Choose a neural rhythm and let a precise frequency difference settle around you.
          </Text>
          <View style={styles.bandGrid}>
            {BEAT_BANDS.map((band) => {
              const selected = settings.beatHz === band.hz;
              return (
                <Pressable
                  key={band.hz}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSettingChange('beatHz', band.hz)}
                  onFocus={() => setFocusedBand(band.hz)}
                  onBlur={() => setFocusedBand(null)}
                  style={({ pressed }) => [
                    styles.bandButton,
                    band.hz === 36 && styles.gammaBand,
                    selected && styles.bandButtonSelected,
                    focusedBand === band.hz && styles.focused,
                    pressed && styles.bandButtonPressed,
                  ]}
                >
                  <Text style={[styles.bandName, selected && styles.selectedText]}>
                    {band.name}
                  </Text>
                  <Text style={styles.bandDescription}>
                    {band.hz} Hz · {band.purpose}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <PlaybackControl
            status={`${binauralPlaying ? 'Playing' : 'Ready'} · ${selectedBandName(settings.beatHz)} ${settings.beatHz} Hz`}
            label={binauralPlaying ? 'Pause binaural' : 'Play binaural'}
            isPlaying={binauralPlaying}
            audioReady={audioReady}
            onPress={onToggleBinaural}
          />
        </Panel>

        <Panel title="Ambient music generator" eyebrow="Procedural soundscape">
          <Text style={styles.cardIntro}>
            Set the base tonal anchor. Pads and melody follow the drone while textures add a soft,
            spacious layer.
          </Text>
          <View style={styles.controlList}>
            <RangeControl
              title="Drone frequency"
              description="Base root for ambient layers and binaural tones"
              value={settings.droneFrequency}
              minimum={40}
              maximum={400}
              unit=" Hz"
              onChange={(value) => onSettingChange('droneFrequency', value)}
            />
            <RangeControl
              title="Drone"
              description="Low, grounding foundation"
              value={settings.drone}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('drone', value)}
            />
            <RangeControl
              title="Lush pads"
              description="Warm harmonic bloom"
              value={settings.pads}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('pads', value)}
            />
            <RangeControl
              title="Textures & foley"
              description="Air, grain and organic detail"
              value={settings.textures}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('textures', value)}
            />
            <RangeControl
              title="Minimal melodic elements"
              description="Sparse, glimmering tones"
              value={settings.melody}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('melody', value)}
            />
            <RangeControl
              title="Spatial effects"
              description="Width, drift and echo"
              value={settings.spatial}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('spatial', value)}
            />
          </View>
          <PlaybackControl
            status={ambientPlaying ? 'Soundscape playing' : 'Soundscape ready'}
            label={ambientPlaying ? 'Pause ambient' : 'Generate ambient'}
            isPlaying={ambientPlaying}
            audioReady={audioReady}
            onPress={onToggleAmbient}
          />
        </Panel>

        <Panel title="Noise generator" eyebrow="Continuous texture">
          <Text style={styles.cardIntro}>
            Choose a steady noise colour or an environmental texture to soften distractions.
          </Text>
          <View style={styles.noiseGrid}>
            {NOISE_TYPES.map((noise) => (
              <NoiseChoice
                key={noise.id}
                noise={noise}
                selected={settings.noise === noise.id}
                onPress={() => onSettingChange('noise', noise.id)}
              />
            ))}
          </View>
          <PlaybackControl
            status={`${noisePlaying ? 'Playing' : 'Ready'} · ${capitalize(settings.noise)} noise`}
            label={noisePlaying ? 'Pause noise' : 'Play noise'}
            isPlaying={noisePlaying}
            audioReady={audioReady}
            onPress={onToggleNoise}
          />
        </Panel>

        <Panel title="Master volume" eyebrow="Output mixer">
          <Text style={styles.cardIntro}>
            Balance the two generators and noise while they play together or on their own.
          </Text>
          <View style={styles.controlList}>
            <RangeControl
              title="Binaural beats"
              description="Overall binaural output"
              value={settings.binauralVolume}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('binauralVolume', value)}
            />
            <RangeControl
              title="Ambient music"
              description="Overall ambient output"
              value={settings.ambientVolume}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('ambientVolume', value)}
            />
            <RangeControl
              title="Noise generator"
              description="Overall noise output"
              value={settings.noiseVolume}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('noiseVolume', value)}
            />
          </View>
        </Panel>
      </ScrollView>
    </>
  );
}

function PlaybackControl({
  status,
  label,
  isPlaying,
  audioReady,
  onPress,
}: {
  status: string;
  label: string;
  isPlaying: boolean;
  audioReady: boolean;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.playback}>
      <Text style={styles.playbackStatus}>{status}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !audioReady }}
        disabled={!audioReady}
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.playButton,
          isPlaying && styles.playButtonActive,
          !audioReady && styles.playButtonDisabled,
          focused && styles.focused,
          pressed && audioReady && styles.playButtonPressed,
        ]}
      >
        <Text style={[styles.playButtonText, isPlaying && styles.playButtonTextActive]}>
          {audioReady ? label : 'Tuning'}
        </Text>
      </Pressable>
    </View>
  );
}

function NoiseChoice({
  noise,
  selected,
  onPress,
}: {
  noise: (typeof NOISE_TYPES)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.noiseChoice,
        selected && styles.noiseChoiceSelected,
        focused && styles.focused,
        pressed && styles.noiseChoicePressed,
      ]}
    >
      <Text style={[styles.noiseName, selected && styles.selectedText]}>
        {capitalize(noise.id)}
      </Text>
      <Text style={styles.noiseDescription}>{noise.description}</Text>
    </Pressable>
  );
}

function selectedBandName(beat: number) {
  return BEAT_BANDS.find((band) => band.hz === beat)?.name ?? 'Binaural';
}

function capitalize(noise: NoiseType) {
  return noise.charAt(0).toUpperCase() + noise.slice(1);
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
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
  },
  description: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
  },
  cardIntro: {
    marginTop: -spacing.sm,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  bandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bandButton: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 72,
    justifyContent: 'center',
    gap: 5,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSubtle,
  },
  gammaBand: {
    flexBasis: '100%',
  },
  bandButtonSelected: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.surfaceSelected,
  },
  bandButtonPressed: {
    opacity: 0.75,
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  bandName: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.accent,
  },
  bandDescription: {
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  playback: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  playbackStatus: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: 'center',
  },
  playButton: {
    minWidth: 156,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 26,
    backgroundColor: colors.accent,
  },
  playButtonActive: {
    backgroundColor: colors.ink,
  },
  playButtonDisabled: {
    opacity: 0.55,
  },
  playButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  playButtonText: {
    color: colors.accentInk,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  playButtonTextActive: {
    color: colors.background,
  },
  noiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noiseChoice: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 68,
    justifyContent: 'center',
    gap: 4,
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSubtle,
  },
  noiseChoiceSelected: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.surfaceSelected,
  },
  noiseChoicePressed: {
    opacity: 0.75,
  },
  noiseName: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '600',
  },
  noiseDescription: {
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  controlList: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
});
