import { LocalizedText as Text, useLanguage } from '../i18n';
import { useTutorial, useLanguagePicker } from '../tutorial-context';
import LayerBalanceControls from '../components/LayerBalanceControls';
import { MotionPressable, SelectionWash } from '../motion';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AudioErrorNotice from '../components/AudioErrorNotice';
import AccessibilitySettings from '../components/AccessibilitySettings';
import { useAccessibilitySettings } from '../accessibility';
import { cardLayout, useTwoColumnLayout } from '../layout';
import Icon, { type IconName } from '../components/Icon';
import Panel from '../components/Panel';
import RangeControl from '../components/RangeControl';
import { BinauralControls, CompositionControls } from '../components/CompositionControls';
import {
  BEAT_BANDS,
  NOISE_TYPES,
  type NoiseType,
  type SoundSettings,
} from '../model';
import { fonts, spacing, useThemeColors, type ThemeColors } from '../theme';

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

const noiseIcons: Record<NoiseType, IconName> = {
  white: 'noise',
  pink: 'waves',
  brown: 'layers',
  rain: 'waves',
  ocean: 'waves',
  forest: 'awake',
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
  const colors = useThemeColors();
  const { spacious } = useAccessibilitySettings();
  const twoColumns = useTwoColumnLayout();
  const styles = useMemo(() => createStyles(colors, spacious), [colors, spacious]);
  const [accessibilityVisible, setAccessibilityVisible] = useState(false);
  const [focusedBand, setFocusedBand] = useState<number | null>(null);
  const openTutorial = useTutorial();
  const openLanguage=useLanguagePicker();
  const {t}=useLanguage();

  return (
    <>
      <ScrollView
        contentContainerStyle={[cardLayout.page, styles.content]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {audioError ? <AudioErrorNotice message={audioError} /> : null}
        <View style={styles.intro}>
          <Text style={styles.title}>Fine-tune your sound</Text>
          <Text style={styles.description}>Rhythm, texture, tone and balance.</Text>
        </View>

        <View style={[cardLayout.group, twoColumns && cardLayout.sideBySide]}>
          <View style={[cardLayout.group, twoColumns && cardLayout.column]}>
            <Panel title="Binaural rhythm" icon="frequency" compact>
              <Text style={styles.sectionNote}>
                Choose a frequency difference to set the pace.
              </Text>
              <View style={styles.bandGrid}>
                {BEAT_BANDS.map((band) => {
                  const selected = settings.beatHz === band.hz;
                  return (
                    <MotionPressable
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
                      <SelectionWash selected={selected} color={colors.surfaceSelected} radius={14} />
                      <View style={styles.bandInfo}>
                        <Text style={[styles.bandName, selected && styles.selectedText]}>
                          {band.name}
                        </Text>
                        <Text style={styles.bandDescription}>{band.purpose}</Text>
                      </View>
                      <Text style={[styles.bandFrequency, selected && styles.selectedText]}>
                        {band.hz} Hz
                      </Text>
                      {selected && <Icon name="check" size={16} />}
                    </MotionPressable>
                  );
                })}
              </View>
              <PlaybackControl
                icon="frequency"
                status={binauralPlaying ? 'Binaural beats playing' : 'Binaural beats ready'}
                label={binauralPlaying ? 'Pause binaural' : 'Play binaural'}
                isPlaying={binauralPlaying}
                audioReady={audioReady}
                onPress={onToggleBinaural}
              />
            </Panel>

            <BinauralControls />
            <Panel title="Layer balance" icon="balance" compact>
              <Text style={styles.sectionNote}>
                Set each layer while it plays alone or alongside the others.
              </Text>
              <LayerBalanceControls settings={settings} onChange={onSettingChange} />
            </Panel>
          </View>
          <View style={[cardLayout.group, twoColumns && cardLayout.column]}>
            <Panel title="Ambient layers" icon="waves" compact>
              <Text style={styles.sectionNote}>
                Blend a steady drone with pads, texture, melody and space.
              </Text>
              <View style={styles.mixerGrid}>
                <View style={styles.mixerTile}>
                  <RangeControl
                    compact
                    grid
                    title="Root frequency"
                    description="Ambient and binaural base"
                    value={settings.droneFrequency}
                    minimum={40}
                    maximum={400}
                    unit=" Hz"
                    onChange={(value) => onSettingChange('droneFrequency', value)}
                  />
                </View>
                <View style={styles.mixerTile}>
                  <RangeControl
                    compact
                    grid
                    title="Drone"
                    description="Low foundation"
                    value={settings.drone}
                    minimum={0}
                    maximum={100}
                    onChange={(value) => onSettingChange('drone', value)}
                  />
                </View>
                <View style={styles.mixerTile}>
                  <RangeControl
                    compact
                    grid
                    title="Lush pads"
                    description="Harmonic bloom"
                    value={settings.pads}
                    minimum={0}
                    maximum={100}
                    onChange={(value) => onSettingChange('pads', value)}
                  />
                </View>
                <View style={styles.mixerTile}>
                  <RangeControl
                    compact
                    grid
                    title="Texture"
                    description="Air and organic detail"
                    value={settings.textures}
                    minimum={0}
                    maximum={100}
                    onChange={(value) => onSettingChange('textures', value)}
                  />
                </View>
                <View style={styles.mixerTile}>
                  <RangeControl
                    compact
                    grid
                    title="Melody"
                    description="Sparse glimmers"
                    value={settings.melody}
                    minimum={0}
                    maximum={100}
                    onChange={(value) => onSettingChange('melody', value)}
                  />
                </View>
                <View style={styles.mixerTile}>
                  <RangeControl
                    compact
                    grid
                    title="Spatial"
                    description="Width and echo"
                    value={settings.spatial}
                    minimum={0}
                    maximum={100}
                    onChange={(value) => onSettingChange('spatial', value)}
                  />
                </View>
              </View>
              <PlaybackControl
                icon="waves"
                status={ambientPlaying ? 'Soundscape playing' : 'Soundscape ready'}
                label={ambientPlaying ? 'Pause ambient' : 'Generate ambient'}
                isPlaying={ambientPlaying}
                audioReady={audioReady}
                onPress={onToggleAmbient}
              />
            </Panel>

            <Panel title="Noise colour" icon="noise" compact>
              <Text style={styles.sectionNote}>
                Pick a steady noise or a natural texture.
              </Text>
              <View style={styles.noiseGrid}>
                {NOISE_TYPES.map((noise) => (
                  <NoiseChoice
                    key={noise.id}
                    noise={noise}
                    icon={noiseIcons[noise.id]}
                    selected={settings.noise === noise.id}
                    onPress={() => onSettingChange('noise', noise.id)}
                  />
                ))}
              </View>
              <PlaybackControl
                icon={noiseIcons[settings.noise]}
                status={t('{{noise}} noise {{status}}',{noise:t(capitalize(settings.noise)),status:t(noisePlaying?'Playing':'Ready')})}
                label={noisePlaying ? 'Pause noise' : 'Play noise'}
                isPlaying={noisePlaying}
                audioReady={audioReady}
                onPress={onToggleNoise}
              />
            </Panel>
          </View>
        </View>
        <CompositionControls twoColumns={twoColumns} />

        <View style={styles.footerLinks}>
        <MotionPressable accessibilityRole="button" accessibilityLabel="Replay quick tour" onPress={openTutorial} style={styles.tourLink}>
          <Text style={[styles.tourLinkText, { color:colors.muted }]}>Quick tour</Text>
        </MotionPressable>
        <MotionPressable accessibilityRole="button" onPress={openLanguage} style={styles.tourLink}>
          <Icon name="language" size={16}/><Text style={[styles.tourLinkText,{color:colors.muted}]}>Change language</Text>
        </MotionPressable>
        </View>
        <MotionPressable accessibilityRole="button" onPress={() => setAccessibilityVisible(true)} style={styles.accessibilityButton}>
          <Text style={styles.accessibilityLabel}>Accessibility</Text>
        </MotionPressable>
      </ScrollView>
      <AccessibilitySettings visible={accessibilityVisible} onClose={() => setAccessibilityVisible(false)} />
    </>
  );
}

function PlaybackControl({
  icon,
  status,
  label,
  isPlaying,
  audioReady,
  onPress,
}: {
  icon: IconName;
  status: string;
  label: string;
  isPlaying: boolean;
  audioReady: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const { spacious } = useAccessibilitySettings();
  const styles = useMemo(() => createStyles(colors, spacious), [colors, spacious]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.playback}>
      <View style={styles.playbackInfo}>
        <Icon name={icon} color={isPlaying ? colors.accent : colors.dim} size={16} />
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.playbackStatus, isPlaying && styles.playbackStatusActive]}
        >
          {status}
        </Text>
      </View>
      <MotionPressable
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
          pressed && audioReady && styles.playButtonActive,
        ]}
      >
        <Icon name={isPlaying ? 'waves' : icon} color={colors.accentInk} size={15} />
        <Text style={[styles.playButtonText, isPlaying && styles.playButtonTextActive]}>
          {audioReady ? label : 'Tuning'}
        </Text>
      </MotionPressable>
    </View>
  );
}

