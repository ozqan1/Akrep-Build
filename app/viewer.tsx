import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '@/components/PressableScale';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ViewerScreen() {
  const { uri, id } = useLocalSearchParams<{ uri: string; id?: string }>();
  const [showControls, setShowControls] = useState(true);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Zoom & pan state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const resetZoom = useCallback(() => {
    scale.value = withSpring(1, { damping: 20 });
    translateX.value = withSpring(0, { damping: 20 });
    translateY.value = withSpring(0, { damping: 20 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

  const handleShare = async () => {
    try {
      await Share.share({ url: uri });
    } catch {}
  };

  // Pinch to zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(savedScale.value * e.scale, 6));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1, { damping: 20 });
        translateX.value = withSpring(0, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1) {
        scale.value = withSpring(1, { damping: 20 });
        translateX.value = withSpring(0, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2.5, { damping: 20 });
        translateX.value = withSpring(
          (SCREEN_WIDTH / 2 - e.x) * 1.5,
          { damping: 20 }
        );
        translateY.value = withSpring(
          (SCREEN_HEIGHT / 2 - e.y) * 1.5,
          { damping: 20 }
        );
        savedScale.value = 2.5;
      }
    });

  // Single tap to toggle controls
  const singleTapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(toggleControls)();
    });

  const composed = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTapGesture, singleTapGesture),
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const controlsOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(showControls ? 1 : 0, { duration: 200 }),
  }));

  if (!uri) {
    return (
      <View style={styles.fill}>
        <Text style={styles.errorText}>Görsel bulunamadı.</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.fill}>
      <View style={styles.fill}>
        <StatusBar style="light" hidden={!showControls} />

        {/* Image viewer */}
        <GestureDetector gesture={composed}>
          <View style={styles.fill}>
            <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                transition={200}
                onLoad={(e) => {
                  setImageInfo({
                    width: e.source.width,
                    height: e.source.height,
                  });
                }}
              />
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Top controls */}
        <Animated.View style={[styles.topBar, controlsOpacity]} pointerEvents={showControls ? 'auto' : 'none'}>
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.topGradient}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.topRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                  <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
                <View style={styles.topActions}>
                  <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                    <Ionicons name="share-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="heart-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

        {/* Bottom controls */}
        <Animated.View style={[styles.bottomBar, controlsOpacity]} pointerEvents={showControls ? 'auto' : 'none'}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bottomGradient}
          >
            <SafeAreaView edges={['bottom']}>
              <View style={styles.bottomRow}>
                {imageInfo && (
                  <BlurView intensity={30} tint="dark" style={styles.infoBadge}>
                    <Text style={styles.infoText}>
                      {imageInfo.width} × {imageInfo.height}
                    </Text>
                  </BlurView>
                )}
                <View style={styles.bottomActions}>
                  <TouchableOpacity onPress={resetZoom} style={styles.iconBtn}>
                    <Ionicons name="scan-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      rotation.value = withTiming(rotation.value + 90);
                    }} 
                    style={styles.iconBtn}
                  >
                    <Ionicons name="refresh-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="crop-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topGradient: {
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  topActions: {
    flexDirection: 'row',
    gap: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    paddingTop: 30,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  infoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 100,
  },
});
