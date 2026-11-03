import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import Tutorial from './components/Tutorial';
import LanguagePicker from './components/LanguagePicker';
import { useLanguage } from './i18n';
import { useStartupReady } from './startup';
import { hasSeenTutorial, markTutorialSeen } from './tutorial-storage';

const TutorialContext = createContext<{open:()=>void;openLanguage:()=>void}|null>(null);

export function TutorialProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);
  const [visit, setVisit] = useState(0);
  const [languageVisible,setLanguageVisible]=useState(false);
  const [initialized,setInitialized]=useState(false);
  const [firstLaunch,setFirstLaunch]=useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const {ready,hasChosenLanguage}=useLanguage();
  const startupReady=useStartupReady();
  useEffect(() => {
    if(!ready||!startupReady||initialized)return;
    let active=true;
    hasSeenTutorial().catch(() => false).then(seen => {
      if (!active) return;
      setInitialized(true);
      setShowNotice(!seen);
      if (!hasChosenLanguage) {
        setFirstLaunch(true);
        setLanguageVisible(true);
      } else if (!seen) {
        setVisible(true);
      }
    });
    return()=>{active=false;};
  },[ready,startupReady,hasChosenLanguage,initialized]);
  const open = useCallback(() => {
    setShowNotice(false);
    setVisit(value => value + 1);
    setVisible(true);
  }, []);
  const close = useCallback(() => {
    setVisible(false);
    // Dismissal always works, including if the device cannot save preferences.
    void markTutorialSeen().catch(() => {});
  }, []);
  return <TutorialContext.Provider value={{open,openLanguage:()=>{setFirstLaunch(false);setLanguageVisible(true);}}}>
    {children}
    <LanguagePicker visible={languageVisible} firstLaunch={firstLaunch} onClose={()=>setLanguageVisible(false)} onContinue={()=>{setLanguageVisible(false);if(firstLaunch){setVisit(value=>value+1);setVisible(true);}setFirstLaunch(false);}} />
    <Tutorial key={visit} visible={visible} showNotice={showNotice} onClose={close} />
  </TutorialContext.Provider>;
}

export function useTutorial() {
  const open = useContext(TutorialContext);
  if (!open) throw new Error('useTutorial must be used inside TutorialProvider');
  return open.open;
}

export function useLanguagePicker(){const value=useContext(TutorialContext);if(!value)throw new Error('Language picker provider missing');return value.openLanguage;}
