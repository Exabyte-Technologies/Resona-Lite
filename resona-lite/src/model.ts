export type Page = 'home' | 'advanced';
export type Mode = 'sleep' | 'meditation' | 'focus' | 'awake';
export type NoiseType = 'white' | 'pink' | 'brown' | 'rain' | 'ocean' | 'forest';
export type Track = 'binaural' | 'ambient' | 'noise';

export type SoundSettings = {
  mode: Mode;
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
  droneFrequency: 200,
  drone: 48,
  pads: 64,
  textures: 32,
  melody: 24,
  spatial: 46,
  noise: 'pink',
  binauralVolume: 50,
  ambientVolume: 50,
  noiseVolume: 50,
};

const modeRoots = {
  sleep: 220,
  meditation: 174.61,
  focus: 220,
  awake: 130.81,
} as const;

export const MODE_PRESETS: Record<Mode, Pick<SoundSettings, 'mode' | 'beatHz' | 'droneFrequency'>> =
  {
    sleep: { mode: 'sleep', beatHz: 2, droneFrequency: modeRoots.sleep },
    meditation: { mode: 'meditation', beatHz: 6, droneFrequency: modeRoots.meditation },
    focus: { mode: 'focus', beatHz: 10, droneFrequency: modeRoots.focus },
    awake: { mode: 'awake', beatHz: 18, droneFrequency: modeRoots.awake },
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
