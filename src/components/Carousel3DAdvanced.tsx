import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = 300;

interface Carousel3DAdvancedProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  onIndexChange?: (index: number) => void;
}

export function Carousel3DAdvanced({
  data,
  renderItem,
  onIndexChange,
}: Carousel3DAdvancedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        scrollX.setValue(-gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = CARD_WIDTH * 0.2;
        const newIndex = gestureState.dx > threshold
          ? Math.max(0, currentIndex - 1)
          : gestureState.dx < -threshold
          ? Math.min(data.length - 1, currentIndex + 1)
          : currentIndex;

        setCurrentIndex(newIndex);
        onIndexChange?.(newIndex);

        Animated.spring(scrollX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.carouselContainer}>
        {data.map((item, index) => {
          const inputRange = [
            (index - 1) * CARD_WIDTH,
            index * CARD_WIDTH,
            (index + 1) * CARD_WIDTH,
          ];

          // Z-Index: Merkezdeki kart en üstte
          const zIndex = scrollX.interpolate({
            inputRange,
            outputRange: [0, 10, 0],
            extrapolate: 'clamp',
          });

          // Scale: Merkezdeki kart tam boyut, kenarlar küçük
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
          });

          // Opacity: Merkezdeki kart tam opak, kenarlar soluk
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
          });

          // Rotation: 3D dönüş efekti
          const rotateY = scrollX.interpolate({
            inputRange,
            outputRange: [45, 0, -45],
            extrapolate: 'clamp',
          });

          // Perspective transform
          const perspective = scrollX.interpolate({
            inputRange,
            outputRange: [1000, 800, 1000],
            extrapolate: 'clamp',
          });

          const translateX = scrollX.interpolate({
            inputRange: [0, CARD_WIDTH],
            outputRange: [0, -CARD_WIDTH],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.cardWrapper,
                {
                  zIndex,
                  transform: [
                    { translateX: Animated.add(translateX, scrollX) },
                    { scale },
                    {
                      perspective: perspective,
                    },
                    {
                      rotateY: rotateY.interpolate({
                        inputRange: [-45, 0, 45],
                        outputRange: ['-45deg', '0deg', '45deg'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                  opacity,
                },
              ]}
            >
              <View style={styles.card}>
                {renderItem(item, index)}
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Indicator Dots */}
      <View style={styles.indicatorContainer}>
        {data.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: scrollX.interpolate({
                  inputRange: [
                    (index - 1) * CARD_WIDTH,
                    index * CARD_WIDTH,
                    (index + 1) * CARD_WIDTH,
                  ],
                  outputRange: [0.5, 1, 0.5],
                  extrapolate: 'clamp',
                }),
                width: scrollX.interpolate({
                  inputRange: [
                    (index - 1) * CARD_WIDTH,
                    index * CARD_WIDTH,
                    (index + 1) * CARD_WIDTH,
                  ],
                  outputRange: [8, 24, 8],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT + 60,
    justifyContent: 'center',
  },
  carouselContainer: {
    height: CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
});
