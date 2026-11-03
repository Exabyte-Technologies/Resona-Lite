import type { SoundSettings } from '../model';

export type AudioCommand = { action: string; args?: unknown[] };
export type ChordOptions = {
  seedChords: string[];
  length: number;
  temperature: number;
  topK: number;
  greedy: boolean;
  continuous: boolean;
  duration: number;
};
export type EngineState = {
  type: 'state';
  config: {
    master: number; beat: number; carrier: number; mode: SoundSettings['mode'];
    binauralMode: 'difference' | 'individual'; leftFrequency: number; rightFrequency: number;
    noise: SoundSettings['noise']; volumes: { binaural: number; ambient: number; noise: number };
    layers: { pad: number; flute: number; strings: number; bells: number };
    ambient: {
      droneFrequency: number; manualRootMidi: number; atmosphere: SoundSettings['atmosphere'];
      tonalSource: 'manual' | 'generated'; parameters: Record<'warmth' | 'movement' | 'space' | 'texture' | 'shimmer' | 'output', number>;
      drone: number; pads: number; textures: number; melody: number; spatial: number;
      chordProgression: string[]; chordDuration: number; chordTransition: number; binauralChordTransition: number;
    };
  };
  paused: boolean; playing: boolean; ambientPlaying: boolean; noisePlaying: boolean;
  chordProgressionPlaying: boolean; chordProgressionPaused: boolean; chordProgressionIndex: number;
  generating: boolean; chordStatus: string;
  pipeline: { enabled: boolean; playing: string | null; ready: string[]; generating: string | null };
};
export type EngineMessage = EngineState | { type: 'ready' } | { type: 'error'; message: string };
export type AudioHostProps = { commandRef: { current: ((command: AudioCommand) => void) | null }; onMessage: (message: EngineMessage) => void };
