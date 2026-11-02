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
      <StatusBar style="light" />
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
            tabBarIcon: ({ color }) => <WaveGlyph color={color} />,
          }}
        />
        <Tabs.Screen
          name="advanced"
          options={{
            title: 'Advanced',
            tabBarLabel: 'Advanced',
            tabBarIcon: ({ color }) => <SlidersGlyph color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

function WaveGlyph({ color }: { color: ColorValue | undefined }) {
  return (
    <View style={styles.glyph}>
      {[10, 17, 7, 13].map((height, index) => (
        <View key={index} style={[styles.waveBar, { height, backgroundColor: color }]} />
      ))}
    </View>
  );
}

function SlidersGlyph({ color }: { color: ColorValue | undefined }) {
  return (
    <View style={styles.glyph}>
      {[4, 12, 8].map((top, index) => (
        <View key={index} style={[styles.sliderLine, { top, backgroundColor: color }]}>
          <View
            style={[
              styles.sliderKnob,
              { left: index === 1 ? 10 : 4, backgroundColor: color },
            ]}
          />
        </View>
      ))}
    </View>
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
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -1.3,
  },
  logoAccent: {
    color: colors.accent,
  },
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.background,
  },
  tabItem: {
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
  },
  glyph: {
    width: 22,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  waveBar: {
    width: 2,
    borderRadius: 2,
  },
  sliderLine: {
    position: 'absolute',
    left: 1,
    width: 20,
    height: 1,
  },
  sliderKnob: {
    position: 'absolute',
    top: -2,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
