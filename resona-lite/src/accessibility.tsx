import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, AppState, Platform, useColorScheme, useWindowDimensions } from 'react-native';
import { readAccessibilityPreferences, saveAccessibilityPreferences } from './accessibility-storage';

type Appearance = 'system' | 'light' | 'dark';
type Preferences = {
  appearance: Appearance;
  highContrast: boolean;
  reduceMotion: boolean;
  largerText: boolean;
};

const defaults: Preferences = {
  appearance: 'system',
  highContrast: false,
  reduceMotion: false,
  largerText: false,
};
async function readPreferences(): Promise<Preferences> {
  try {
    const raw = await readAccessibilityPreferences();
    const stored = JSON.parse(raw ?? '{}');
    const appearance = stored.appearance === 'light' || stored.appearance === 'dark' ? stored.appearance : 'system';
    return {
      appearance,
      highContrast: stored.highContrast === true,
      reduceMotion: stored.reduceMotion === true,
      largerText: stored.largerText === true,
    };
  } catch {
    return defaults;
  }
}

const AccessibilityContext = createContext({
  preferences: defaults,
  updatePreferences: (_patch: Partial<Preferences>) => {},
  highContrast: false,
  textMultiplier: 1,
  fontScale: 1,
  spacious: false,
  ready: true,
});

export function AccessibilityProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [systemContrast, setSystemContrast] = useState(false);
  const { fontScale: systemScale, width } = useWindowDimensions();

  useEffect(() => {
    let active = true;
    void readPreferences().then(value => {
      if (!active) return;
      setPreferences(value);
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      saveAccessibilityPreferences(JSON.stringify(preferences));
    } catch {
      // The controls still apply for this session if local storage is unavailable.
    }
  }, [preferences, ready]);

  useEffect(() => {
    let active = true;
    const setContrast = (enabled: boolean) => { if (active) setSystemContrast(enabled); };
    if (Platform.OS === 'web') {
      const media = window.matchMedia('(prefers-contrast: more)');
      const update = () => setContrast(media.matches);
      update();
      media.addEventListener('change', update);
      return () => { active = false; media.removeEventListener('change', update); };
    }
    const refresh = () => {
      const query = Platform.OS === 'ios'
        ? AccessibilityInfo.isDarkerSystemColorsEnabled()
        : AccessibilityInfo.isHighTextContrastEnabled();
      void query.then(setContrast).catch(() => {});
    };
    refresh();
    const subscription = Platform.OS === 'ios'
      ? AccessibilityInfo.addEventListener('darkerSystemColorsChanged', setContrast)
      : AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { active = false; subscription.remove(); };
  }, []);

  const fontScale = Math.max(systemScale, preferences.largerText ? 2 : 1);
  return <AccessibilityContext.Provider value={{
    preferences,
    updatePreferences: patch => setPreferences(current => ({ ...current, ...patch })),
    highContrast: systemContrast || preferences.highContrast,
    textMultiplier: preferences.largerText ? Math.max(1, 2 / systemScale) : 1,
    fontScale,
    spacious: fontScale >= 1.35 || width < 350,
    ready,
  }}>{children}</AccessibilityContext.Provider>;
}

export const useAccessibilitySettings = () => useContext(AccessibilityContext);

export function useAppColorScheme() {
  const system = useColorScheme();
  const { preferences } = useAccessibilitySettings();
  return preferences.appearance === 'system' ? system ?? 'light' : preferences.appearance;
}
