import { DEFAULT_SETTINGS, MODES, NOISE_TYPES, type SoundSettings } from './model';

export const DEFAULT_CHORD_EDITOR = {
  seed: '', length: 8, duration: 30, temperature: 1, topK: 10, greedy: false, continuous: true, enabled: true,
};

export type ChordEditor = typeof DEFAULT_CHORD_EDITOR;
export type Progression = { chords: string[]; duration: number };
export type SoundConfiguration = {
  sound: SoundSettings;
  editor: ChordEditor;
  progression: Progression;
};
export type SavedConfiguration = { id: number; name: string; configuration: SoundConfiguration };
export type SoundLibrary = {
  version: 1;
  revision: number;
  current: SoundConfiguration;
  saved: SavedConfiguration[];
};

export const DEFAULT_CONFIGURATION: SoundConfiguration = {
  sound: DEFAULT_SETTINGS,
  editor: DEFAULT_CHORD_EDITOR,
  progression: { chords: [], duration: DEFAULT_CHORD_EDITOR.duration },
};

export function emptyLibrary(): SoundLibrary {
  return { version: 1, revision: 0, current: DEFAULT_CONFIGURATION, saved: [] };
}

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const range = (value: unknown, fallback: number, min: number, max: number) =>
  finite(value) ? Math.max(min, Math.min(max, value)) : fallback;

export function normalizeConfiguration(value: unknown): SoundConfiguration {
  const raw = object(value), source = object(raw.sound), editor = object(raw.editor), progression = object(raw.progression);
  const sound = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SoundSettings)[]) {
    const fallback = DEFAULT_SETTINGS[key];
    if (typeof fallback === 'number') {
      const bounds = key === 'manualRootMidi' ? [0, 127] :
        ['droneFrequency', 'leftFrequency', 'rightFrequency'].includes(key) ? [40, 400] :
        key === 'beatHz' ? [0.1, 100] :
        ['chordTransition', 'binauralChordTransition'].includes(key) ? [0, 4] : [0, 100];
      Object.assign(sound, { [key]: range(source[key], fallback, bounds[0], bounds[1]) });
    }
  }
  sound.mode = MODES.find(mode => mode.id === source.mode)?.id ?? sound.mode;
  sound.noise = NOISE_TYPES.find(noise => noise.id === source.noise)?.id ?? sound.noise;
  if (source.atmosphere === 'restore' || source.atmosphere === 'melancholy') sound.atmosphere = source.atmosphere;
  if (source.binauralMode === 'individual') sound.binauralMode = 'individual';
  const chords = Array.isArray(progression.chords) ?
    progression.chords.slice(0, 32).filter((chord): chord is string => typeof chord === 'string' && /^[A-G](?:s|#|♯|b)?[A-Za-z0-9+#♯/ -]{0,23}$/.test(chord)) : [];
  if (source.tonalSource === 'generated' && chords.length) sound.tonalSource = 'generated';
  return {
    sound,
    editor: {
      seed: typeof editor.seed === 'string' ? editor.seed.slice(0, 256) : DEFAULT_CHORD_EDITOR.seed,
      length: Math.round(range(editor.length, 8, 2, 32)),
      duration: range(editor.duration, DEFAULT_CHORD_EDITOR.duration, 2, 120),
      temperature: range(editor.temperature, 1, 0.1, 2),
      topK: Math.round(range(editor.topK, 10, 1, 100)),
      greedy: editor.greedy === true,
      continuous: typeof editor.continuous === 'boolean' ? editor.continuous : DEFAULT_CHORD_EDITOR.continuous,
      enabled: typeof editor.enabled === 'boolean' ? editor.enabled :
        source.tonalSource === undefined ? DEFAULT_CHORD_EDITOR.enabled : source.tonalSource === 'generated',
    },
    progression: { chords, duration: range(progression.duration, DEFAULT_CHORD_EDITOR.duration, 2, 120) },
  };
}

export function decodeLibrary(text: string | null): SoundLibrary | null {
  try {
    const raw = object(JSON.parse(text ?? 'null'));
    if (raw.version !== 1 || !finite(raw.revision) || !Number.isSafeInteger(raw.revision) || raw.revision < 0 ||
      !raw.current || !Array.isArray(raw.saved)) return null;
    const revision = raw.revision;
    const ids = new Set<number>();
    const saved = raw.saved.flatMap((value): SavedConfiguration[] => {
      const { id, name, configuration } = object(value);
      if (!finite(id) || !Number.isSafeInteger(id) || id < 1 || id > revision || ids.has(id) ||
        typeof name !== 'string' || !name.trim() || !configuration) return [];
      ids.add(id);
      return [{ id, name: name.trim().slice(0, 60), configuration: normalizeConfiguration(configuration) }];
    });
    return { version: 1, revision, current: normalizeConfiguration(raw.current), saved };
  } catch {
    return null;
  }
}

export function sameConfiguration(left: SoundConfiguration, right: SoundConfiguration) {
  return JSON.stringify(left) === JSON.stringify(right);
}
