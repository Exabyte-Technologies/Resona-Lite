import { File, Paths } from 'expo-file-system';

const preference = () => new File(Paths.document, 'resona-tour-v1.json');

export async function hasSeenTutorial(): Promise<boolean> {
  const file = preference();
  if (!file.exists) return false;
  try { return JSON.parse(await file.text()).completed === true; } catch { return false; }
}

export async function markTutorialSeen(): Promise<void> {
  const file = preference();
  if (!file.exists) file.create({ intermediates:true });
  file.write(JSON.stringify({ completed:true }));
}
