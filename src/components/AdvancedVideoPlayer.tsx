import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  Animated,
} from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AdvancedVideoPlayerProps {
  uri: string;
  title?: string;
  onClose?: () => void;
}

export function AdvancedVideoPlayer({ uri, title, onClose }: AdvancedVideoPlayerProps) {
  const theme = useTheme();
  const c = theme.colors;
  
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const brightnessAnim = useRef(new Animated.Value(1)).current;
  const volumeAnim = useRef(new Animated.Value(1)).current;

  // Pan Responder for brightness and volume control
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const { dy, dx } = gestureState;
        
        // Sağ taraf: ses kontrolü (yukarı-aşağı)
        if (evt.nativeEvent.locationX > SCREEN_WIDTH / 2) {
          const newVolume = Math.max(0, Math.min(1, volume - dy * 0.005));
          setVolume(newVolume);
          volumeAnim.setValue(newVolume);
        } 
        // Sol taraf: parlaklık kontrolü (yukarı-aşağı)
        else {
          const newBrightness = Math.max(0, Math.min(1, brightness - dy * 0.005));
          setBrightness(newBrightness);
          brightnessAnim.setValue(newBrightness);
        }
      },
    })
  ).current;

  // Kontrolleri gizle
  const hideControls = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  };

  // Kontrolleri göster
  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) hideControls();
  };

  // Çift dokunuş ile ileri/geri sarma
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = (direction: 'forward' | 'backward') => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (status && 'positionMillis' in status) {
        const newPosition = direction === 'forward'
          ? status.positionMillis + 10000
          : Math.max(0, status.positionMillis - 30000);
        
        videoRef.current?.setPositionAsync(newPosition);
      }
    }
    lastTapRef.current = now;
  };

  // Oynatma/Durdurma
  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  // Ses dışa aktarma (placeholder)
  const exportAudio = () => {
    // Gerçek uygulamada: FFmpeg veya benzeri araçla ses çıkartılacak
    console.log('Ses dışa aktarılıyor...');
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTime = status && 'positionMillis' in status ? status.positionMillis : 0;
  const duration = status && 'durationMillis' in status ? status.durationMillis : 0;
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View
        style={styles.videoContainer}
        {...panResponder.panHandlers}
        onTouchEnd={() => toggleControls()}
      >
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.video}
          useNativeControls={false}
          resizeMode="contain"
          isLooping={isLooping}
          onPlaybackStatusUpdate={setStatus}
          volume={volume}
        />

        {/* Brightness Overlay */}
        <Animated.View
          style={[
            styles.brightnessOverlay,
            { opacity: brightnessAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0],
            }) },
          ]}
        />

        {/* Controls HUD */}
        {showControls && (
          <BlurView intensity={40} tint="dark" style={styles.controlsContainer}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title} numberOfLines={1}>
                {title || 'Video'}
              </Text>
              <TouchableOpacity onPress={exportAudio} style={styles.closeBtn}>
                <Ionicons name="download-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => handleDoubleTap('backward')}
              >
                <Ionicons name="play-back" size={32} color="#fff" />
                <Text style={styles.controlLabel}>30s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playBtn}
                onPress={togglePlayPause}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={48}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => handleDoubleTap('forward')}
              >
                <Ionicons name="play-forward" size={32} color="#fff" />
                <Text style={styles.controlLabel}>10s</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>
                {formatTime(duration)}
              </Text>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.bottomControlBtn}
                onPress={() => setIsLooping(!isLooping)}
              >
                <Ionicons
                  name={isLooping ? 'repeat' : 'repeat-outline'}
                  size={20}
                  color={isLooping ? '#4ADE80' : '#fff'}
                />
              </TouchableOpacity>

              <View style={styles.volumeIndicator}>
                <Ionicons name="volume-high" size={16} color="#fff" />
                <Text style={styles.volumeText}>
                  {Math.round(volume * 100)}%
                </Text>
              </View>

              <View style={styles.brightnessIndicator}>
                <Ionicons name="sunny" size={16} color="#fff" />
                <Text style={styles.brightnessText}>
                  {Math.round(brightness * 100)}%
                </Text>
              </View>
            </View>
          </BlurView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  brightnessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: 12,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  bottomControlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  volumeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  brightnessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  brightnessText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
