export type Page = 'home' | 'advanced';
export type Mode = 'sleep' | 'meditation' | 'focus' | 'awake';
export type NoiseType = 'white' | 'pink' | 'brown' | 'rain' | 'ocean' | 'forest';
export type Track = 'binaural' | 'ambient' | 'noise';

export type SoundSettings = {
  mode: Mode;
  atmosphere: 'restore' | 'melancholy' | 'deep';
  tonalSource: 'manual' | 'generated';
  manualRootMidi: number;
  binauralMode: 'difference' | 'individual';
  leftFrequency: number;
  rightFrequency: number;
  warmth: number;
  movement: number;
  space: number;
  texture: number;
  shimmer: number;
  output: number;
  chordTransition: number;
  binauralChordTransition: number;
  pad: number;
  flute: number;
  strings: number;
  bells: number;
  masterVolume: number;
  beatHz: number;
  droneFrequency: number;
  drone: number;
  pads: number;
  textures: number;
  melody: number;
  spatial: number;
  noise: NoiseType;
  binauralVolume: number;
  ambientVolume: number;
  noiseVolume: number;
};

export const DEFAULT_SETTINGS: SoundSettings = {
  mode: 'meditation',
  masterVolume: 70,
  beatHz: 6,
  droneFrequency: 440 * 2 ** ((53 - 69) / 12),
  atmosphere: 'deep', tonalSource: 'manual', manualRootMidi: 53,
  binauralMode: 'difference',
  leftFrequency: 440 * 2 ** ((53 - 69) / 12) - 3,
  rightFrequency: 440 * 2 ** ((53 - 69) / 12) + 3,
  warmth: 80, movement: 25, space: 82, texture: 20, shimmer: 21, output: 58,
  chordTransition: 0, binauralChordTransition: 0,
  pad: 72, flute: 38, strings: 51, bells: 24,
  drone: 58,
  pads: 68,
  textures: 30,
  melody: 18,
  spatial: 58,
  noise: 'pink',
  binauralVolume: 15,
  ambientVolume: 90,
  noiseVolume: 0,
};

export const MODES: readonly {
  id: Mode;
  title: string;
  description: string;
  symbol: string;
}[] = [
  { id: 'sleep', title: 'Sleep', description: 'Deep & quiet', symbol: '◔' },
  { id: 'meditation', title: 'Meditation', description: 'Slow & spacious', symbol: '◎' },
  { id: 'focus', title: 'Focus', description: 'Calm & clear', symbol: '◇' },
  { id: 'awake', title: 'Awake', description: 'Bright & active', symbol: '✦' },
];

export const BEAT_BANDS = [
  { hz: 2, name: 'Delta', purpose: 'Deep sleep' },
  { hz: 6, name: 'Theta', purpose: 'Meditation' },
  { hz: 10, name: 'Alpha', purpose: 'Calm focus' },
  { hz: 18, name: 'Beta', purpose: 'Clear energy' },
  { hz: 36, name: 'Gamma', purpose: 'Insight' },
] as const;

export const NOISE_TYPES: readonly {
  id: NoiseType;
  description: string;
}[] = [
  { id: 'white', description: 'Bright · Full spectrum' },
  { id: 'pink', description: 'Balanced · Soft' },
  { id: 'brown', description: 'Deep · Grounding' },
  { id: 'rain', description: 'Fine · Restorative' },
  { id: 'ocean', description: 'Slow · Rhythmic' },
  { id: 'forest', description: 'Organic · Airy' },
];
