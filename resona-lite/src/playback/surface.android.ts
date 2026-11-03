import type { PlaybackAction, PlaybackCard } from './types';
// Android's required foreground media notification is managed by ResonaPlaybackService.
export const supported = false;
export async function initialize(_onAction: (action: PlaybackAction) => void) { return () => {}; }
export async function requestAccess() { return true; }
export async function show(_card: PlaybackCard) {}
export async function hide() {}
