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
          <Text style={styles.title}>Fine-tune your sound</Text>
          <Text style={styles.description}>Rhythm, texture, tone and balance.</Text>
        </View>

        <Panel title="Binaural rhythm" compact>
          <Text style={styles.sectionNote}>
            Choose a frequency difference to set the pace.
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
                  <View style={styles.bandInfo}>
                    <Text style={[styles.bandName, selected && styles.selectedText]}>
                      {band.name}
                    </Text>
                    <Text style={styles.bandDescription}>{band.purpose}</Text>
                  </View>
                  <Text style={[styles.bandFrequency, selected && styles.selectedText]}>
                    {band.hz} Hz
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <PlaybackControl
            status={binauralPlaying ? 'Binaural beats playing' : 'Binaural beats ready'}
            label={binauralPlaying ? 'Pause binaural' : 'Play binaural'}
            isPlaying={binauralPlaying}
            audioReady={audioReady}
            onPress={onToggleBinaural}
          />
        </Panel>

        <Panel title="Ambient layers" compact>
          <Text style={styles.sectionNote}>
            Blend a steady drone with pads, texture, melody and space.
          </Text>
          <View style={styles.controlList}>
            <RangeControl
              compact
              title="Drone frequency"
              description="Base root for ambient layers and binaural tones"
              value={settings.droneFrequency}
              minimum={40}
              maximum={400}
              unit=" Hz"
              onChange={(value) => onSettingChange('droneFrequency', value)}
            />
            <RangeControl
              compact
              title="Drone"
              description="Low, grounding foundation"
              value={settings.drone}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('drone', value)}
            />
            <RangeControl
              compact
              title="Lush pads"
              description="Warm harmonic bloom"
              value={settings.pads}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('pads', value)}
            />
            <RangeControl
              compact
              title="Textures & foley"
              description="Air, grain and organic detail"
              value={settings.textures}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('textures', value)}
            />
            <RangeControl
              compact
              title="Minimal melodic elements"
              description="Sparse, glimmering tones"
              value={settings.melody}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('melody', value)}
            />
            <RangeControl
              compact
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

        <Panel title="Noise colour" compact>
          <Text style={styles.sectionNote}>
            Pick a steady noise or a natural texture.
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
            status={`${capitalize(settings.noise)} noise ${noisePlaying ? 'playing' : 'ready'}`}
            label={noisePlaying ? 'Pause noise' : 'Play noise'}
            isPlaying={noisePlaying}
            audioReady={audioReady}
            onPress={onToggleNoise}
          />
        </Panel>

        <Panel title="Layer balance" compact>
          <Text style={styles.sectionNote}>
            Set each layer while it plays alone or alongside the others.
          </Text>
          <View style={styles.controlList}>
            <RangeControl
              compact
              title="Binaural beats"
              description="Overall binaural output"
              value={settings.binauralVolume}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('binauralVolume', value)}
            />
            <RangeControl
              compact
              title="Ambient music"
              description="Overall ambient output"
              value={settings.ambientVolume}
              minimum={0}
              maximum={100}
              onChange={(value) => onSettingChange('ambientVolume', value)}
            />
            <RangeControl
              compact
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
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.playbackStatus, isPlaying && styles.playbackStatusActive]}
      >
        {status}
      </Text>
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
      <Text style={styles.noiseDescription}>{noise.description.replace(' · ', ', ')}</Text>
    </Pressable>
  );
}

function capitalize(noise: NoiseType) {
  return noise.charAt(0).toUpperCase() + noise.slice(1);
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  intro: {
    gap: spacing.xxs,
    paddingBottom: spacing.xxs,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 27,
    fontWeight: '500',
    lineHeight: 33,
    letterSpacing: -0.4,
  },
  description: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionNote: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  bandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bandButton: {
    width: '48%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSubtle,
  },
  gammaBand: {
    width: '100%',
  },
  bandButtonSelected: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.surfaceSelected,
  },
  bandButtonPressed: {
    opacity: 0.78,
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  bandName: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '600',
  },
  bandInfo: {
    flex: 1,
    gap: 1,
  },
  selectedText: {
    color: colors.accent,
  },
  bandDescription: {
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  bandFrequency: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  playback: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingTop: spacing.xxs,
  },
  playbackStatus: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  playbackStatusActive: {
    color: colors.accent,
  },
  playButton: {
    minWidth: 118,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  playButtonActive: {
    backgroundColor: colors.accentHighlight,
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
    fontSize: 12,
    fontWeight: '700',
  },
  playButtonTextActive: {
    color: colors.accentInk,
  },
  noiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  noiseChoice: {
    width: '48%',
    minHeight: 52,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSubtle,
  },
  noiseChoiceSelected: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.surfaceSelected,
  },
  noiseChoicePressed: {
    opacity: 0.78,
  },
  noiseName: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  noiseDescription: {
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 10,
  },
  controlList: {
    gap: spacing.xs,
  },
});
