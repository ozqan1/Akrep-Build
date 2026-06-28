import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Dimensions,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ThemedBackground } from '@/components/ThemedBackground';
import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/theme/useTheme';
import { useMediaStore, MediaAlbum } from '@/store/useMediaStore';
import { useSettings } from '@/store/useSettings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = 2;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - GAP) / COLS;
const CARD_HEIGHT = CARD_WIDTH * 1.1;

export default function AlbumsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const appearance = useSettings((s) => s.appearance);
  const { albums, albumsLoading, permissionGranted, loadAlbums, loadAll } = useMediaStore();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!permissionGranted) {
      loadAll();
    } else {
      loadAlbums();
    }
  }, [permissionGranted]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlbums();
    setRefreshing(false);
  }, [loadAlbums]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const openAlbum = (album: MediaAlbum) => {
    router.push({
      pathname: '/album',
      params: { albumId: album.id, title: album.title },
    });
  };

  return (
    <ThemedBackground>
      {/* Sticky header */}
      <RNAnimated.View style={[styles.stickyHeader, { opacity: headerOpacity }]} pointerEvents="none">
        <BlurView
          intensity={appearance === 'amoled' ? 50 : 40}
          tint={appearance === 'amoled' ? 'dark' : 'light'}
          style={[styles.stickyBlur, { borderBottomColor: c.border }]}
        >
          <Text style={[styles.stickyTitle, { color: c.text }]}>Albümler</Text>
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
            <Text style={[styles.title, { color: c.text }]}>Albümler</Text>
            <Text style={[styles.subtitle, { color: c.textDim }]}>
              {albums.length} albüm
            </Text>
          </View>

          {/* Albums grid */}
          {albumsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={c.accent} size="large" />
              <Text style={[styles.loadingText, { color: c.textDim }]}>Albümler yükleniyor...</Text>
            </View>
          ) : albums.length === 0 ? (
            <View style={[styles.empty, { borderColor: c.border }]}>
              <Ionicons name="albums-outline" size={44} color={c.textDim} />
              <Text style={[styles.emptyText, { color: c.textDim }]}>Albüm bulunamadı</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  colors={c}
                  onPress={() => openAlbum(album)}
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

interface AlbumCardProps {
  album: MediaAlbum;
  colors: any;
  onPress: () => void;
}

function AlbumCard({ album, colors, onPress }: AlbumCardProps) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.96} style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.coverWrap}>
        {album.coverUri ? (
          <Image
            source={{ uri: album.coverUri }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.cover, styles.coverFallback, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="albums-outline" size={32} color={colors.textDim} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.coverGradient}
        />
        <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.countText, { color: colors.onAccent }]}>
            {album.assetCount}
          </Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.albumName, { color: colors.text }]} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={[styles.albumCount, { color: colors.textDim }]}>
          {album.assetCount} öğe
        </Text>
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
    paddingBottom: 16,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: 20,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
  },
  coverWrap: {
    width: '100%',
    height: CARD_HEIGHT,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardInfo: {
    padding: 10,
    gap: 2,
  },
  albumName: {
    fontSize: 14,
    fontWeight: '700',
  },
  albumCount: {
    fontSize: 12,
    fontWeight: '500',
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
