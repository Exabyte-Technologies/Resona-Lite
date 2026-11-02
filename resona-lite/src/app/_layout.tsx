import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import { PlayerProvider } from '../player-context';
import { colors, fonts } from '../theme';

export default function RootLayout() {
  return (
    <PlayerProvider>
      <AppTabs />
    </PlayerProvider>
  );
}

function AppTabs() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerTitle: () => (
            <Text accessibilityLabel="Resona" style={styles.logo}>
              resona<Text style={styles.logoAccent}>.</Text>
            </Text>
          ),
          headerTitleAlign: 'left',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: styles.tabBar,
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
            tabBarIcon: ({ color, focused }) => <TabMarker color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="advanced"
          options={{
            title: 'Advanced',
            tabBarLabel: 'Advanced',
            tabBarIcon: ({ color, focused }) => <TabMarker color={color} focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  );
}

function TabMarker({
  color,
  focused,
}: {
  color: ColorValue | undefined;
  focused: boolean;
}) {
  return (
    <View
      style={[
        styles.tabMarker,
        { backgroundColor: color, opacity: focused ? 1 : 0 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logo: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  logoAccent: {
    color: colors.accent,
  },
  tabBar: {
    height: 68,
    paddingTop: 5,
    paddingBottom: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.background,
  },
  tabItem: {
    paddingTop: 2,
  },
  tabLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
  },
  tabMarker: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});
