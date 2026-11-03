import { HomeQuoteProvider } from '../quotes';
import { LanguageProvider, LocalizedText as Text, useLanguage } from '../i18n';
import { StartupProvider } from '../startup';
import Brand from '../components/Brand';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccessibilityProvider, useAccessibilitySettings, useAppColorScheme } from '../accessibility';
import Icon from '../components/Icon';
import { PlayerProvider } from '../player-context';
import { useThemeColors } from '../theme';
import { MotionProvider, useReducedMotion } from '../motion';
import { TutorialProvider } from '../tutorial-context';
import { BlurBackdropProvider } from '../components/BlurBackdrop';

export default function RootLayout() {
  return (
    <AccessibilityProvider>
    <LanguageProvider>
    <HomeQuoteProvider>
    <MotionProvider>
    <StartupProvider>
      <BlurBackdropProvider>
        <TutorialProvider>
          <PlayerProvider>
            <AppTabs />
          </PlayerProvider>
        </TutorialProvider>
      </BlurBackdropProvider>
    </StartupProvider>
    </MotionProvider>
    </HomeQuoteProvider>
    </LanguageProvider>
    </AccessibilityProvider>
  );
}

function AppTabs() {
  const colors = useThemeColors();
  const isDark = useAppColorScheme() === 'dark';
  const { fontScale, spacious } = useAccessibilitySettings();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const {t,rtl}=useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background,direction:rtl?'rtl':'ltr' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={({ route }) => ({
          animation: reduceMotion ? 'none' : 'fade',
          transitionSpec: { animation:'timing', config:{ duration:260, easing:Easing.inOut(Easing.cubic) } },
          headerTitle: () => <Brand/>,
          headerTitleAlign: 'left',
          headerStyle: { backgroundColor: colors.background, height: insets.top + Math.max(48, Math.ceil(30 * fontScale + 12)) },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.line,
              height: Math.max(72, insets.bottom + 22 + Math.ceil((spacious ? 31 : 16) * fontScale)),
            },
          ],
          tabBarLabelPosition: 'below-icon',
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.dim,
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.tabLabel, { color }, focused && styles.activeLabel]}>
              {route.name === 'index' ? 'Home' : 'Advanced'}
            </Text>
          ),
          tabBarItemStyle: styles.tabItem,
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('Home'),
            tabBarAccessibilityLabel: t('Home'),
            tabBarIcon: ({ color }) => <Icon name="home" color={String(color)} size={21} />,
          }}
        />
        <Tabs.Screen
          name="advanced"
          options={{
            title: t('Advanced'),
            tabBarAccessibilityLabel: t('Advanced controls'),
            tabBarIcon: ({ color }) => <Icon name="tune" color={String(color)} size={21} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    paddingTop: 4,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  activeLabel: { fontWeight: '700', textDecorationLine: 'underline' },
});
