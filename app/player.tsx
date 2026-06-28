import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
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
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Slider } from '@miblanchard/react-native-slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const { uri, title, isAudio } = useLocalSearchParams<{ uri: string; title?: string; isAudio?: string }>();
  const [showControls, setShowControls] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [rotation, setRotation] = useState(0);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();

  // Video player hook with error handling
  const player = useVideoPlayer(uri ?? '', (p) => {
    p.loop = true;
    // Auto-play might cause black screen if called too early on some devices
    // We will use a small timeout or status check
  });

  useEffect(() => {
    if (player && status === 'readyToPlay') {
      player.play();
    }
  }, [player, status]);

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const currentTime = player.currentTime ?? 0;
  const duration = player.duration ?? 0;
  const isLoading = status === 'loading';
  const isError = status === 'error';

  const controlsOpacity = useSharedValue(1);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    clearTimeout(controlsTimer.current);
    if (isPlaying) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
        controlsOpacity.value = withTiming(0, { duration: 300 });
      }, 4000);
    }
  }, [isPlaying, controlsOpacity]);

  useEffect(() => {
    showControlsTemporarily();
    return () => clearTimeout(controlsTimer.current);
  }, [showControlsTemporarily]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    showControlsTemporarily();
  }, [isPlaying, player, showControlsTemporarily]);

  const handleShare = async () => {
    try {
      await Share.share({ url: uri ?? '' });
    } catch {}
  };

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  if (!uri) {
    return (
      <View style={styles.fill}>
        <SafeAreaView style={styles.center}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Dosya yolu bulunamadı.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Geri Dön</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <StatusBar style="light" hidden={!showControls} />

      <TouchableOpacity
        activeOpacity={1}
        style={styles.fill}
        onPress={showControlsTemporarily}
      >
        {isAudio === 'true' ? (
          <View style={styles.audioContainer}>
            <LinearGradient
              colors={['#1a1a1a', '#000']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.audioArt}>
              <Ionicons name="musical-notes" size={120} color="#F97316" />
            </View>
          </View>
        ) : (
          <VideoView
            player={player}
            style={[styles.video, { transform: [{ rotate: `${rotation}deg` }] }]}
            contentFit="contain"
            nativeControls={false}
          />
        )}
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color="#F97316" size="large" />
        </View>
      )}

      {isError && (
        <View style={styles.loadingOverlay}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Medya oynatılamıyor.</Text>
        </View>
      )}

      <Animated.View style={[StyleSheet.absoluteFill, controlsStyle]} pointerEvents={showControls ? 'auto' : 'none'}>
        <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.topGradient}>
          <SafeAreaView edges={['top']}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                <Ionicons name="chevron-down" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.titleText} numberOfLines={1}>
                {title ?? (isAudio === 'true' ? 'Müzik' : 'Video')}
              </Text>
              <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.centerControls} pointerEvents="box-none">
          <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseBtn}>
            <BlurView intensity={40} tint="dark" style={styles.playPauseBlur}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={40}
                color="#fff"
                style={{ marginLeft: isPlaying ? 0 : 5 }}
              />
            </BlurView>
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.bottomGradient}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.bottomControls}>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
              <View style={styles.sliderWrap}>
                <Slider
                  value={duration > 0 ? currentTime / duration : 0}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor="#F97316"
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor="#F97316"
                  onSlidingStart={() => setSeeking(true)}
                  onSlidingComplete={(val) => {
                    const v = Array.isArray(val) ? val[0] : val;
                    player.currentTime = v * duration;
                    setSeeking(false);
                  }}
                  trackStyle={styles.track}
                  thumbStyle={styles.thumb}
                />
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => { player.currentTime = Math.max(0, currentTime - 10); }}
                  style={styles.iconBtn}
                >
                  <Ionicons name="play-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={togglePlayPause} style={styles.mainPlayBtn}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { player.currentTime = Math.min(duration, currentTime + 10); }}
                  style={styles.iconBtn}
                >
                  <Ionicons name="play-forward" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setRotation(r => (r + 90) % 360); }}
                  style={styles.iconBtn}
                >
                  <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { player.loop = !player.loop; }}
                  style={styles.iconBtn}
                >
                  <Ionicons name="repeat" size={22} color={player.loop ? '#F97316' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  video: { flex: 1 },
  audioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioArt: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topGradient: { paddingBottom: 60 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  titleText: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  centerControls: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: { borderRadius: 50, overflow: 'hidden' },
  playPauseBlur: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  sliderWrap: { marginHorizontal: -4, height: 40, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2 },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F97316',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 8,
  },
  iconBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  backBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F97316',
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
