import { requireOptionalNativeModule } from 'expo';
import { Asset } from 'expo-asset';
import type { PlaybackAction, PlaybackCard } from './types';

type NativeAction = { action: PlaybackAction; expired: boolean };
type NativePlayback = {
  liveActivitiesEnabled?: () => Promise<boolean>; configure: () => Promise<void>; activate: () => Promise<void>; update: (json: string) => Promise<void>; dispose: () => Promise<void>;
  drainActions: () => Promise<NativeAction[]>;
  addListener: (event: 'onPlaybackAction', listener: (event: NativeAction) => void) => { remove: () => void };
};
const native = requireOptionalNativeModule<NativePlayback>('ResonaPlayback');
export const backgroundAvailable = Boolean(native);
let logo = '';
let queue: Promise<unknown> = Promise.resolve();

// Audio activation and Now Playing updates both touch the native session.
function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
}

export async function initializePlayback(onAction: (action: PlaybackAction, expired?: boolean) => void) {
  if (!native) throw new Error('Rebuild Resona Lite to enable background playback.');
  const listener = native.addListener('onPlaybackAction', event => onAction(event.action, event.expired));
  try {
    const pending = await enqueue(async () => {
      await native.configure();
      return native.drainActions();
    });
    for (const event of pending) onAction(event.action, event.expired);
  } catch (error) { listener.remove(); throw error; }
  return () => listener.remove();
}
export async function activatePlayback() {
  if (native) await enqueue(() => native.activate());
}
export async function updatePlayback(card: PlaybackCard, session: boolean) {
  if (!native) return;
  await enqueue(async () => {
    if (session && !logo) {
      const asset = Asset.fromModule(require('../../assets/resona-icon-gradient.png'));
      try { await asset.downloadAsync(); logo = asset.localUri ?? ''; }
      catch (error) { console.warn('Could not load Now Playing artwork', error); }
    }
    await native.update(JSON.stringify({ ...card, logo, session }));
  });
}
export async function disposePlayback() {
  if (native) await enqueue(() => native.dispose());
}

export async function liveActivitiesEnabled() { return Boolean(await native?.liveActivitiesEnabled?.()); }
