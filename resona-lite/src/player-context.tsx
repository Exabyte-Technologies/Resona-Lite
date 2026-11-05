import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { activatePlayback } from './playback/runtime';
import AudioHost from './engine/AudioHost';
import type { AudioCommand, ChordOptions, EngineMessage, EngineState } from './engine/types';
import { timerDeadline, timerExpired, timerRemaining } from './sleep-timer';
import { usePlaybackControls } from './playback/usePlaybackControls';
import type { PlaybackAction } from './playback/types';
import type { SoundSettings } from './model';
import {
  DEFAULT_CONFIGURATION, normalizeConfiguration, sameConfiguration,
  type ChordEditor, type SavedConfiguration, type SoundConfiguration, type SoundLibrary,
} from './sound-configurations';
import { readSoundLibrary, writeSoundLibrary } from './sound-storage';

type PlayerContextValue = {
  sleepDeadline: number | null; sleepRemaining: number; sleepFinished: boolean;
  setSleepTimer: (minutes: number | null) => void;
  settings: SoundSettings;
  chordEditor: ChordEditor;
  updateChordEditor: (patch: Partial<ChordEditor>) => void;
  savedConfigurations: SavedConfiguration[];
  currentConfiguration: () => SoundConfiguration;
  saveConfiguration: (name: string) => boolean;
  renameConfiguration: (id: number, name: string) => boolean;
  deleteConfiguration: (id: number) => boolean;
  moveConfiguration: (id: number, direction: -1 | 1) => boolean;
  loadConfiguration: (configuration: SoundConfiguration) => void;
  resetSound: (clearSaved: boolean) => boolean;
  noiseMuted: boolean;
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
  const [library, setLibrary] = useState(readSoundLibrary);
  const libraryRef = useRef(library);
  const pendingConfiguration = useRef(0);
  const nextConfiguration = useRef(0);
  const requestedEditor = useRef(library.current.editor);
  const transport = useRef<EngineState | null>(null);
  const [noiseMuted, setNoiseMuted] = useState(false);
  const noiseNoticeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [sleepDeadline,setDeadline] = useState<number|null>(null);
  const [sleepRemaining,setRemaining] = useState(0);
  const [sleepFinished,setSleepFinished] = useState(false);
  const deadlineRef=useRef<number|null>(null);
  const [controlsSession,setControlsSession]=useState(false);
  const pendingAction=useRef<{action:PlaybackAction;expired?:boolean}|null>(null);
  const commandQueue=useRef<Promise<void>>(Promise.resolve());
  const commandRef = useRef<((command: AudioCommand) => void) | null>(null);
  const command = useCallback((action: string, ...args: unknown[]) => {
    setAudioError(null);
    commandQueue.current=commandQueue.current.then(async()=>{
      const current = transport.current;
      const alreadyPlaying = current?.playing || current?.ambientPlaying || current?.noisePlaying;
      const startsAudio = ['toggleSession', 'toggle', 'toggleAmbient', 'toggleNoise', 'playSession',
        'generate', 'toggleChordProgression', 'replayChordProgression'].includes(action) ||
        (action === 'setChordProgressionEnabled' && args[0] === true) ||
        (action === 'setTonalSource' && args[0] === 'generated');
      if (!alreadyPlaying && startsAudio) {
        await activatePlayback();
      }
      commandRef.current?.({action,args});
    }).catch((error:unknown)=>setAudioError(error instanceof Error?error.message:String(error)));
  }, []);
  const commitLibrary = useCallback((next: SoundLibrary, requireStorage = false) => {
    const record = { ...next, revision: libraryRef.current.revision + 1 };
    try { writeSoundLibrary(record); }
    catch (error) {
      console.warn('Could not save sound configurations', error);
      if (requireStorage) return false;
    }
    libraryRef.current = record;
    setLibrary(record);
    return true;
  }, []);
  const applyConfiguration = useCallback((configuration: SoundConfiguration) => {
    requestedEditor.current = configuration.editor;
    pendingConfiguration.current = ++nextConfiguration.current;
    setAudioReady(false);
    command('applyConfiguration', configuration, pendingConfiguration.current);
  }, [command]);
  const updateChordEditor = useCallback((patch: Partial<ChordEditor>) => {
    if (pendingConfiguration.current) return;
    const current = libraryRef.current;
    const configuration = { ...current.current, editor: { ...current.current.editor, ...patch } };
    if (!sameConfiguration(configuration, current.current)) {
      commitLibrary({ ...current, current: configuration });
      command('setChordOptions', configuration.editor);
    }
  }, [commitLibrary, command]);
  const saveConfiguration = (name: string) => {
    const current = libraryRef.current;
    return commitLibrary({ ...current, saved: [
      ...current.saved, { id: current.revision + 1, name, configuration: current.current },
    ] }, true);
  };
  const renameConfiguration = (id: number, name: string) => {
    const current = libraryRef.current;
    return commitLibrary({ ...current, saved: current.saved.map(item => item.id === id ? { ...item, name } : item) }, true);
  };
  const deleteConfiguration = (id: number) => {
    const current = libraryRef.current;
    return commitLibrary({ ...current, saved: current.saved.filter(item => item.id !== id) }, true);
  };
  const moveConfiguration = (id: number, direction: -1 | 1) => {
    const current = libraryRef.current;
    const index = current.saved.findIndex(item => item.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= current.saved.length) return false;
    const saved = current.saved.slice();
    [saved[index], saved[target]] = [saved[target], saved[index]];
    return commitLibrary({ ...current, saved }, true);
  };
  const resetSound = (clearSaved: boolean) => {
    const current = libraryRef.current;
    if (!commitLibrary({ ...current, current: DEFAULT_CONFIGURATION, saved: clearSaved ? [] : current.saved }, true)) return false;
    applyConfiguration(DEFAULT_CONFIGURATION);
    return true;
  };
  useEffect(() => () => clearTimeout(noiseNoticeTimeout.current), []);
  const settings = library.current.sound;
  const setSleepTimer=useCallback((minutes:number|null)=>{
    const deadline=timerDeadline(minutes);deadlineRef.current=deadline;setDeadline(deadline);setRemaining(timerRemaining(deadline));setSleepFinished(false);command('sleepTimer',deadline);
  },[command]);
  const expireTimer=useCallback(()=>{
    if(!timerExpired(deadlineRef.current))return false;
    deadlineRef.current=null;setDeadline(null);setRemaining(0);setSleepFinished(true);setControlsSession(false);command('stopAll');return true;
  },[command]);
  useEffect(()=>{if(sleepDeadline===null)return;const tick=()=>{if(!expireTimer())setRemaining(timerRemaining(deadlineRef.current));};tick();const interval=setInterval(tick,1000);return()=>clearInterval(interval);},[sleepDeadline,expireTimer]);
  const handleAction=useCallback((action:PlaybackAction,expired=false)=>{
    if(!audioReady){pendingAction.current={action,expired};return;}
    if(action==='extend'){setSleepTimer((Math.max(0,(deadlineRef.current??Date.now())-Date.now())/60000)+15);return;}
    if(action==='stop'){setSleepTimer(null);setSleepFinished(expired);setControlsSession(false);command('stopAll');}
    else {if(action==='play')setControlsSession(true);command(action==='play'?'playSession':'pauseAll');}
  },[audioReady,command,setSleepTimer]);
  useEffect(()=>{if(audioReady&&pendingAction.current){const event=pendingAction.current;pendingAction.current=null;handleAction(event.action,event.expired);}},[audioReady,handleAction]);
  const anyPlaying=Boolean(engineState?.playing||engineState?.ambientPlaying||engineState?.noisePlaying);
  usePlaybackControls({playing:anyPlaying,mood:settings.mode[0].toUpperCase()+settings.mode.slice(1),deadline:sleepDeadline,onAction:handleAction,session:controlsSession});
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      // Leaving the foreground must not suspend an actively playing soundscape.
      if(state==='active'){expireTimer();command('refresh');}
    });
    return () => subscription.remove();
  }, [command,expireTimer]);

  const onMessage = useCallback((message: EngineMessage) => {
    if (message.type === 'ready') { applyConfiguration(libraryRef.current.current); return; }
    if (message.type === 'noiseMuted') {
      clearTimeout(noiseNoticeTimeout.current);
      setNoiseMuted(true);
      noiseNoticeTimeout.current = setTimeout(() => setNoiseMuted(false), 3500);
      return;
    }
    if (message.type === 'error') {
      setAudioError(message.message);
      if (pendingConfiguration.current && message.configurationRequest === pendingConfiguration.current) {
        pendingConfiguration.current = 0;
        setAudioReady(true);
      }
      return;
    }
    if (!nextConfiguration.current) return;
    if (pendingConfiguration.current && message.appliedConfiguration !== pendingConfiguration.current) return;
    const restoring = pendingConfiguration.current !== 0;
    pendingConfiguration.current = 0;
    transport.current = message;
    setAudioReady(true);
    setEngineState(message);
    if (message.playing || message.ambientPlaying || message.noisePlaying) {
      setControlsSession(true);
      setSleepFinished(false);
    } else setControlsSession(message.paused);
    const c = message.config, a = c.ambient;
    const current = libraryRef.current;
    const configuration = normalizeConfiguration({
      editor: { ...(restoring ? requestedEditor.current : current.current.editor), enabled: message.chordProgressionEnabled },
      progression: message.savedProgression,
      sound: {
        mode:c.mode, masterVolume:c.master, beatHz:c.beat, droneFrequency:a.droneFrequency,
        binauralMode:c.binauralMode, leftFrequency:c.leftFrequency, rightFrequency:c.rightFrequency,
        atmosphere:a.atmosphere, tonalSource:a.tonalSource, manualRootMidi:a.manualRootMidi,
        ...a.parameters, drone:a.drone, pads:a.pads, textures:a.textures, melody:a.melody, spatial:a.spatial,
        chordTransition:a.chordTransition, binauralChordTransition:a.binauralChordTransition,
        noise:c.noise, binauralVolume:c.volumes.binaural, ambientVolume:c.volumes.ambient, noiseVolume:c.volumes.noise,
      },
    });
    if (!sameConfiguration(configuration, current.current)) commitLibrary({ ...current, current: configuration });
  }, [applyConfiguration, commitLibrary]);
  const updateSetting = useCallback(<Key extends keyof SoundSettings>(key: Key, value: SoundSettings[Key]) => {
    if (pendingConfiguration.current) return;
    const direct: Partial<Record<keyof SoundSettings, string>> = { mode:'applyMode', masterVolume:'setMaster', beatHz:'setBeat', droneFrequency:'setDroneFrequency', atmosphere:'setAtmosphere', tonalSource:'setTonalSource', binauralMode:'setBinauralMode', manualRootMidi:'setTonalCentre', noise:'setNoise', chordTransition:'setChordTransition', binauralChordTransition:'setBinauralChordTransition' };
    if (direct[key]) command(direct[key], value);
    else if (key === 'leftFrequency' || key === 'rightFrequency') command('setEarFrequency', key === 'leftFrequency' ? 'left' : 'right', value);
    else if (['warmth','movement','space','texture','shimmer','output'].includes(key)) command('setAmbientParameter', key, value);
    else if (['binauralVolume','ambientVolume','noiseVolume'].includes(key)) command('setVolume', key.replace('Volume',''), value);
    else command('setAmbient', key, value);
  }, [command]);
  return (
    <PlayerContext.Provider value={{ sleepDeadline,sleepRemaining,sleepFinished,setSleepTimer,settings, audioReady, audioError, engineState,
      binauralPlaying:engineState?.playing ?? false, ambientPlaying:engineState?.ambientPlaying ?? false, noisePlaying:engineState?.noisePlaying ?? false,
      chordEditor: library.current.editor, updateChordEditor, savedConfigurations: library.saved,
      currentConfiguration: () => libraryRef.current.current, saveConfiguration, renameConfiguration,
      deleteConfiguration, moveConfiguration, loadConfiguration: applyConfiguration, resetSound, noiseMuted,
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
