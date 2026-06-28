import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Dimensions,
  RefreshControl,
  ScrollView,
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
import { Carousel3D } from '@/components/Carousel3D';
import { useTheme } from '@/theme/useTheme';
import { useMediaStore, MediaAsset, MediaAlbum } from '@/store/useMediaStore';
import { useSettings } from '@/store/useSettings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RECENT_ITEM_SIZE = (SCREEN_WIDTH - 48 - 8 * 2) / 3;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GalleryHomeScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const appearance = useSettings((s) => s.appearance);
  const { photos, videos, audio, albums, loading, permissionGranted, loadAll, error } = useMediaStore();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    loadAll();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll(true);
    setRefreshing(false);
  }, [loadAll]);

  const recentAssets = [...photos, ...videos]
    .sort((a, b) => b.creationTime - a.creationTime)
    .slice(0, 12);

  const carouselAlbums = albums.slice(0, 8);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const openMedia = (asset: MediaAsset) => {
    if (asset.mediaType === 'video') {
      router.push({
        pathname: '/player',
        params: { uri: asset.uri, title: asset.filename },
      });
    } else {
      router.push({
        pathname: '/viewer',
        params: { uri: asset.uri, id: asset.id },
      });
    }
  };

  const openAlbum = (album: MediaAlbum) => {
    router.push({
      pathname: '/album',
      params: { albumId: album.id, title: album.title },
    });
  };

  if (!permissionGranted && !loading) {
    return (
      <ThemedBackground>
        <SafeAreaView style={styles.fill}>
          <View style={styles.permissionContainer}>
            <View style={[styles.permissionIcon, { backgroundColor: c.surfaceAlt }]}>
              <Ionicons name="images-outline" size={48} color={c.accent} />
            </View>
            <Text style={[styles.permissionTitle, { color: c.text }]}>
              Galeri İzni Gerekli
            </Text>
            <Text style={[styles.permissionDesc, { color: c.textDim }]}>
              {error || 'Akrep Galeri, fotoğraf ve videolarınızı görüntülemek için galeri erişimine ihtiyaç duyar.'}
            </Text>
            <PressableScale
              onPress={() => loadAll()}
              style={[styles.permissionBtn, { backgroundColor: c.accent }]}
            >
              <Ionicons name="lock-open-outline" size={18} color={c.onAccent} />
              <Text style={[styles.permissionBtnText, { color: c.onAccent }]}>
                İzin Ver
              </Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
      {/* Sticky blurred header on scroll */}
      <RNAnimated.View
        style={[styles.stickyHeader, { opacity: headerOpacity }]}
        pointerEvents="none"
      >
        <BlurView
          intensity={appearance === 'amoled' ? 50 : 40}
          tint={appearance === 'amoled' ? 'dark' : 'light'}
          style={[styles.stickyHeaderBlur, { borderBottomColor: c.border }]}
        >
          <Text style={[styles.stickyTitle, { color: c.text }]}>Akrep Galeri 🦂</Text>
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
          {/* Brand header */}
          <View style={styles.brandRow}>
            <View>
              <Text style={[styles.brandTitle, { color: c.text }]}>
                Akrep Galeri 🦂
              </Text>
              <Text style={[styles.brandSub, { color: c.textDim }]}>
                {photos.length + videos.length} medya · {albums.length} albüm
              </Text>
            </View>
            <View style={styles.headerActions}>
              <PressableScale
                onPress={() => router.push('/vault')}
                style={[styles.actionBtn, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={c.accent} />
              </PressableScale>
              <PressableScale
                onPress={() => router.push('/recycle')}
                style={[styles.actionBtn, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <Ionicons name="trash-outline" size={18} color={c.textDim} />
              </PressableScale>
              <PressableScale
                onPress={() => router.push('/photos')}
                style={[styles.actionBtn, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <Ionicons name="search" size={18} color={c.textDim} />
              </PressableScale>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatCard
              icon="image-outline"
              label="Fotoğraf"
              value={photos.length}
              color={c}
              accent={c.accent}
            />
            <StatCard
              icon="videocam-outline"
              label="Video"
              value={videos.length}
              color={c}
              accent={c.accent2}
            />
            <StatCard
              icon="albums-outline"
              label="Albüm"
              value={albums.length}
              color={c}
              accent={c.accent}
            />
          </View>

          {/* 3D Album Carousel */}
          {carouselAlbums.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Albümler</Text>
                <PressableScale onPress={() => router.push('/albums')}>
                  <Text style={[styles.seeAll, { color: c.accent }]}>Tümü</Text>
                </PressableScale>
              </View>

              <Carousel3D
                data={carouselAlbums}
                renderItem={(album) => (
                  <AlbumCard album={album as MediaAlbum} onPress={() => openAlbum(album as MediaAlbum)} colors={c} />
                )}
              />
            </View>
          )}

          {/* Photos Grid Section */}
          {photos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Fotoğraflar</Text>
                <PressableScale onPress={() => router.push('/photos')}>
                  <Text style={[styles.seeAll, { color: c.accent }]}>Tümü</Text>
                </PressableScale>
              </View>

              <View style={styles.recentGrid}>
                {photos.slice(0, 12).map((asset) => (
                  <PressableScale
                    key={asset.id}
                    onPress={() => openMedia(asset)}
                    scaleTo={0.95}
                    style={[
                      styles.recentItem,
                      { width: RECENT_ITEM_SIZE, height: RECENT_ITEM_SIZE, backgroundColor: c.surfaceAlt },
                    ]}
                  >
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.recentImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  </PressableScale>
                ))}
              </View>
            </View>
          )}

          {/* Recent Videos Section */}
          {videos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Son Videolar</Text>
                <PressableScale onPress={() => router.push('/(tabs)/videos')}>
                  <Text style={[styles.seeAll, { color: c.accent }]}>Tümü</Text>
                </PressableScale>
              </View>

              <View style={styles.recentGrid}>
                {videos.slice(0, 6).map((asset) => (
                  <PressableScale
                    key={asset.id}
                    onPress={() => openMedia(asset)}
                    scaleTo={0.95}
                    style={[
                      styles.recentItem,
                      { width: RECENT_ITEM_SIZE, height: RECENT_ITEM_SIZE, backgroundColor: c.surfaceAlt },
                    ]}
                  >
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.recentImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.videoBadge}>
                      <Ionicons name="play" size={10} color="#fff" />
                      <Text style={styles.videoDuration}>
                        {formatDuration(asset.duration)}
                      </Text>
                    </View>
                  </PressableScale>
                ))}
              </View>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={c.accent} size="large" />
              <Text style={[styles.loadingText, { color: c.textDim }]}>
                Medya yükleniyor...
              </Text>
            </View>
          )}

          <View style={styles.bottomPad} />
        </RNAnimated.ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: any;
  accent: string;
}

function StatCard({ icon, label, value, color, accent }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: color.surface, borderColor: color.border }]}>
      <Ionicons name={icon as any} size={20} color={accent} />
      <Text style={[styles.statValue, { color: color.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: color.textDim }]}>{label}</Text>
    </View>
  );
}

interface AlbumCardProps {
  album: MediaAlbum;
  onPress: () => void;
  colors: any;
}

function AlbumCard({ album, onPress, colors }: AlbumCardProps) {
  return (
    <PressableScale onPress={onPress} style={styles.albumCard}>
      {album.coverUri ? (
        <Image
          source={{ uri: album.coverUri }}
          style={styles.albumCover}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.albumCover, styles.albumCoverFallback, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="albums-outline" size={40} color={colors.textDim} />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.albumGradient}
      >
        <Text style={styles.albumTitle} numberOfLines={2}>
          {album.title}
        </Text>
        <Text style={styles.albumCount}>
          {album.assetCount} öğe
        </Text>
      </LinearGradient>
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
  stickyHeaderBlur: {
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
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
  },
  recentItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDuration: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  albumCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  albumCover: {
    width: '100%',
    height: '100%',
  },
  albumCoverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
  },
  albumTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  albumCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 8,
  },
  permissionBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPad: {
    height: 20,
  },
});
