import { File, Paths } from 'expo-file-system';
import { isLanguage, type Language } from './core';
const file = () => new File(Paths.document,'resona-language-v1.json');
export async function readLanguage(): Promise<Language | null> {
  try { const preference=file(); if (!preference.exists) return null; const value=JSON.parse(await preference.text()).language; return isLanguage(value) ? value : null; } catch { return null; }
}
export async function writeLanguage(language: Language) { const preference=file(); if (!preference.exists) preference.create({intermediates:true}); preference.write(JSON.stringify({language})); }
