import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren, type RefObject, type ComponentRef } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';

const BlurTargetContext = createContext<RefObject<ComponentRef<typeof View> | null> | undefined>(undefined);

export function BlurBackdropProvider({ children }: PropsWithChildren) {
  const target = useRef<ComponentRef<typeof View> | null>(null);
  return <BlurTargetContext.Provider value={target}>
    <BlurTargetView ref={target} style={styles.target}>{children}</BlurTargetView>
  </BlurTargetContext.Provider>;
}

export default function BlurBackdrop({ intensity = 24 }: { intensity?: number }) {
  const target = useContext(BlurTargetContext);
  const isDark = useColorScheme() === 'dark';
  const [reduceTransparency, setReduceTransparency] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    AccessibilityInfo.isReduceTransparencyEnabled().then(value => { if (active) setReduceTransparency(value); }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);
  const androidProps = Platform.OS === 'android' ? { blurTarget:target, blurMethod:'dimezisBlurView' as const } : {};
  return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
    {!reduceTransparency ? <BlurView {...androidProps} intensity={intensity} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
    <View style={[StyleSheet.absoluteFill, { backgroundColor:reduceTransparency ? (isDark ? '#101a1c' : '#e2eae5') : 'rgba(8,25,27,0.24)' }]} />
  </View>;
}

const styles = StyleSheet.create({ target:{ flex:1 } });
