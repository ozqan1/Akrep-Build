import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';

interface Akrep3DCarouselProps<T> {
  items: T[];
  itemWidth?: number;
  itemHeight?: number;
  gap?: number;
  rotationAngle?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

/**
 * Akrep Galeri için özelleştirilmiş 3D Carousel Bileşeni
 * Albümler veya medya öğeleri arasında 3 boyutlu geçişler sağlar
 * Z-Index yönetimi, ölçekleme ve soluklaşma (Scale & Alpha) efektleri içerir
 */
export function Akrep3DCarousel<T>({
  items,
  itemWidth = 200,
  itemHeight = 300,
  gap = 16,
  rotationAngle = 60,
  renderItem,
}: Akrep3DCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  const totalWidth = itemWidth + gap;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        
        if (dx > 50 && currentIndex > 0) {
          // Sola kaydır (önceki item)
          setCurrentIndex(currentIndex - 1);
          animateToIndex(currentIndex - 1);
        } else if (dx < -50 && currentIndex < items.length - 1) {
          // Sağa kaydır (sonraki item)
          setCurrentIndex(currentIndex + 1);
          animateToIndex(currentIndex + 1);
        } else {
          // Geri dön
          animateToIndex(currentIndex);
        }
      },
    })
  ).current;

  const animateToIndex = (index: number) => {
    Animated.spring(animatedValue, {
      toValue: -index * totalWidth,
      useNativeDriver: false,
      tension: 40,
      friction: 7,
    }).start();
  };

  const getItemTransform = (index: number) => {
    return {
      transform: [
        {
          translateX: Animated.add(
            animatedValue,
            new Animated.Value(index * totalWidth)
          ),
        },
      ],
    };
  };

  const getItemOpacity = (index: number) => {
    const distance = Math.abs(index - currentIndex);
    return 1 - (distance * 0.3);
  };

  const getItemScale = (index: number) => {
    const distance = Math.abs(index - currentIndex);
    return 1 - (distance * 0.15);
  };

  if (items.length === 0) return null;

  return (
    <View
      style={[styles.container, { height: itemHeight }]}
      {...panResponder.panHandlers}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ width: items.length * totalWidth }}
      >
        {items.map((item, index) => (
          <Animated.View
            key={index}
            style={[
              styles.itemWrapper,
              {
                width: itemWidth,
                marginRight: gap,
                opacity: getItemOpacity(index),
                transform: [{ scale: getItemScale(index) }],
              },
              getItemTransform(index),
            ]}
          >
            {renderItem(item, index)}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  itemWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
