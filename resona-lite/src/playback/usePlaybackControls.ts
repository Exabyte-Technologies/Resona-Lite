import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../i18n';
import { initializePlayback, updatePlayback, disposePlayback } from './runtime';
import type { PlaybackAction } from './types';

type Props = { playing: boolean; mood: string; deadline: number | null; onAction: (action: PlaybackAction, expired?: boolean) => void; session: boolean };
export function usePlaybackControls({ playing, mood, deadline, onAction, session }: Props) {
  const { t } = useLanguage();
  const actionRef = useRef(onAction);
  useEffect(() => { actionRef.current = onAction; }, [onAction]);
  const [nativeReady, setNativeReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let disposeNative = () => {};
    void initializePlayback((action, expired) => actionRef.current(action, expired)).then(cleanup => {
      disposeNative = cleanup;
      if (mounted) setNativeReady(true);
      else disposeNative();
    }).catch(problem => console.warn('Could not configure playback controls', problem));
    return () => {
      mounted = false;
      disposeNative();
      void disposePlayback().catch(() => {});
    };
  }, []);

  const card = useMemo(() => ({
    playing, mood: t(mood), status: t(playing ? 'Playing' : 'Paused'),
    playLabel: t(playing ? 'Pause' : 'Play'), stopLabel: t('Stop'),
    extendLabel: t('+15 min'), deadline, logo: '',
  }), [playing, mood, deadline, t]);

  useEffect(() => {
    if (!nativeReady) return;
    void updatePlayback(card, session)
      .catch(problem => console.warn('Could not update playback controls', problem));
  }, [nativeReady, card, session]);
}
