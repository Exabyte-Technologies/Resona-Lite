import rows from './messages.json';

export const LANGUAGES = [
  { code:'en', name:'English' }, { code:'zh', name:'简体中文' }, { code:'zh-Hant', name:'繁體中文' },
  { code:'es', name:'Español' },
  { code:'hi', name:'हिन्दी' }, { code:'ar', name:'العربية' }, { code:'pt', name:'Português' },
  { code:'fr', name:'Français' }, { code:'ru', name:'Русский' }, { code:'ja', name:'日本語' },
] as const;
export type Language = typeof LANGUAGES[number]['code'];
export const isLanguage = (value: unknown): value is Language => LANGUAGES.some(item => item.code === value);
export type Parameters = Record<string, string | number>;
const columns: Language[] = ['zh','es','hi','ar','pt','fr','ru','ja','zh-Hant'];
const dictionaries = Object.fromEntries(columns.map((language,index) => [language,Object.fromEntries(Object.entries(rows).map(([key,values]) => [key,values[index]]))])) as Record<Exclude<Language,'en'>, Record<string,string>>;
export function translate(language: Language, source: string, parameters: Parameters = {}) {
  const trimmed = source.trim();
  const unknown = /^Unknown seed chords?: (.+)$/.exec(trimmed);
  if(unknown && !trimmed.includes('{{chords}}'))return translate(language,'Unknown seed chords: {{chords}}',{chords:unknown[1]});
  const paused = /^Continuous generation paused: (.+)$/.exec(trimmed);
  if(paused && !trimmed.includes('{{reason}}'))return translate(language,'Continuous generation paused: {{reason}}',{reason:translate(language,paused[1])});
  const translated = language === 'en' ? trimmed : dictionaries[language][trimmed] ?? trimmed;
  const padded = source.slice(0,source.indexOf(trimmed)) + translated + source.slice(source.indexOf(trimmed)+trimmed.length);
  return padded.replace(/\{\{(\w+)\}\}/g, (_,key: string) => String(parameters[key] ?? `{{${key}}}`));
}
