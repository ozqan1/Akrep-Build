import React, { useCallback } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.65;
const ITEM_HEIGHT = ITEM_WIDTH * 1.35;
const GAP = 18;
const TOTAL_ITEM_WIDTH = ITEM_WIDTH + GAP;

interface Props<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onIndexChange?: (index: number) => void;
}

export function Carousel3D<T>({ data, renderItem, onIndexChange }: Props<T>) {
  const currentIndex = useSharedValue(0);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      currentIndex.value = clamped;
      translateX.value = withSpring(-clamped * TOTAL_ITEM_WIDTH, {
        damping: 20,
        stiffness: 120,
        mass: 0.8,
      });
      onIndexChange?.(clamped);
    },
    [data.length, currentIndex, translateX, onIndexChange]
  );

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
    })
    .onEnd((e) => {
      const velocityThreshold = Math.abs(e.velocityX) > 400;
      const distanceThreshold = Math.abs(e.translationX) > ITEM_WIDTH * 0.3;

      if (velocityThreshold || distanceThreshold) {
        const direction = e.translationX < 0 ? 1 : -1;
        snapToIndex(currentIndex.value + direction);
      } else {
        snapToIndex(currentIndex.value);
      }
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <View style={styles.track}>
          {data.map((item, index) => (
            <CarouselItem
              key={index}
              index={index}
              translateX={translateX}
              currentIndex={currentIndex}
              totalItems={data.length}
            >
              {renderItem(item, index)}
            </CarouselItem>
          ))}
        </View>
      </View>
    </GestureDetector>
  );
}

interface ItemProps {
  index: number;
  translateX: SharedValue<number>;
  currentIndex: SharedValue<number>;
  totalItems: number;
  children: React.ReactNode;
}

function CarouselItem({ index, translateX, currentIndex, children }: ItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const itemOffset = translateX.value + index * TOTAL_ITEM_WIDTH;
    const centerOffset = (SCREEN_WIDTH - ITEM_WIDTH) / 2;
    const relativeOffset = itemOffset + centerOffset;
    const normalizedPosition = relativeOffset / TOTAL_ITEM_WIDTH - (index - currentIndex.value);

    // Rotation based on position relative to center
    const rotationY = interpolate(
      relativeOffset - centerOffset,
      [-TOTAL_ITEM_WIDTH, 0, TOTAL_ITEM_WIDTH],
      [45, 0, -45],
      'clamp'
    );

    // Scale: center item is largest
    const distFromCenter = Math.abs(index - currentIndex.value);
    const scale = interpolate(
      distFromCenter,
      [0, 1, 2],
      [1, 0.82, 0.68],
      'clamp'
    );

    // Alpha: center item is fully opaque
    const alpha = interpolate(
      distFromCenter,
      [0, 1, 2],
      [1, 0.65, 0.35],
      'clamp'
    );

    // Z-index simulation via translateZ
    const zIndex = interpolate(
      distFromCenter,
      [0, 1, 2],
      [10, 5, 1],
      'clamp'
    );

    return {
      transform: [
        { translateX: relativeOffset },
        { perspective: 900 },
        { rotateY: `${rotationY}deg` },
        { scale },
      ],
      opacity: alpha,
      zIndex: Math.round(zIndex),
    };
  });

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT + 20,
    overflow: 'visible',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  item: {
    position: 'absolute',
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    top: 10,
  },
});

export { ITEM_WIDTH, ITEM_HEIGHT };
