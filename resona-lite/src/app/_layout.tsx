import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import Icon from '../components/Icon';
import { PlayerProvider } from '../player-context';
import { fonts, useThemeColors } from '../theme';

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <PlayerProvider>
      <AppTabs isDark={scheme === 'dark'} />
    </PlayerProvider>
  );
}

function AppTabs({ isDark }: { isDark: boolean }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerTitle: () => (
            <Text accessibilityLabel="Resona" style={[styles.logo, { color: colors.ink }]}>
              resona<Text style={{ color: colors.accent }}>.</Text>
            </Text>
          ),
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
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarAccessibilityLabel: 'Home',
            tabBarIcon: ({ color }) => <Icon name="home" color={String(color)} size={21} />,
          }}
        />
        <Tabs.Screen
          name="advanced"
          options={{
            title: 'Advanced',
            tabBarLabel: 'Advanced',
            tabBarAccessibilityLabel: 'Advanced controls',
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
  logo: {
    fontFamily: fonts.body,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -1.2,
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
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '500',
  },
});
