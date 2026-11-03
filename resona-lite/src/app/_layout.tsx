import { HomeQuoteProvider } from '../quotes';
import { LanguageProvider, useLanguage } from '../i18n';
import { StartupProvider } from '../startup';
import Brand from '../components/Brand';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Easing, StyleSheet, View, useColorScheme } from 'react-native';
import Icon from '../components/Icon';
import { PlayerProvider } from '../player-context';
import { useThemeColors } from '../theme';
import { MotionProvider, useReducedMotion } from '../motion';
import { TutorialProvider } from '../tutorial-context';
import { BlurBackdropProvider } from '../components/BlurBackdrop';

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <LanguageProvider>
    <HomeQuoteProvider>
    <StartupProvider>
    <MotionProvider>
      <BlurBackdropProvider>
        <TutorialProvider>
          <PlayerProvider>
            <AppTabs isDark={scheme === 'dark'} />
          </PlayerProvider>
        </TutorialProvider>
      </BlurBackdropProvider>
    </MotionProvider>
    </StartupProvider>
    </HomeQuoteProvider>
    </LanguageProvider>
  );
}

function AppTabs({ isDark }: { isDark: boolean }) {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const {t,rtl}=useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background,direction:rtl?'rtl':'ltr' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          animation: reduceMotion ? 'none' : 'fade',
          transitionSpec: { animation:'timing', config:{ duration:260, easing:Easing.inOut(Easing.cubic) } },
          headerTitle: () => <Brand/>,
          headerTitleAlign: 'left',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.line,
            },
          ],
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.dim,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('Home'),
            tabBarLabel: t('Home'),
            tabBarAccessibilityLabel: t('Home'),
            tabBarIcon: ({ color }) => <Icon name="home" color={String(color)} size={21} />,
          }}
        />
        <Tabs.Screen
          name="advanced"
          options={{
            title: t('Advanced'),
            tabBarLabel: t('Advanced'),
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
    height: 72,
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
  },
});
