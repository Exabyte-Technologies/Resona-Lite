import { File, Paths } from 'expo-file-system';

const preference = () => new File(Paths.document, 'resona-home-quote-v1.json');

export async function readLastQuote(): Promise<string | null> {
  try {
    const file = preference();
    if (!file.exists) return null;
    const value = JSON.parse(await file.text()).quote;
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

export async function writeLastQuote(quote: string) {
  const file = preference();
  if (!file.exists) file.create({ intermediates: true });
  file.write(JSON.stringify({ quote }));
}
