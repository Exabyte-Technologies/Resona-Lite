import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { createTrackFile } from './audio';
import { DEFAULT_SETTINGS, MODE_PRESETS, type SoundSettings } from './model';

type PlayerContextValue = {
  settings: SoundSettings;
  binauralPlaying: boolean;
  ambientPlaying: boolean;
  noisePlaying: boolean;
  audioReady: boolean;
  audioError: string | null;
  updateSetting: <Key extends keyof SoundSettings>(
    key: Key,
    value: SoundSettings[Key],
  ) => void;
  chooseMode: (mode: SoundSettings['mode']) => void;
  toggleSession: () => void;
  toggleBinaural: () => void;
  toggleAmbient: () => void;
  toggleNoise: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [binauralPlaying, setBinauralPlaying] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [noisePlaying, setNoisePlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioModeError, setAudioModeError] = useState<string | null>(null);
  const binauralPlayer = useAudioPlayer(null);
  const ambientPlayer = useAudioPlayer(null);
  const noisePlayer = useAudioPlayer(null);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    })
      .then(() => {
        if (active) setAudioModeError(null);
      })
      .catch((error: unknown) => {
        if (active) {
          setAudioModeError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const request = ++generation.current;
    const timer = setTimeout(() => {
      setAudioError(null);
      Promise.all([
        createTrackFile('binaural', settings),
        createTrackFile('ambient', settings),
        createTrackFile('noise', settings),
      ])
        .then(([binauralUri, ambientUri, noiseUri]) => {
          if (request !== generation.current) return;
          const resumeBinaural = binauralPlayer.playing;
          const resumeAmbient = ambientPlayer.playing;
          const resumeNoise = noisePlayer.playing;

          binauralPlayer.replace({ uri: binauralUri });
          ambientPlayer.replace({ uri: ambientUri });
          noisePlayer.replace({ uri: noiseUri });
          binauralPlayer.loop = true;
          ambientPlayer.loop = true;
          noisePlayer.loop = true;
          binauralPlayer.volume = (settings.masterVolume / 100) * (settings.binauralVolume / 100);
          ambientPlayer.volume = (settings.masterVolume / 100) * (settings.ambientVolume / 100);
          noisePlayer.volume = (settings.masterVolume / 100) * (settings.noiseVolume / 100);
          if (resumeBinaural) binauralPlayer.play();
          if (resumeAmbient) ambientPlayer.play();
          if (resumeNoise) noisePlayer.play();
          setAudioReady(true);
        })
        .catch((error: unknown) => {
          if (request !== generation.current) return;
          setAudioReady(false);
          setAudioError(error instanceof Error ? error.message : String(error));
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      if (generation.current === request) generation.current += 1;
    };
  }, [settings, binauralPlayer, ambientPlayer, noisePlayer]);

  const updateSetting = useCallback(
    <Key extends keyof SoundSettings>(key: Key, value: SoundSettings[Key]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const chooseMode = useCallback((mode: SoundSettings['mode']) => {
    setSettings((current) => ({ ...current, ...MODE_PRESETS[mode] }));
  }, []);

  const toggleSession = useCallback(() => {
    if (!audioReady) return;
    const shouldPause = binauralPlaying || ambientPlaying;
    if (shouldPause) {
      binauralPlayer.pause();
      ambientPlayer.pause();
      setBinauralPlaying(false);
      setAmbientPlaying(false);
    } else {
      binauralPlayer.play();
      ambientPlayer.play();
      setBinauralPlaying(true);
      setAmbientPlaying(true);
    }
  }, [audioReady, ambientPlaying, ambientPlayer, binauralPlaying, binauralPlayer]);

  const toggleBinaural = useCallback(() => {
    if (!audioReady) return;
    if (binauralPlaying) binauralPlayer.pause();
    else binauralPlayer.play();
    setBinauralPlaying(!binauralPlaying);
  }, [audioReady, binauralPlaying, binauralPlayer]);

  const toggleAmbient = useCallback(() => {
    if (!audioReady) return;
    if (ambientPlaying) ambientPlayer.pause();
    else ambientPlayer.play();
    setAmbientPlaying(!ambientPlaying);
  }, [audioReady, ambientPlaying, ambientPlayer]);

  const toggleNoise = useCallback(() => {
    if (!audioReady) return;
    if (noisePlaying) noisePlayer.pause();
    else noisePlayer.play();
    setNoisePlaying(!noisePlaying);
  }, [audioReady, noisePlaying, noisePlayer]);

  const value = useMemo(
    () => ({
      settings,
      binauralPlaying,
      ambientPlaying,
      noisePlaying,
      audioReady,
      audioError: audioError ?? audioModeError,
      updateSetting,
      chooseMode,
      toggleSession,
      toggleBinaural,
      toggleAmbient,
      toggleNoise,
    }),
    [
      settings,
      binauralPlaying,
      ambientPlaying,
      noisePlaying,
      audioReady,
      audioError,
      audioModeError,
      updateSetting,
      chooseMode,
      toggleSession,
      toggleBinaural,
      toggleAmbient,
      toggleNoise,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('usePlayer must be used inside PlayerProvider');
  return player;
}
