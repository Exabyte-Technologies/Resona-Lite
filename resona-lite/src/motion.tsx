import { useLanguage } from './i18n';
import { createContext, useContext, useEffect, useLayoutEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, TextInput, type PressableProps, type TextInputProps, type ViewProps } from 'react-native';
import { useAccessibilitySettings } from './accessibility';

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

export function useReducedMotion() {
  const system = useContext(MotionContext);
  const { preferences } = useAccessibilitySettings();
  return system || preferences.reduceMotion;
}

export function useMotionValue(target: number, duration = 280) {
  const reduceMotion = useReducedMotion();
  const [value] = useState(() => new Animated.Value(target));
  useEffect(() => {
    if (reduceMotion) {
      value.setValue(target);
      return;
    }
    const animation = Animated.timing(value, { toValue:target, duration, easing:Easing.inOut(Easing.cubic), useNativeDriver:true, isInteraction:false });
    animation.start();
    return () => animation.stop();
  }, [value, target, duration, reduceMotion]);
  return value;
}

type EntranceProps = ViewProps & {
  visible?: boolean;
  transitionKey?: string;
  dialog?: boolean;
};

export function MotionEntrance({ style, visible = true, transitionKey, dialog = false, ...props }: EntranceProps) {
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useLayoutEffect(() => {
    if (!visible) return;
    progress.setValue(reduceMotion ? 1 : 0);
    if (reduceMotion) return;
    const entrance = Animated.timing(progress, {
      toValue: 1,
      duration: dialog ? 200 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    entrance.start();
    return () => entrance.stop();
  }, [dialog, progress, reduceMotion, transitionKey, visible]);

  return <Animated.View {...props} style={[style, !reduceMotion && {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [dialog ? 0.85 : 0.65, 1] }),
    transform: dialog
      ? [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }]
      : [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
  }]} />;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MotionPressable({ style, onPressIn, onPressOut, ...props }: PressableProps) {
  const [pressed, setPressed] = useState(false);
  const {t}=useLanguage();
  const reduceMotion = useReducedMotion();
  const scale = useMotionValue(pressed && !props.disabled ? 0.97 : 1, pressed ? 80 : 140);
  return <AnimatedPressable {...props} accessibilityLabel={props.accessibilityLabel?t(props.accessibilityLabel):undefined} accessibilityHint={props.accessibilityHint?t(props.accessibilityHint):undefined}
    onPressIn={event => { setPressed(true); onPressIn?.(event); }}
    onPressOut={event => { setPressed(false); onPressOut?.(event); }}
    style={[typeof style === 'function' ? style({ pressed }) : style, !reduceMotion && { transform: [{ scale }] }]} />;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function MotionTextInput({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const scale = useMotionValue(focused ? 1.01 : 1, 150);
  return <AnimatedTextInput {...props}
    onFocus={event => { setFocused(true); onFocus?.(event); }}
    onBlur={event => { setFocused(false); onBlur?.(event); }}
    style={[style, !reduceMotion && { transform: [{ scale }] }]} />;
}

export function SelectionWash({ selected, color, radius = 14 }: { selected: boolean; color: string; radius?: number }) {
  const reduceMotion = useReducedMotion();
  const opacity = useMotionValue(selected ? 1 : 0);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor:color, borderRadius:radius, opacity: reduceMotion ? Number(selected) : opacity }]} />;
}
