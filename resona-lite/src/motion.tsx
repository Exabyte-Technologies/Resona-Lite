import { useLanguage } from './i18n';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, type PressableProps } from 'react-native';

const MotionContext = createContext(true);

export function MotionProvider({ children }: PropsWithChildren) {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);
  return <MotionContext.Provider value={reduceMotion}>{children}</MotionContext.Provider>;
}

export const useReducedMotion = () => useContext(MotionContext);

export function useMotionValue(target: number, duration = 280) {
  const reduceMotion = useReducedMotion();
  const [value] = useState(() => new Animated.Value(target));
  useEffect(() => {
    const animation = Animated.timing(value, { toValue:target, duration:reduceMotion ? 0 : duration, easing:Easing.inOut(Easing.cubic), useNativeDriver:true, isInteraction:false });
    animation.start();
    return () => animation.stop();
  }, [value, target, duration, reduceMotion]);
  return value;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MotionPressable({ style, onPressIn, onPressOut, ...props }: PressableProps) {
  const [pressed, setPressed] = useState(false);
  const {t}=useLanguage();
  const scale = useMotionValue(pressed ? 0.975 : 1, 160);
  return <AnimatedPressable {...props} accessibilityLabel={props.accessibilityLabel?t(props.accessibilityLabel):undefined} accessibilityHint={props.accessibilityHint?t(props.accessibilityHint):undefined}
    onPressIn={event => { setPressed(true); onPressIn?.(event); }}
    onPressOut={event => { setPressed(false); onPressOut?.(event); }}
    style={[typeof style === 'function' ? style({ pressed }) : style, { transform:[{ scale }] }]} />;
}

export function SelectionWash({ selected, color, radius = 14 }: { selected: boolean; color: string; radius?: number }) {
  const opacity = useMotionValue(selected ? 1 : 0);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor:color, borderRadius:radius, opacity }]} />;
}
