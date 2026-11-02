import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
import AudioHost from './engine/AudioHost';
import type { AudioCommand, ChordOptions, EngineMessage, EngineState } from './engine/types';
import { DEFAULT_SETTINGS, type SoundSettings } from './model';

type PlayerContextValue = {
  settings: SoundSettings;
  binauralPlaying: boolean; ambientPlaying: boolean; noisePlaying: boolean;
  audioReady: boolean; audioError: string | null; engineState: EngineState | null;
  updateSetting: <Key extends keyof SoundSettings>(key: Key, value: SoundSettings[Key]) => void;
  chooseMode: (mode: SoundSettings['mode']) => void;
  toggleSession: () => void; toggleBinaural: () => void; toggleAmbient: () => void; toggleNoise: () => void;
  command: (action: string, ...args: unknown[]) => void;
  generateChords: (options: ChordOptions) => void;
};
const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const commandRef = useRef<((command: AudioCommand) => void) | null>(null);
  const command = useCallback((action: string, ...args: unknown[]) => {
    setAudioError(null);
    commandRef.current?.({ action, args });
  }, []);
  useEffect(() => {
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false, shouldRouteThroughEarpiece: false })
      .catch((error: unknown) => setAudioError(error instanceof Error ? error.message : String(error)));
    const subscription = AppState.addEventListener('change', state => command(state === 'active' ? 'resume' : 'suspend'));
    return () => subscription.remove();
  }, [command]);

  const onMessage = useCallback((message: EngineMessage) => {
    if (message.type === 'ready') { setAudioReady(true); return; }
    if (message.type === 'error') { setAudioError(message.message); return; }
    setEngineState(message);
    const c = message.config, a = c.ambient;
    setSettings({ mode:c.mode, masterVolume:c.master, beatHz:c.beat, droneFrequency:a.droneFrequency,
      binauralMode:c.binauralMode, leftFrequency:c.leftFrequency, rightFrequency:c.rightFrequency,
      atmosphere:a.atmosphere, tonalSource:a.tonalSource, manualRootMidi:a.manualRootMidi,
      ...a.parameters, drone:a.drone, pads:a.pads, textures:a.textures, melody:a.melody, spatial:a.spatial,
      chordTransition:a.chordTransition, binauralChordTransition:a.binauralChordTransition,
      pad:c.layers.pad * 100, flute:c.layers.flute * 100, strings:c.layers.strings * 100, bells:c.layers.bells * 100,
      noise:c.noise, binauralVolume:c.volumes.binaural, ambientVolume:c.volumes.ambient, noiseVolume:c.volumes.noise });
  }, []);
  const updateSetting = useCallback(<Key extends keyof SoundSettings>(key: Key, value: SoundSettings[Key]) => {
    const direct: Partial<Record<keyof SoundSettings, string>> = { mode:'applyMode', masterVolume:'setMaster', beatHz:'setBeat', droneFrequency:'setDroneFrequency', atmosphere:'setAtmosphere', tonalSource:'setTonalSource', binauralMode:'setBinauralMode', manualRootMidi:'setTonalCentre', noise:'setNoise', chordTransition:'setChordTransition', binauralChordTransition:'setBinauralChordTransition' };
    if (direct[key]) command(direct[key], value);
    else if (key === 'leftFrequency' || key === 'rightFrequency') command('setEarFrequency', key === 'leftFrequency' ? 'left' : 'right', value);
    else if (['warmth','movement','space','texture','shimmer','output'].includes(key)) command('setAmbientParameter', key, value);
    else if (['pad','flute','strings','bells'].includes(key)) command('setLayer', key, value);
    else if (['binauralVolume','ambientVolume','noiseVolume'].includes(key)) command('setVolume', key.replace('Volume',''), value);
    else command('setAmbient', key, value);
  }, [command]);
  return (
    <PlayerContext.Provider value={{ settings, audioReady, audioError, engineState,
      binauralPlaying:engineState?.playing ?? false, ambientPlaying:engineState?.ambientPlaying ?? false, noisePlaying:engineState?.noisePlaying ?? false,
      command, updateSetting, chooseMode:mode => command('applyMode', mode),
      toggleSession:() => command('toggleSession'), toggleBinaural:() => command('toggle'), toggleAmbient:() => command('toggleAmbient'), toggleNoise:() => command('toggleNoise'),
      generateChords:options => command('generate', options) }}>
      <AudioHost commandRef={commandRef} onMessage={onMessage} />
      {children}
    </PlayerContext.Provider>
  );
}
export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('usePlayer must be used inside PlayerProvider');
  return player;
}
