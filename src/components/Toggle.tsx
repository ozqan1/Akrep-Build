import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { useTheme } from '@/theme/useTheme';
import { haptic } from '@/lib/haptics';

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
}

/** iOS-style animated switch tinted with the active accent color. */
export function Toggle({ value, onChange }: Props) {
  const theme = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(120,120,128,0.32)', theme.colors.accent]
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 22 }],
  }));

  return (
    <PressableScale
      hapticOnPress={false}
      onPress={() => {
        haptic('select');
        onChange(!value);
      }}
      scaleTo={0.92}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 31,
    borderRadius: 16,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
