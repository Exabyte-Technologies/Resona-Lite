import { useEffect, useRef } from 'react';
import { ENGINE_HTML } from './document';
import type { AudioHostProps } from './types';

export default function AudioHost({ commandRef, onMessage }: AudioHostProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    commandRef.current = command => ref.current?.contentWindow?.postMessage({ channel: 'resona-lite-command', ...command }, '*');
    const receive = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow) return;
      try { const message = JSON.parse(event.data); if (message.channel === 'resona-lite') onMessage(message); } catch { /* unrelated data */ }
    };
    window.addEventListener('message', receive);
    return () => { window.removeEventListener('message', receive); commandRef.current = null; };
  }, [commandRef, onMessage]);
  return <iframe ref={ref} srcDoc={ENGINE_HTML} title="Local audio engine" aria-hidden tabIndex={-1} allow="autoplay" style={{ position:'absolute', width:1, height:1, opacity:0, border:0, pointerEvents:'none' }} />;
}
