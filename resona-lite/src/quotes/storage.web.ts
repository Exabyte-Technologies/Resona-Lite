const key = 'resona.home-quote.v1';

export async function readLastQuote(): Promise<string | null> {
  try { return localStorage.getItem(key); } catch { return null; }
}

export async function writeLastQuote(quote: string) {
  localStorage.setItem(key, quote);
}
