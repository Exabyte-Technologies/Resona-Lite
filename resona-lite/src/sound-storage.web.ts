import { decodeLibrary, emptyLibrary, type SoundLibrary } from './sound-configurations';

const key = 'resona.sound.v1';
export function readSoundLibrary(): SoundLibrary {
  try { return decodeLibrary(window.localStorage.getItem(key)) ?? emptyLibrary(); }
  catch { return emptyLibrary(); }
}
export function writeSoundLibrary(library: SoundLibrary) {
  window.localStorage.setItem(key, JSON.stringify(library));
}
