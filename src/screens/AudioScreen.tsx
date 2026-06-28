import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedBackground } from '@/components/ThemedBackground';
import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/theme/useTheme';
import { useMediaStore, MediaAsset } from '@/store/useMediaStore';
import { useSettings } from '@/store/useSettings';
import { BlurView } from 'expo-blur';
import { TextInput, TouchableOpacity } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function AudioScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const appearance = useSettings((s) => s.appearance);
  const { audio, audioLoading, permissionGranted, loadAudio, error, searchQuery, setSearchQuery } = useMediaStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (permissionGranted && audio.length === 0) {
      loadAudio();
    }
  }, [permissionGranted]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAudio(true);
    setRefreshing(false);
  }, [loadAudio]);

  const filteredAudio = useCallback(() => {
    if (!searchQuery) return audio;
    return audio.filter(a => a.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [audio, searchQuery]);

  const openAudio = (asset: MediaAsset) => {
    router.push({
      pathname: '/player',
      params: { uri: asset.uri, title: asset.filename, isAudio: 'true' },
    });
  };

  if (!permissionGranted) {
    return (
      <ThemedBackground>
        <SafeAreaView style={styles.fill}>
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: c.surfaceAlt }]}>
              <Ionicons name="lock-outline" size={48} color={c.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              İzin Gerekli
            </Text>
            <Text style={[styles.emptyDesc, { color: c.textDim }]}>
              {error || 'Ses dosyalarını görmek için galeri izni gereklidir.'}
            </Text>
          </View>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  if (audioLoading) {
    return (
      <ThemedBackground>
        <SafeAreaView style={styles.fill}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  if (audio.length === 0) {
    return (
      <ThemedBackground>
        <SafeAreaView style={styles.fill}>
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: c.surfaceAlt }]}>
              <Ionicons name="musical-notes-outline" size={48} color={c.textDim} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              Ses Dosyası Yok
            </Text>
            <Text style={[styles.emptyDesc, { color: c.textDim }]}>
              Telefonunuzda herhangi bir ses dosyası bulunamadı.
            </Text>
          </View>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  const renderAudioItem = ({ item }: { item: MediaAsset }) => (
    <PressableScale
      onPress={() => openAudio(item)}
      style={[styles.audioItem, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      <View style={[styles.audioIcon, { backgroundColor: c.surfaceAlt }]}>
        <Ionicons name="musical-note" size={24} color={c.accent} />
      </View>
      <View style={styles.audioInfo}>
        <Text style={[styles.audioTitle, { color: c.text }]} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={[styles.audioMeta, { color: c.textDim }]}>
          {formatDuration(item.duration)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textDim} />
    </PressableScale>
  );

  const displayedAudio = filteredAudio();

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <FlatList
          data={displayedAudio}
          renderItem={renderAudioItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.accent}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: c.text }]}>
                Ses Dosyaları
              </Text>
              <Text style={[styles.headerCount, { color: c.textDim }]}>
                {displayedAudio.length} dosya
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
                  placeholder="Müzik ara..."
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
          }
        />
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerCount: {
    fontSize: 13,
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
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  audioIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  audioMeta: {
    fontSize: 12,
  },
});
