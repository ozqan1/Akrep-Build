import React, { useCallback } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { MediaAsset } from '@/store/useMediaStore';
import { useTheme } from '@/theme/useTheme';

const GAP = 2;
const COLS = 3;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - GAP * (COLS - 1)) / COLS;

interface Props {
  assets: MediaAsset[];
  onPress: (asset: MediaAsset, index: number) => void;
  onLongPress?: (asset: MediaAsset) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  numColumns?: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaGrid({
  assets,
  onPress,
  onLongPress,
  selectionMode = false,
  selectedIds = new Set(),
  numColumns = COLS,
}: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const cellSize = (SCREEN_WIDTH - GAP * (numColumns - 1)) / numColumns;

  const renderItem = useCallback(
    (asset: MediaAsset, index: number) => {
      const isSelected = selectedIds.has(asset.id);
      const isVideo = asset.mediaType === 'video';

      return (
        <Animated.View
          key={asset.id}
          entering={FadeIn.duration(200).delay(Math.min(index * 15, 300))}
          layout={Layout.springify()}
        >
          <PressableScale
            onPress={() => onPress(asset, index)}
            onLongPress={() => onLongPress?.(asset)}
            scaleTo={0.96}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: c.surfaceAlt,
                borderWidth: isSelected ? 2.5 : 0,
                borderColor: isSelected ? c.accent : 'transparent',
              },
            ]}
          >
            <Image
              source={{ uri: asset.uri }}
              style={styles.image}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />

            {/* Video duration badge */}
            {isVideo && asset.duration > 0 && (
              <View style={styles.durationBadge}>
                <Ionicons name="play" size={8} color="#fff" />
                <Text style={styles.durationText}>
                  {formatDuration(asset.duration)}
                </Text>
              </View>
            )}

            {/* Selection indicator */}
            {selectionMode && (
              <View
                style={[
                  styles.selectionCircle,
                  {
                    backgroundColor: isSelected ? c.accent : 'rgba(0,0,0,0.4)',
                    borderColor: isSelected ? c.accent : 'rgba(255,255,255,0.7)',
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={12} color={c.onAccent} />
                )}
              </View>
            )}

            {/* Video icon overlay */}
            {isVideo && !selectionMode && (
              <View style={styles.videoOverlay}>
                <Ionicons name="videocam" size={14} color="rgba(255,255,255,0.9)" />
              </View>
            )}
          </PressableScale>
        </Animated.View>
      );
    },
    [c, cellSize, onPress, onLongPress, selectionMode, selectedIds]
  );

  if (assets.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: c.border }]}>
        <Ionicons name="images-outline" size={40} color={c.textDim} />
        <Text style={[styles.emptyText, { color: c.textDim }]}>
          Medya bulunamadı
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {assets.map((asset, index) => renderItem(asset, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
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
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  selectionCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 5,
    left: 5,
  },
  empty: {
    flex: 1,
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
});
