import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface AkrepVideoPlayerProps {
  uri: string;
  onClose?: () => void;
}

/**
 * Akrep Medya İşlemcisi - Gelişmiş Video Oynatıcı
 * Media3 tabanlı özelleştirilmiş video arayüzü (HUD)
 */
export function AkrepVideoPlayer({ uri, onClose }: AkrepVideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isLooping, setIsLooping] = useState(false);

  const isPlaying = (status && 'isPlaying' in status && status.isPlaying) ?? false;
  const duration = (status && 'durationMillis' in status && typeof status.durationMillis === 'number' ? status.durationMillis : 0);
  const position = (status && 'positionMillis' in status && typeof status.positionMillis === 'number' ? status.positionMillis : 0);
  const progress = (typeof duration === 'number' && typeof position === 'number' && duration > 0) ? position / duration : 0;

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const handleSeek = async (offset: number) => {
    if (videoRef.current && typeof position === 'number' && typeof duration === 'number') {
      const newPosition = Math.max(0, Math.min(duration, position + offset));
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  const handleLoop = async () => {
    if (videoRef.current) {
      const newLoopState = !isLooping;
      setIsLooping(newLoopState);
      await videoRef.current.setIsLoopingAsync(newLoopState);
    }
  };

  const formatTime = (ms: number | false) => {
    if (typeof ms !== 'number') return '0:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={[
          styles.video,
          { opacity: brightness },
        ]}
        rate={1.0}
        volume={volume}
        isMuted={false}
        // resizeMode handled by Video component
        shouldPlay={false}
        onPlaybackStatusUpdate={setStatus}
      />

      {/* Kontrol Paneli */}
      {showControls && (
        <View style={styles.controlsOverlay}>
          {/* İleri/Geri Sarma Göstergeleri */}
          <View style={styles.seekIndicators}>
            <Pressable
              onPress={() => handleSeek(-30000)}
              style={styles.seekButton}
            >
              <Ionicons name="play-back" size={32} color="white" />
              <Text style={styles.seekText}>30s</Text>
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
              style={styles.centerButton}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color="white"
              />
            </Pressable>

            <Pressable
              onPress={() => handleSeek(10000)}
              style={styles.seekButton}
            >
              <Ionicons name="play-forward" size={32} color="white" />
              <Text style={styles.seekText}>10s</Text>
            </Pressable>
          </View>

          {/* Alt Kontrol Çubuğu */}
          <View style={styles.bottomBar}>
            {/* İlerleme Çubuğu */}
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>

            {/* Zaman Göstergesi */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {formatTime(position)} / {formatTime(duration)}
              </Text>
            </View>

            {/* Kontrol Butonları */}
            <View style={styles.buttonGroup}>
              <Pressable
                onPress={handleLoop}
                style={[
                  styles.controlButton,
                  isLooping && styles.controlButtonActive,
                ]}
              >
                <Ionicons
                  name="repeat"
                  size={20}
                  color={isLooping ? '#0a7ea4' : 'white'}
                />
              </Pressable>

              <Pressable
                onPress={() => setVolume(volume === 0 ? 1 : 0)}
                style={styles.controlButton}
              >
                <Ionicons
                  name={volume === 0 ? 'volume-mute' : 'volume-high'}
                  size={20}
                  color="white"
                />
              </Pressable>

              {onClose && (
                <Pressable
                  onPress={onClose}
                  style={styles.controlButton}
                >
                  <Ionicons name="close" size={20} color="white" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Kontrolleri Göster/Gizle */}
      <Pressable
        style={styles.tapArea}
        onPress={() => setShowControls(!showControls)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  tapArea: {
    ...StyleSheet.absoluteFillObject,
  },
  seekIndicators: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  seekButton: {
    alignItems: 'center',
    padding: 16,
  },
  seekText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  centerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0a7ea4',
  },
  timeContainer: {
    marginBottom: 8,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  controlButton: {
    padding: 8,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(10, 126, 164, 0.3)',
    borderRadius: 4,
  },
});
