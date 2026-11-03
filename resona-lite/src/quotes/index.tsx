import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { chooseHomeQuote, HOME_QUOTES } from './catalog';
import { readLastQuote, writeLastQuote } from './storage';

const QuoteContext = createContext<{ quote: string; ready: boolean }>({ quote: HOME_QUOTES[0], ready: true });

export function HomeQuoteProvider({ children }: PropsWithChildren) {
  const [value, setValue] = useState({ quote: HOME_QUOTES[0] as string, ready: false });

  useEffect(() => {
    let mounted = true;
    let current: string | null = null;
    let wasBackground = AppState.currentState === 'background';
    let queue = Promise.resolve();

    const refresh = () => {
      // Serialize fast reopen events so the same quote is never selected twice in a row.
      queue = queue.then(async () => {
        if (!mounted) return;
        const previous = current ?? await readLastQuote();
        if (!mounted) return;
        current = chooseHomeQuote(previous);
        setValue({ quote: current, ready: true });
        // A read-only device can still rotate quotes during the current session.
        await writeLastQuote(current).catch(() => {});
      });
    };

    refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') wasBackground = true;
      if (state === 'active' && wasBackground) {
        wasBackground = false;
        refresh();
      }
    });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export const useHomeQuote = () => useContext(QuoteContext);
