import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import Tutorial from './components/Tutorial';
import { hasSeenTutorial, markTutorialSeen } from './tutorial-storage';

const TutorialContext = createContext<(() => void) | null>(null);

export function TutorialProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    let active = true;
    hasSeenTutorial().then(seen => { if (active && !seen) setVisible(true); }).catch(() => { if (active) setVisible(true); });
    return () => { active = false; };
  }, []);
  const open = useCallback(() => { setVisit(value => value + 1); setVisible(true); }, []);
  const close = useCallback(() => {
    setVisible(false);
    // Dismissal always works, including if the device cannot save preferences.
    void markTutorialSeen().catch(() => {});
  }, []);
  return <TutorialContext.Provider value={open}>
    {children}
    <Tutorial key={visit} visible={visible} onClose={close} />
  </TutorialContext.Provider>;
}

export function useTutorial() {
  const open = useContext(TutorialContext);
  if (!open) throw new Error('useTutorial must be used inside TutorialProvider');
  return open;
}
