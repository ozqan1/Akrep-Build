import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface DynamicHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: Animated.Value;
  minHeight?: number;
  maxHeight?: number;
  backgroundColor: string;
  textColor: string;
  blurIntensity?: number;
  children?: React.ReactNode;
}

export function DynamicHeader({
  title,
  subtitle,
  scrollY,
  minHeight = 60,
  maxHeight = 200,
  backgroundColor,
  textColor,
  blurIntensity = 40,
  children,
}: DynamicHeaderProps) {
  const headerHeight = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [maxHeight, minHeight],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, (maxHeight - minHeight) * 0.5],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, (maxHeight - minHeight) * 0.3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleFontSize = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [32, 18],
    extrapolate: 'clamp',
  });

  const blurOpacity = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const paddingTop = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [24, 8],
    extrapolate: 'clamp',
  });

  const paddingBottom = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [24, 8],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          height: headerHeight,
          backgroundColor,
        },
      ]}
    >
      {/* Blur Background */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: blurOpacity,
          },
        ]}
      >
        <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop,
            paddingBottom,
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.title,
            {
              color: textColor,
              fontSize: titleFontSize,
              opacity: titleOpacity,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.subtitle,
            {
              color: textColor,
              opacity: subtitleOpacity,
            },
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Animated.Text>

        {children && (
          <View style={styles.childrenContainer}>
            {children}
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  childrenContainer: {
    marginTop: 12,
  },
});
