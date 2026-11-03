import { File, Paths } from 'expo-file-system';
import { decodeLibrary, emptyLibrary, type SoundLibrary } from './sound-configurations';

// Keep the previous complete record if the app quits during a write.
const slot = (index: number) => new File(Paths.document, `resona-sound-v1-${index}.json`);

export function readSoundLibrary(): SoundLibrary {
  const records = [0, 1].map(index => {
    try {
      const file = slot(index);
      return file.exists ? decodeLibrary(file.textSync()) : null;
    } catch {
      return null;
    }
  });
  const [first, second] = records;
  return first && (!second || first.revision > second.revision) ? first : second ?? emptyLibrary();
}

export function writeSoundLibrary(library: SoundLibrary) {
  const file = slot(library.revision % 2);
  if (!file.exists) file.create();
  file.writeSync(JSON.stringify(library));
}
