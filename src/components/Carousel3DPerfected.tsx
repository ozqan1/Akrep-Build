import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  ViewStyle,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = 300;
const PERSPECTIVE = 1200;

interface Carousel3DPerfectedProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  onIndexChange?: (index: number) => void;
  autoScroll?: boolean;
  autoScrollInterval?: number;
}

interface CardTransformConfig {
  scale: Animated.AnimatedInterpolation<number>;
  opacity: Animated.AnimatedInterpolation<number>;
  zIndex: Animated.AnimatedInterpolation<number>;
  rotateY: Animated.AnimatedInterpolation<string>;
  translateX: Animated.AnimatedInterpolation<number>;
  translateZ: Animated.AnimatedInterpolation<number>;
  perspective: Animated.AnimatedInterpolation<number>;
}

export function Carousel3DPerfected({
  data,
  renderItem,
  onIndexChange,
  autoScroll = false,
  autoScrollInterval = 5000,
}: Carousel3DPerfectedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        scrollX.setValue(-gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = CARD_WIDTH * 0.15;
        let newIndex = currentIndex;

        if (gestureState.dx > threshold) {
          newIndex = Math.max(0, currentIndex - 1);
        } else if (gestureState.dx < -threshold) {
          newIndex = Math.min(data.length - 1, currentIndex + 1);
        }

        setCurrentIndex(newIndex);
        onIndexChange?.(newIndex);

        Animated.spring(scrollX, {
          toValue: 0,
          useNativeDriver: false,
          speed: 10,
          bounciness: 8,
        }).start();
      },
    })
  ).current;

  // Auto-scroll efekti
  useEffect(() => {
    if (!autoScroll) return;

    const startAutoScroll = () => {
      autoScrollTimer.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = (prev + 1) % data.length;
          onIndexChange?.(next);
          return next;
        });
      }, autoScrollInterval);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [autoScroll, autoScrollInterval, data.length]);

  const getCardTransforms = (index: number): CardTransformConfig => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    // Z-Index: Merkezdeki kart en üstte (10), kenarlar aşağıda (0)
    const zIndex = scrollX.interpolate({
      inputRange,
      outputRange: [0, 10, 0],
      extrapolate: 'clamp',
    });

    // Scale: Merkezdeki kart 1.0, kenarlar 0.75
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.75, 1, 0.75],
      extrapolate: 'clamp',
    });

    // Opacity: Merkezdeki kart 1.0, kenarlar 0.5
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    // RotateY: 3D dönüş (45° → 0° → -45°)
    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: [45, 0, -45],
      extrapolate: 'clamp',
    });

    // TranslateX: Yatay hareket
    const translateX = scrollX.interpolate({
      inputRange: [0, CARD_WIDTH],
      outputRange: [0, -CARD_WIDTH],
      extrapolate: 'clamp',
    });

    // TranslateZ: Derinlik hareketi (kenarlar geri, merkez ileri)
    const translateZ = scrollX.interpolate({
      inputRange,
      outputRange: [-200, 0, -200],
      extrapolate: 'clamp',
    });

    // Perspective: Kenarlar daha yüksek perspektif (daha uzak görünüm)
    const perspective = scrollX.interpolate({
      inputRange,
      outputRange: [1500, 1000, 1500],
      extrapolate: 'clamp',
    });

    return {
      scale,
      opacity,
      zIndex,
      rotateY,
      translateX,
      translateZ,
      perspective,
    };
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.carouselContainer}>
        {data.map((item, index) => {
          const transforms = getCardTransforms(index);

          return (
            <Animated.View
              key={index}
              style={[
                styles.cardWrapper,
                {
                  zIndex: transforms.zIndex,
                  transform: [
                    { translateX: Animated.add(transforms.translateX, scrollX) },
                    { scale: transforms.scale },
                    {
                      perspective: transforms.perspective,
                    },
                    {
                      rotateY: transforms.rotateY.interpolate({
                        inputRange: [-45, 0, 45],
                        outputRange: ['-45deg', '0deg', '45deg'],
                        extrapolate: 'clamp',
                      }),
                    },
                    {
                      translateZ: transforms.translateZ,
                    },
                  ],
                  opacity: transforms.opacity,
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

      {/* Gelişmiş Indicator Dots */}
      <View style={styles.indicatorContainer}>
        {data.map((_, index) => {
          const transforms = getCardTransforms(index);

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: transforms.opacity,
                  width: transforms.scale.interpolate({
                    inputRange: [0.75, 1],
                    outputRange: [8, 24],
                    extrapolate: 'clamp',
                  }),
                  backgroundColor: transforms.scale.interpolate({
                    inputRange: [0.75, 1],
                    outputRange: ['rgba(74, 222, 128, 0.5)', '#4ADE80'],
                    extrapolate: 'clamp',
                  }) as any,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Sayfa Göstergesi */}
      <View style={styles.pageIndicator}>
        <Animated.Text style={styles.pageText}>
          {currentIndex + 1} / {data.length}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT + 80,
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
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  pageIndicator: {
    alignItems: 'center',
    marginTop: 12,
  },
  pageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
});
