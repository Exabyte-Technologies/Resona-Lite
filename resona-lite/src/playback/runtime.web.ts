import type { PlaybackAction, PlaybackCard } from './types';
export const backgroundAvailable = false;
export async function initializePlayback(_onAction: (action: PlaybackAction, expired?: boolean) => void) { return () => {}; }
export async function activatePlayback() {}
export async function updatePlayback(_card: PlaybackCard, _session: boolean) {}
export async function disposePlayback() {}

export async function liveActivitiesEnabled() { return false; }