function NoiseChoice({
  noise,
  icon,
  selected,
  onPress,
}: {
  noise: (typeof NOISE_TYPES)[number];
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const { spacious } = useAccessibilitySettings();
  const styles = useMemo(() => createStyles(colors, spacious), [colors, spacious]);
  const [focused, setFocused] = useState(false);

  return (
    <MotionPressable
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
      <SelectionWash selected={selected} color={colors.surfaceSelected} radius={14} />
      <View style={styles.noiseIcon}>
        <Icon name={icon} color={selected ? colors.accent : colors.dim} size={16} />
      </View>
      <View style={styles.noiseCopy}>
        <Text style={[styles.noiseName, selected && styles.selectedText]}>
          {capitalize(noise.id)}
        </Text>
        <Text style={styles.noiseDescription}>{noise.description}</Text>
      </View>
      {selected && <Icon name="check" size={16} />}
    </MotionPressable>
  );
}

function capitalize(noise: NoiseType) {
  return noise.charAt(0).toUpperCase() + noise.slice(1);
}

function createStyles(colors: ThemeColors, spacious: boolean) {
  return StyleSheet.create({
    footerLinks:{flexDirection:spacious?'column':'row',alignItems:'stretch',justifyContent:'center',gap:spacious?4:16,marginTop:8},
    tourLink:{ flexGrow:1, flexBasis:spacious?'auto':0, minHeight:44, flexDirection:'row',gap:6,alignItems:'center', justifyContent:'center' },
    tourLinkText:{ fontFamily:fonts.body, fontSize:12,flexShrink:1, textDecorationLine:'underline' },
    accessibilityButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.controlBorder, backgroundColor: colors.surface },
    accessibilityLabel: { fontSize: 14, fontWeight: '600', color: colors.ink, textAlign: 'center' },
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
      width: spacious ? '100%' : '48%',
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.controlBorder,
      backgroundColor: colors.surfaceSubtle,
    },
    gammaBand: {
      width: '100%',
    },
    bandButtonSelected: {
      borderColor: colors.selectedBorder,
    },
    bandButtonPressed: {
      backgroundColor: colors.surfaceSelected,
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
      flexShrink: 1,
      color: colors.muted,
      fontFamily: fonts.body,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
    },
    mixerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: spacing.xs,
    },
    mixerTile: {
      width: spacious ? '100%' : '31.6%',
      minHeight: 96,
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceSubtle,
    },
    playback: {
      minHeight: 44,
      flexDirection: spacious ? 'column' : 'row',
      alignItems: spacious ? 'stretch' : 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      paddingTop: spacing.xxs,
    },
    playbackInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    playbackStatus: {
      flexShrink: 1,
      color: colors.muted,
      fontFamily: fonts.body,
      fontSize: 12,
    },
    playbackStatusActive: {
      color: colors.accent,
    },
    playButton: {
      minWidth: 132,
      minHeight: 44,
      maxWidth: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
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
    playButtonText: {
      flexShrink: 1,
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
      width: spacious ? '100%' : '48%',
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.controlBorder,
      backgroundColor: colors.surfaceSubtle,
    },
    noiseChoiceSelected: {
      borderColor: colors.selectedBorder,
    },
    noiseChoicePressed: {
      backgroundColor: colors.surfaceSelected,
    },
    noiseIcon: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: colors.iconSurface,
    },
    noiseCopy: {
      flex: 1,
      gap: 2,
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
}
