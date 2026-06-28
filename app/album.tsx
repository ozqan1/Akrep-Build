import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { ThemedBackground } from '@/components/ThemedBackground';
import { MediaGrid } from '@/components/MediaGrid';
import { useTheme } from '@/theme/useTheme';
import { MediaAsset } from '@/store/useMediaStore';

export default function AlbumScreen() {
  const { albumId, title } = useLocalSearchParams<{ albumId: string; title: string }>();
  const theme = useTheme();
  const c = theme.colors;
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssets = useCallback(async () => {
    if (!albumId) return;
    try {
      const results = await MediaLibrary.getAssetsAsync({
        album: albumId,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      setAssets(results.assets.map(a => ({
        id: a.id,
        uri: a.uri,
        filename: a.filename,
        mediaType: a.mediaType === 'video' ? 'video' as const : 'photo' as const,
        width: a.width ?? 0,
        height: a.height ?? 0,
        duration: a.duration != null ? a.duration : 0,
        creationTime: a.creationTime ?? 0,
        modificationTime: a.modificationTime ?? 0,
        albumId,
      })));
    } catch (e) {
      console.error('Album load error:', e);
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  }, [loadAssets]);

  const handlePress = (asset: MediaAsset, _index: number) => {
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

  return (
    <ThemedBackground>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.fill} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={c.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
              {title ?? 'Album'}
            </Text>
            <Text style={[styles.headerSub, { color: c.textDim }]}>
              {assets.length} oge
            </Text>
          </View>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={c.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.accent}
              colors={[c.accent]}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={c.accent} size="large" />
              <Text style={[styles.loadingText, { color: c.textDim }]}>Yukleniyor...</Text>
            </View>
          ) : (
            <MediaGrid
              assets={assets}
              onPress={handlePress}
            />
          )}
          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  content: { paddingBottom: 40 },
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
