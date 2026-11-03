import { LocalizedText as Text, useLanguage } from '../i18n';
import { MotionPressable, SelectionWash } from '../motion';
import { useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';
import { useAccessibilitySettings, useAppColorScheme } from '../accessibility';
import Icon from './Icon';
import { cardLayout } from '../layout';
import Panel from './Panel';
import RangeControl from './RangeControl';
import { usePlayer } from '../player-context';
import { fonts, useThemeColors } from '../theme';
import type { SoundSettings } from '../model';

function Choice({ label, selected = false, disabled = false, onPress }: { label: string; selected?: boolean; disabled?: boolean; onPress: () => void }) {
  const colors = useThemeColors();
  return <MotionPressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, {
      backgroundColor: pressed ? colors.surfaceSelected : colors.surfaceSubtle,
      borderColor: selected ? colors.accent : colors.controlBorder,
      borderStyle: disabled ? 'dashed' : 'solid',
    }]}>
    <SelectionWash selected={selected} color={colors.surfaceSelected} radius={12} />
    <Text style={{ flexShrink:1, color:disabled ? colors.dim : selected ? colors.accent : colors.ink, fontFamily:fonts.body, fontSize:13 }}>{label}</Text>
    {selected && <Icon name="check" size={16} />}
  </MotionPressable>;
}

export function BinauralControls() {
  const { settings:s, updateSetting:set, engineState } = usePlayer();
  const colors = useThemeColors();
  const {t}=useLanguage();
  const carrier = engineState?.config.carrier ?? s.droneFrequency;
  const left = s.binauralMode === 'difference' ? carrier - s.beatHz / 2 : s.leftFrequency;
  const right = s.binauralMode === 'difference' ? carrier + s.beatHz / 2 : s.rightFrequency;
  return <Panel title="Binaural tuning" icon="headphones" compact>
    <View style={styles.row}>
      <Choice label="Frequency difference" selected={s.binauralMode === 'difference'} onPress={() => set('binauralMode','difference')} />
      <Choice label="Individual ears" selected={s.binauralMode === 'individual'} onPress={() => set('binauralMode','individual')} />
    </View>
    <Text style={{ color:colors.muted }}>{t('Left {{left}} Hz · Right {{right}} Hz',{left:left.toFixed(2),right:right.toFixed(2)})}</Text>
    {s.binauralMode === 'difference' ? <RangeControl compact title="Beat difference" minimum={0.1} maximum={100} step={0.1} value={s.beatHz} unit=" Hz" onChange={v => set('beatHz',v)} /> : <>
      <RangeControl compact title="Left ear" minimum={40} maximum={400} step={0.1} value={s.leftFrequency} unit=" Hz" onChange={v => set('leftFrequency',v)} />
      <RangeControl compact title="Right ear" minimum={40} maximum={400} step={0.1} value={s.rightFrequency} unit=" Hz" onChange={v => set('rightFrequency',v)} />
    </>}

  </Panel>;
}

