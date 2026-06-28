import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ThemedBackground } from '@/components/ThemedBackground';
import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/theme/useTheme';
import { useMediaStore, MediaAsset } from '@/store/useMediaStore';
import { useSettings } from '@/store/useSettings';
import { TextInput } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = 2;
const GAP = 10;
const CELL_WIDTH = (SCREEN_WIDTH - 40 - GAP) / COLS;
const CELL_HEIGHT = CELL_WIDTH * 0.6;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type SortType = 'date' | 'duration' | 'name';

export default function VideosScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const appearance = useSettings((s) => s.appearance);
  const { videos, videosLoading, permissionGranted, loadVideos, loadAll, searchQuery, setSearchQuery } = useMediaStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('date');
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!permissionGranted) {
      loadAll();
    } else {
      loadVideos();
    }
  }, [permissionGranted]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVideos(true);
    setRefreshing(false);
  }, [loadVideos]);

  const sortedVideos = useCallback(() => {
    let sorted = [...videos];
    
    // Filter by search query
    if (searchQuery) {
      sorted = sorted.filter(v => v.filename.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    switch (sortBy) {
      case 'duration':
        return sorted.sort((a, b) => b.duration - a.duration);
      case 'name':
        return sorted.sort((a, b) => a.filename.localeCompare(b.filename));
      default:
        return sorted.sort((a, b) => b.creationTime - a.creationTime);
    }
  }, [videos, sortBy, searchQuery]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const displayedVideos = sortedVideos();
  const totalDuration = videos.reduce((acc, v) => acc + v.duration, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.floor((totalDuration % 3600) / 60);

  return (
    <ThemedBackground>
      {/* Sticky header */}
      <RNAnimated.View style={[styles.stickyHeader, { opacity: headerOpacity }]} pointerEvents="none">
        <BlurView
          intensity={appearance === 'amoled' ? 50 : 40}
          tint={appearance === 'amoled' ? 'dark' : 'light'}
          style={[styles.stickyBlur, { borderBottomColor: c.border }]}
        >
          <Text style={[styles.stickyTitle, { color: c.text }]}>Videolar</Text>
        </BlurView>
      </RNAnimated.View>

      <SafeAreaView style={styles.fill} edges={['top']}>
        <RNAnimated.ScrollView
          style={styles.fill}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={RNAnimated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.accent}
              colors={[c.accent]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>Videolar</Text>
            <Text style={[styles.subtitle, { color: c.textDim }]}>
              {displayedVideos.length} video · {totalHours > 0 ? `${totalHours}s ` : ''}{totalMins}dk
            </Text>
            {/* Search box */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <Ionicons name="search" size={18} color={c.textDim} />
              <TextInput
                style={[styles.searchInput, { color: c.text }]}
                placeholder="Video ara..."
                placeholderTextColor={c.textDim}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={c.textDim} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Sort row */}
          <View style={styles.sortRow}>
            <Text style={[styles.sortLabel, { color: c.textDim }]}>Sırala:</Text>
            {(['date', 'duration', 'name'] as SortType[]).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSortBy(s)}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: sortBy === s ? c.accent : c.surface,
                    borderColor: sortBy === s ? c.accent : c.border,
                  },
                ]}
              >
                <Text style={[styles.sortChipText, { color: sortBy === s ? c.onAccent : c.textDim }]}>
                  {s === 'date' ? 'Tarih' : s === 'duration' ? 'Süre' : 'İsim'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Video grid */}
          {videosLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={c.accent} size="large" />
              <Text style={[styles.loadingText, { color: c.textDim }]}>Yükleniyor...</Text>
            </View>
          ) : displayedVideos.length === 0 ? (
            <View style={[styles.empty, { borderColor: c.border }]}>
              <Ionicons name="videocam-outline" size={44} color={c.textDim} />
              <Text style={[styles.emptyText, { color: c.textDim }]}>Video bulunamadı</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {displayedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  colors={c}
                  onPress={() =>
                    router.push({
                      pathname: '/player',
                      params: { uri: video.uri, title: video.filename },
                    })
                  }
                />
              ))}
            </View>
          )}

          <View style={styles.bottomPad} />
        </RNAnimated.ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

interface VideoCardProps {
  video: MediaAsset;
  colors: any;
  onPress: () => void;
}

function VideoCard({ video, colors, onPress }: VideoCardProps) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.96} style={[styles.videoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.thumbnail, { backgroundColor: colors.surfaceAlt }]}>
        <Image
          source={{ uri: video.uri }}
          style={styles.thumbnailImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        {/* Play overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
        </View>
        {/* Duration badge */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={[styles.videoName, { color: colors.text }]} numberOfLines={2}>
          {video.filename}
        </Text>
        <View style={styles.videoMeta}>
          <Text style={[styles.videoMetaText, { color: colors.textDim }]}>
            {video.width}×{video.height}
          </Text>
          <View style={[styles.metaDot, { backgroundColor: colors.textDim }]} />
          <Text style={[styles.videoMetaText, { color: colors.textDim }]}>
            {new Date(video.creationTime).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingBottom: 120 },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  stickyBlur: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: 20,
  },
  videoCard: {
    width: CELL_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: '100%',
    height: CELL_HEIGHT,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  videoInfo: {
    padding: 10,
    gap: 4,
  },
  videoName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoMetaText: {
    fontSize: 11,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    borderStyle: 'dashed',
    gap: 12,
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPad: { height: 20 },
});
