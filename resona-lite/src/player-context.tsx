import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { activatePlayback } from './playback/runtime';
import AudioHost from './engine/AudioHost';
import type { AudioCommand, ChordOptions, EngineMessage, EngineState } from './engine/types';
import { timerDeadline, timerExpired, timerRemaining } from './sleep-timer';
import { usePlaybackControls } from './playback/usePlaybackControls';
import type { PlaybackAction } from './playback/types';
import { DEFAULT_SETTINGS, type SoundSettings } from './model';

type PlayerContextValue = {
  sleepDeadline: number | null; sleepRemaining: number; sleepFinished: boolean;
  setSleepTimer: (minutes: number | null) => void;
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
      if(['toggleSession','toggle','toggleAmbient','toggleNoise','playSession','generate','toggleChordProgression','replayChordProgression'].includes(action))await activatePlayback();
      commandRef.current?.({action,args});
    }).catch((error:unknown)=>setAudioError(error instanceof Error?error.message:String(error)));
  }, []);
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
    if (message.type === 'ready') { setAudioReady(true); return; }
    if (message.type === 'error') { setAudioError(message.message); return; }
    setEngineState(message);
    if(message.playing||message.ambientPlaying||message.noisePlaying){setControlsSession(true);setSleepFinished(false);}
    else setControlsSession(message.paused);
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
    <PlayerContext.Provider value={{ sleepDeadline,sleepRemaining,sleepFinished,setSleepTimer,settings, audioReady, audioError, engineState,
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
