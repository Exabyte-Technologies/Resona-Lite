import type { PlaybackAction, PlaybackCard } from './types';
// Keep the same extension as surface.ios.tsx so Metro picks the iOS variant.
export const supported = false;
export async function initialize(_onAction: (action: PlaybackAction) => void) { return () => {}; }
export async function requestAccess() { return false; }
export async function show(_card: PlaybackCard) {}
export async function hide() {}