export function CompositionControls({ twoColumns }: { twoColumns: boolean }) {
  const { settings:s, updateSetting:set, engineState:e, command, generateChords, audioReady } = usePlayer();
  const colors = useThemeColors();
  const { textMultiplier } = useAccessibilitySettings();
  const keyboardAppearance = useAppColorScheme();
  const {t}=useLanguage();
  const [seed, setSeed] = useState('');
  const [length, setLength] = useState(8);
  const [duration, setDuration] = useState(4);
  const [temperature, setTemperature] = useState(1);
  const [topK, setTopK] = useState(10);
  const [greedy, setGreedy] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const chords = e?.config.ambient.chordProgression ?? [];
  return <View style={[cardLayout.group, twoColumns && cardLayout.sideBySide]}>
    <View style={[cardLayout.group, twoColumns && cardLayout.column]}>
      <Panel title="Atmosphere & tonal centre" icon="waves" compact>
        <View style={styles.row}>
          {([['restore','Restore'],['melancholy','Melancholy'],['deep','Deep meditation']] as const).map(([value,label]) => <Choice key={value} label={label} selected={s.atmosphere === value} onPress={() => set('atmosphere',value)} />)}
        </View>
        <View style={styles.row}>
          <Choice label="Manual" selected={s.tonalSource === 'manual'} onPress={() => set('tonalSource','manual')} />
          <Choice label="Generated progression" selected={s.tonalSource === 'generated'} disabled={!chords.length} onPress={() => set('tonalSource','generated')} />
        </View>
        <View style={styles.row}>
          {([[48,'C'],[50,'D'],[51,'E♭'],[53,'F'],[55,'G'],[57,'A']] as const).map(([midi,note]) => <Choice key={midi} label={note} disabled={s.tonalSource !== 'manual'} selected={Math.abs(s.manualRootMidi-midi) < 0.01} onPress={() => set('manualRootMidi',midi)} />)}
        </View>
        <Text style={{ color:colors.muted }}>Drone · Harmonic pad · Analog drift · Weather texture · High shimmer · Felt anchor</Text>
        {(['warmth','movement','space','texture','shimmer','output'] as const).map(key => <RangeControl key={key} compact title={key[0].toUpperCase()+key.slice(1)} minimum={0} maximum={100} value={s[key]} onChange={v => set(key,v)} />)}
      </Panel>
      <Panel title="Support tone mix" icon="balance" compact>
        <Text style={{ color:colors.muted }}>Set the supporting binaural tone blend for the next playback, as on Resona.</Text>
        {(['pad','flute','strings','bells'] as const).map((key: keyof Pick<SoundSettings,'pad' | 'flute' | 'strings' | 'bells'>) => <RangeControl key={key} compact title={key[0].toUpperCase()+key.slice(1)} minimum={0} maximum={100} value={s[key]} onChange={v => set(key,v)} />)}
      </Panel>
    </View>
    <View style={twoColumns && cardLayout.column}>
      <Panel title="Chord progression" icon="layers" compact>
        <Text style={{ color:colors.muted }}>The original offline chord model. Starting chords are optional; generation stays on your phone.</Text>
        <Text style={{ color:colors.ink }}>Starting chords</Text>
        <TextInput accessibilityLabel={t("Starting chords")} placeholder="C Amin F G" placeholderTextColor={colors.dim} keyboardAppearance={keyboardAppearance} autoCapitalize="none" autoCorrect={false} value={seed} onChangeText={setSeed} style={[styles.input,{ fontSize: 16 * textMultiplier, color:colors.ink, borderColor:colors.controlBorder, backgroundColor:colors.surfaceSubtle }]} />
        <RangeControl compact title="Progression length" minimum={2} maximum={32} value={length} onChange={setLength} />
        <RangeControl compact title="Seconds per chord" minimum={2} maximum={120} value={duration} unit=" s" onChange={setDuration} />
        <Text style={{ color:colors.muted }}>Chord transition timing · 0 means instant. Manual tuning keeps its smooth glide.</Text>
        <RangeControl compact title="Ambient chord transition" minimum={0} maximum={4} step={0.1} unit=" s" value={s.chordTransition} onChange={v => set('chordTransition',v)} />
        <RangeControl compact title="Binaural chord transition" minimum={0} maximum={4} step={0.1} unit=" s" value={s.binauralChordTransition} onChange={v => set('binauralChordTransition',v)} />
        <RangeControl compact title="Creativity" minimum={0.1} maximum={2} step={0.1} value={temperature} onChange={setTemperature} />
        <RangeControl compact title="Top choices" minimum={1} maximum={100} value={topK} onChange={setTopK} />
        <View style={styles.switchRow}><Text style={{ flex:1, color:colors.ink }}>Predictable mode</Text><Switch accessibilityLabel={t("Predictable mode")} value={greedy} onValueChange={setGreedy} /></View>
        <View style={styles.switchRow}><Text style={{ flex:1, color:colors.ink }}>Continuous sets</Text><Switch accessibilityLabel={t("Continuous sets")} value={continuous} onValueChange={value => { setContinuous(value); command('continuous',value); }} /></View>
        {e?.pipeline.enabled ? <Text accessibilityLiveRegion="polite" style={{ color:colors.accent }}>Playing {e.pipeline.playing ?? '—'} · Ready {e.pipeline.ready.join(', ') || '—'} · Generating {e.pipeline.generating ?? '—'}</Text> : null}
        <View style={styles.row}>
          {chords.map((chord, index) => {
            const selected = e?.chordProgressionIndex === index && s.tonalSource === 'generated';
            const note = chord.replace(/([A-G])s/g, '$1♯');
            return <View key={index} accessible accessibilityLabel={note} accessibilityState={{ selected }} style={[styles.chord, { borderColor: colors.controlBorder }]}>
              {selected && <Icon name="check" size={16} />}
              <Text style={{ color: selected ? colors.accent : colors.ink }}>{note}</Text>
            </View>;
          })}
        </View>
        <View style={styles.row}>
          <Choice label={e?.generating ? 'Generating…' : 'Generate & apply'} disabled={!audioReady || e?.generating} onPress={() => generateChords({ seedChords:seed.split(/[\s,]+/).filter(Boolean), length, duration, temperature, topK, greedy, continuous })} />
          <Choice label={e?.chordProgressionPlaying && !e.chordProgressionPaused ? 'Pause chords' : 'Play chords'} disabled={!chords.length} onPress={() => command('toggleChordProgression')} />
          <Choice label="Stop chords" disabled={!chords.length} onPress={() => command('stopChordProgression')} />
          <Choice label="Replay" disabled={!chords.length} onPress={() => command('replayChordProgression')} />
        </View>
        <Text accessibilityLiveRegion="polite" style={{ color:colors.muted }}>{e?.chordStatus ?? 'Model loads only when you generate.'}</Text>
      </Panel>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  row:{ flexDirection:'row', flexWrap:'wrap', gap:8 },
  button:{ minHeight:44, maxWidth:'100%', flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:12, paddingVertical:10, borderRadius:12, borderWidth:1, justifyContent:'center' },
  input:{ minHeight:48, borderRadius:12, borderWidth:1, paddingHorizontal:12, paddingVertical:8 },
  switchRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', gap:12 },
  chord:{ flexDirection:'row', alignItems:'center', gap:6, borderWidth:1, borderRadius:8, padding:8 },
});
