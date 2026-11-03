import { isLanguage, type Language } from './core';
export async function readLanguage(): Promise<Language | null> { try { const value=localStorage.getItem('resona.language.v1');return isLanguage(value) ? value : null; } catch { return null; } }
export async function writeLanguage(language: Language) { localStorage.setItem('resona.language.v1',language); }
