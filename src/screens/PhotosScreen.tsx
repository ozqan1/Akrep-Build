import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ThemedBackground } from '@/components/ThemedBackground';
import { MediaGrid } from '@/components/MediaGrid';
import { useTheme } from '@/theme/useTheme';
import { useMediaStore, MediaAsset } from '@/store/useMediaStore';
import { useSettings } from '@/store/useSettings';


type FilterType = 'all' | 'favorites' | 'screenshots' | 'selfies';

const FILTERS: { id: FilterType; label: string; icon: string }[] = [
  { id: 'all', label: 'Tümü', icon: 'images-outline' },
  { id: 'favorites', label: 'Favoriler', icon: 'heart-outline' },
  { id: 'screenshots', label: 'Ekran Görüntüsü', icon: 'phone-portrait-outline' },
  { id: 'selfies', label: 'Selfie', icon: 'camera-reverse-outline' },
];

export default function PhotosScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const appearance = useSettings((s) => s.appearance);
  const { photos, photosLoading, permissionGranted, loadPhotos, loadAll, searchQuery, setSearchQuery, getFilteredPhotos } = useMediaStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!permissionGranted) {
      loadAll();
    } else {
      loadPhotos();
    }
  }, [permissionGranted]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotos(true);
    setRefreshing(false);
  }, [loadPhotos]);

  const filteredPhotos = useCallback(() => {
    let filtered = photos;
    
    // Filter by type
    switch (activeFilter) {
      case 'screenshots':
        filtered = photos.filter(
          (p) =>
            p.filename.toLowerCase().includes('screenshot') ||
            p.filename.toLowerCase().includes('screen_') ||
            p.filename.toLowerCase().includes('ekran')
        );
        break;
      case 'selfies':
        filtered = photos.filter(
          (p) =>
            p.filename.toLowerCase().includes('selfie') ||
            p.filename.toLowerCase().includes('front')
        );
        break;
      default:
        filtered = photos;
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => p.filename.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return filtered;
  }, [photos, activeFilter, searchQuery]);

  const handlePress = (asset: MediaAsset, index: number) => {
    if (selectionMode) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(asset.id)) {
        newSelected.delete(asset.id);
      } else {
        newSelected.add(asset.id);
      }
      setSelectedIds(newSelected);
      if (newSelected.size === 0) setSelectionMode(false);
    } else {
      router.push({
        pathname: '/viewer',
        params: { uri: asset.uri, id: asset.id, index: String(index) },
      });
    }
  };

  const handleLongPress = (asset: MediaAsset) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([asset.id]));
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const displayedPhotos = filteredPhotos();

  return (
    <ThemedBackground>
      {/* Sticky header */}
      <RNAnimated.View style={[styles.stickyHeader, { opacity: headerOpacity }]} pointerEvents="none">
        <BlurView
          intensity={appearance === 'amoled' ? 50 : 40}
          tint={appearance === 'amoled' ? 'dark' : 'light'}
          style={[styles.stickyBlur, { borderBottomColor: c.border }]}
        >
          <Text style={[styles.stickyTitle, { color: c.text }]}>Fotoğraflar</Text>
        </BlurView>
      </RNAnimated.View>

      <SafeAreaView style={styles.fill} edges={['top']}>
        {/* Selection mode bar */}
        {selectionMode && (
          <View style={[styles.selectionBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={cancelSelection} style={styles.selectionAction}>
              <Ionicons name="close" size={22} color={c.text} />
            </TouchableOpacity>
            <Text style={[styles.selectionCount, { color: c.text }]}>
              {selectedIds.size} seçildi
            </Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity style={styles.selectionAction}>
                <Ionicons name="share-outline" size={22} color={c.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectionAction}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

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
            <Text style={[styles.title, { color: c.text }]}>Fotoğraflar</Text>
            <Text style={[styles.subtitle, { color: c.textDim }]}>
              {displayedPhotos.length} fotoğraf
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
                placeholder="Fotoğraf ara..."
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

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? c.accent : c.surface,
                      borderColor: active ? c.accent : c.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={filter.icon as any}
                    size={14}
                    color={active ? c.onAccent : c.textDim}
                  />
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: active ? c.onAccent : c.textDim },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Photo grid */}
          {photosLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={c.accent} size="large" />
              <Text style={[styles.loadingText, { color: c.textDim }]}>Yükleniyor...</Text>
            </View>
          ) : (
            <MediaGrid
              assets={displayedPhotos}
              onPress={handlePress}
              onLongPress={handleLongPress}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
            />
          )}

          <View style={styles.bottomPad} />
        </RNAnimated.ScrollView>
      </SafeAreaView>
    </ThemedBackground>
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
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectionCount: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionAction: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
  filtersRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
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
