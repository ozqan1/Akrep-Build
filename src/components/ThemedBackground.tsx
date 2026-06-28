import { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/useTheme';
import { useSettings } from '@/store/useSettings';

interface Props {
  children: ReactNode;
}

/**
 * Full-screen background. In AMOLED mode it renders the theme wallpaper with a
 * darkening gradient for legibility; in light mode it renders a flat surface.
 */
export function ThemedBackground({ children }: Props) {
  const theme = useTheme();
  const appearance = useSettings((s) => s.appearance);

  if (appearance === 'light') {
    return <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>{children}</View>;
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <ImageBackground source={theme.wallpaper} style={styles.fill} resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.78)']}
          style={styles.fill}
        >
          {children}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
