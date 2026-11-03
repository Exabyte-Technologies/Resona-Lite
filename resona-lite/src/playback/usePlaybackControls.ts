import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useLanguage } from '../i18n';
import * as surface from './surface';
import { initializePlayback, updatePlayback, disposePlayback } from './runtime';
import type { PlaybackAction } from './types';

type Props = { playing: boolean; mood: string; deadline: number | null; onAction: (action: PlaybackAction, expired?: boolean) => void; session: boolean };
export function usePlaybackControls({ playing, mood, deadline, onAction, session }: Props) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(Platform.OS === 'ios');
  const [error, setError] = useState<string | null>(null);
  const actionRef = useRef(onAction);
  useEffect(() => { actionRef.current = onAction; }, [onAction]);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [initialized, setInitialized] = useState(false);

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
    queue.current = initializePlayback((action, expired) => actionRef.current(action, expired)).then(async cleanup => {
      disposeNative = cleanup;
      disposeSurface = await surface.initialize(action => actionRef.current(action));
      if (mounted) setInitialized(true); else { disposeNative(); disposeSurface(); }
    }).catch((problem: unknown) => { if (mounted) setError(t(problem instanceof Error ? problem.message : 'Playback controls are unavailable.')); });
    void Linking.getInitialURL().then(receive).catch(() => {});
    return () => {
      mounted = false; links.remove(); disposeNative(); disposeSurface();
      queue.current = queue.current.then(async () => { await surface.hide(); await disposePlayback(); }).catch(() => {});
    };
    // Current actions are read through actionRef; the native session is initialized once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(async () => {
    setError(null);
    if (enabled) { setEnabled(false); return; }
    try {
      if (await surface.requestAccess()) setEnabled(true);
      else setError(t('Allow Live Activities for Resona Lite in Settings.'));
    } catch { setError(t('Playback controls are unavailable.')); }
  }, [enabled, t]);

  useEffect(() => {
    if (!initialized) return;
    const card = { playing, mood: t(mood), status: t(playing ? 'Playing' : 'Paused'), playLabel: t(playing ? 'Pause' : 'Play'), stopLabel: t('Stop'), extendLabel: t('+15 min'), helper: '', deadline, timerLabel: t('Sleep timer'), logo: '' };
    queue.current = queue.current.then(async () => {
      await updatePlayback(card, session);
      if (enabled && session) await surface.show(card); else await surface.hide();
    }).catch((problem: unknown) => setError(t(problem instanceof Error ? problem.message : 'Playback controls are unavailable.')));
  }, [enabled, initialized, session, playing, mood, deadline, t]);
  return { supported: surface.supported, enabled, error, toggle };
}
