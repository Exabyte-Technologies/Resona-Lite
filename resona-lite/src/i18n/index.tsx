import { Children, createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Text as NativeText, type TextProps } from 'react-native';
import { isLanguage, translate, type Language, type Parameters } from './core';
import { readLanguage, writeLanguage } from './storage';
export { LANGUAGES, type Language } from './core';
const LocaleContext = createContext({ language:'en' as Language, ready:true, hasChosenLanguage:true, setLanguage:(_language: Language) => {}, t:(source: string, parameters?: Parameters) => translate('en',source,parameters), rtl:false });
export function LanguageProvider({ children }: PropsWithChildren) {
  const [language,setCurrent] = useState<Language>('en');
  const [ready,setReady] = useState(false);
  const [hasChosenLanguage,setChosen] = useState(false);
  useEffect(() => { let active=true;readLanguage().then(value=>{if(!active)return;if(value){setCurrent(value);setChosen(true);}setReady(true);});return()=>{active=false;}; },[]);
  const setLanguage=useCallback((value: Language)=>{if(!isLanguage(value))return;setCurrent(value);setChosen(true);void writeLanguage(value).catch(()=>{});},[]);
  const t=useCallback((source: string,parameters?: Parameters)=>translate(language,source,parameters),[language]);
  const value=useMemo(()=>({language,ready,hasChosenLanguage,setLanguage,t,rtl:language==='ar'}),[language,ready,hasChosenLanguage,setLanguage,t]);
  useEffect(()=>{if(typeof document!=='undefined'){document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';}},[language]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export const useLanguage=()=>useContext(LocaleContext);
export function LocalizedText({ children,style,accessibilityLabel,...props }: TextProps) {
  const { t,rtl }=useLanguage();
  return <NativeText {...props} accessibilityLabel={accessibilityLabel?t(accessibilityLabel):undefined} style={[{writingDirection:rtl?'rtl':'ltr'},style]}>{Children.map(children,child=>typeof child==='string'?t(child):child)}</NativeText>;
}
