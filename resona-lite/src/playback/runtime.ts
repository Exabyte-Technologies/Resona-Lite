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

export async function initializePlayback(onAction: (action: PlaybackAction, expired?: boolean) => void) {
  if (!native) throw new Error('Rebuild Resona Lite to enable background playback.');
  const listener = native.addListener('onPlaybackAction', event => onAction(event.action, event.expired));
  try {
    await native.configure();
    for (const event of await native.drainActions()) onAction(event.action, event.expired);
  } catch (error) { listener.remove(); throw error; }
  return () => listener.remove();
}
export async function activatePlayback() { await native?.activate(); }
export async function updatePlayback(card: PlaybackCard, session: boolean) {
  if (!native) return;
  if (session && !logo) {
    const asset = Asset.fromModule(require('../../assets/resona-icon-gradient.png')); await asset.downloadAsync(); logo = asset.localUri ?? '';
  }
  await native.update(JSON.stringify({ ...card, logo, session }));
}
export async function disposePlayback() { await native?.dispose(); }

export async function liveActivitiesEnabled() { return Boolean(await native?.liveActivitiesEnabled?.()); }
