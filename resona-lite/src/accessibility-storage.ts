import { File, Paths } from 'expo-file-system';

const preferenceFile = () => new File(Paths.document, 'resona-accessibility-v1.json');

export async function readAccessibilityPreferences() {
  const file = preferenceFile();
  return file.exists ? file.text() : null;
}

export function saveAccessibilityPreferences(json: string) {
  const file = preferenceFile();
  if (!file.exists) file.create({ intermediates: true });
  file.write(json);
}
