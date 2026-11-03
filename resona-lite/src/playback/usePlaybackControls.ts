import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { useLanguage } from '../i18n';
import * as surface from './surface';
import { initializePlayback, updatePlayback, disposePlayback } from './runtime';
import type { PlaybackAction } from './types';

const unavailable = 'Playback controls are unavailable.';
const permissionRequired = 'Allow Live Activities for Resona Lite in Settings.';

type Props = { playing: boolean; mood: string; deadline: number | null; onAction: (action: PlaybackAction, expired?: boolean) => void; session: boolean };
export function usePlaybackControls({ playing, mood, deadline, onAction, session }: Props) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(surface.supported);
  const [error, setError] = useState<string | null>(null);
  const actionRef = useRef(onAction);
  useEffect(() => { actionRef.current = onAction; }, [onAction]);
  const surfaceQueue = useRef<Promise<void>>(Promise.resolve());
  const [nativeReady, setNativeReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    let mounted = true;
    let disposeNative = () => {};
    let disposeSurface = () => {};
    const receive = (url: string | null | undefined) => {
      if (!url) return;
      try {
        const parsed = new URL(url), action = parsed.searchParams.get('action');
        if (parsed.protocol === 'resona-lite:' && ['play', 'pause', 'stop', 'extend'].includes(action ?? '')) actionRef.current(action as PlaybackAction);
      } catch {}
    };
    const links = Linking.addEventListener('url', event => receive(event.url));
    const foreground = AppState.addEventListener('change', setAppState);
    void initializePlayback((action, expired) => actionRef.current(action, expired)).then(cleanup => {
      disposeNative = cleanup;
      if (mounted) setNativeReady(true);
      else disposeNative();
    }).catch(problem => console.warn('Could not configure playback controls', problem));
    if (surface.supported) {
      surfaceQueue.current = surfaceQueue.current.then(async () => {
        disposeSurface = await surface.initialize(action => actionRef.current(action));
        const preference = await surface.readEnabled().catch(() => true);
        if (mounted) {
          setEnabled(preference);
          setReady(true);
        } else disposeSurface();
      }).catch(problem => {
        console.warn('Could not initialize Live Activities', problem);
        if (mounted) setError(unavailable);
      });
    }
    void Linking.getInitialURL().then(url => { if (mounted) receive(url); }).catch(() => {});
    return () => {
      mounted = false;
      links.remove();
      foreground.remove();
      disposeNative();
      disposeSurface();
      void disposePlayback().catch(() => {});
      surfaceQueue.current = surfaceQueue.current.then(surface.hide).catch(() => {});
    };
  }, []);

  const changeEnabled = useCallback((value: boolean) => {
    setEnabled(value);
    setError(null);
    try { surface.saveEnabled(value); }
    catch (problem) { console.warn('Could not save the Live Activities preference', problem); }
  }, []);

  const card = useMemo(() => ({
    playing, mood: t(mood), status: t(playing ? 'Playing' : 'Paused'),
    playLabel: t(playing ? 'Pause' : 'Play'), stopLabel: t('Stop'),
    extendLabel: t('+15 min'), helper: '', deadline, timerLabel: t('Sleep timer'), logo: '',
  }), [playing, mood, deadline, t]);

  useEffect(() => {
    if (!nativeReady) return;
    void updatePlayback(card, session)
      .catch(problem => console.warn('Could not update playback controls', problem));
  }, [nativeReady, card, session]);

  useEffect(() => {
    if (!ready) return;
    let current = true;
    surfaceQueue.current = surfaceQueue.current.then(async () => {
      if (!current) return;
      if (!enabled) {
        await surface.hide();
        return;
      }
      const allowed = await surface.requestAccess();
      if (!current) return;
      setError(allowed ? null : permissionRequired);
      if (allowed && session) await surface.show(card);
      else await surface.hide();
    }).catch(problem => {
      console.warn('Could not update the Live Activity', problem);
      if (current) setError(unavailable);
    });
    return () => { current = false; };
  }, [enabled, ready, card, session, appState]);

  return { supported: surface.supported, ready, enabled, error, setEnabled: changeEnabled };
}
