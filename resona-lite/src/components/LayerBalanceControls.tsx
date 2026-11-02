import { StyleSheet, View } from 'react-native';
import RangeControl from './RangeControl';
import type { SoundSettings } from '../model';

export type LayerVolumeKey = 'binauralVolume' | 'ambientVolume' | 'noiseVolume';
export type LayerBalanceProps = {
  settings: Pick<SoundSettings, LayerVolumeKey>;
  onChange: (key: LayerVolumeKey, value: number) => void;
};

const layers = [
  { key:'binauralVolume', title:'Binaural beats', description:'Overall binaural output' },
  { key:'ambientVolume', title:'Ambient music', description:'Overall ambient output' },
  { key:'noiseVolume', title:'Noise generator', description:'Overall noise output' },
] as const;

export default function LayerBalanceControls({ settings, onChange }: LayerBalanceProps) {
  return <View style={styles.controls}>
    {layers.map(layer => <RangeControl key={layer.key} compact title={layer.title} description={layer.description} value={settings[layer.key]} minimum={0} maximum={100} unit="%" onChange={value => onChange(layer.key,value)} />)}
  </View>;
}

const styles = StyleSheet.create({ controls:{ gap:20 } });
