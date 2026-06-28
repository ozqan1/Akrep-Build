import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/theme/useTheme';
import { haptic } from '@/lib/haptics';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_META: Record<string, { label: string; icon: IconName; iconFocused: IconName }> = {
  index: { label: 'Galeri', icon: 'home-outline', iconFocused: 'home' },
  videos: { label: 'Videolar', icon: 'videocam-outline', iconFocused: 'videocam' },
  audio: { label: 'Müzik', icon: 'musical-notes-outline', iconFocused: 'musical-notes' },
  settings: { label: 'Ayarlar', icon: 'settings-outline', iconFocused: 'settings' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <BlurView
        intensity={40}
        tint="dark"
        style={[styles.bar, { backgroundColor: c.tabBar, borderColor: c.border }]}
      >
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          return (
            <PressableScale
              key={route.key}
              hapticOnPress={false}
              scaleTo={0.88}
              style={styles.tab}
              onPress={() => {
                haptic('select');
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            >
              {focused && (
                <View style={[styles.activePill, { backgroundColor: c.accent + '22' }]} />
              )}
              <Ionicons
                name={focused ? meta.iconFocused : meta.icon}
                size={22}
                color={focused ? c.accent : c.textDim}
              />
              <Text style={[styles.label, { color: focused ? c.accent : c.textDim }]}>
                {meta.label}
              </Text>
            </PressableScale>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="videos" />
      <Tabs.Screen name="audio" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: -6,
    left: '10%',
    right: '10%',
    bottom: -6,
    borderRadius: 14,
  },
  label: { fontSize: 10, fontWeight: '700' },
});
