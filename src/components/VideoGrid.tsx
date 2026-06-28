import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { DownloadItem } from '@/store/useDownloads';
import { useTheme } from '@/theme/useTheme';

const GAP = 10;
const COLS = 3;

interface Props {
  items: DownloadItem[];
  onOpen: (item: DownloadItem) => void;
  onLongPress: (item: DownloadItem) => void;
}

export function VideoGrid({ items, onOpen, onLongPress }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const width = (Dimensions.get('window').width - 40 - GAP * (COLS - 1)) / COLS;

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: c.border }]}>
        <Ionicons name="cloud-download-outline" size={34} color={c.textDim} />
        <Text style={[styles.emptyText, { color: c.textDim }]}>Henüz indirilen video yok.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Animated.View key={item.id} entering={FadeIn.duration(250)} layout={Layout.springify()}>
          <PressableScale
            onPress={() => onOpen(item)}
            onLongPress={() => onLongPress(item)}
            style={[styles.cell, { width, height: width * 1.4, backgroundColor: c.surfaceAlt }]}
            scaleTo={0.95}
          >
            {item.thumbUri ? (
              <Image source={{ uri: item.thumbUri }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback]}>
                <Ionicons name="film-outline" size={26} color={c.textDim} />
              </View>
            )}
            <View style={styles.playBadge}>
              <Ionicons name="play" size={16} color="#fff" />
            </View>
            {item.quality && item.quality !== 'max' ? (
              <View style={[styles.qBadge, { backgroundColor: c.accent }]}>
                <Text style={[styles.qText, { color: c.onAccent }]}>{item.quality}p</Text>
              </View>
            ) : null}
          </PressableScale>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cell: { borderRadius: 14, overflow: 'hidden', justifyContent: 'center' },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  playBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qText: { fontSize: 10, fontWeight: '800' },
  empty: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    borderStyle: 'dashed',
    paddingVertical: 38,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 13 },
});
