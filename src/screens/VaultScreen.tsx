import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '@/components/ThemedBackground';
import { useTheme } from '@/theme/useTheme';
import { PressableScale } from '@/components/PressableScale';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useVaultStore, VaultAsset } from '@/store/useVaultStore';
import { LockScreen } from '@/components/LockScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 48 - 8 * 2) / 3;

export default function VaultScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const { vaultAssets, isLocked, loading, initVault, lockVault, removeFromVault } = useVaultStore();
  const [selectedAsset, setSelectedAsset] = useState<VaultAsset | null>(null);

  useEffect(() => {
    initVault();
  }, []);

  const handleUnlock = () => {
    // LockScreen tarafından yönetilecek
  };

  const handleDeleteAsset = (asset: VaultAsset) => {
    Alert.alert(
      'Sil',
      `"${asset.filename}" Vault'tan silinecek. Emin misiniz?`,
      [
        { text: 'İptal', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sil',
          onPress: async () => {
            await removeFromVault(asset.id);
            Alert.alert('Başarılı', 'Dosya silindi.');
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.text }]}>Gizli Kasa</Text>
          <TouchableOpacity onPress={() => lockVault()} style={styles.backBtn}>
            <Ionicons name="lock-closed-outline" size={24} color={c.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={c.accent} size="large" />
              <Text style={[styles.loadingText, { color: c.textDim }]}>
                Yükleniyor...
              </Text>
            </View>
          ) : vaultAssets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={80} color={c.surfaceAlt} />
              <Text style={[styles.emptyText, { color: c.textDim }]}>
                Henüz gizli medya yok.
              </Text>
              <Text style={[styles.emptySubText, { color: c.textDim }]}>
                Medyaları Vault'a eklemek için galeri ekranından başlayın.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {vaultAssets.map((asset) => (
                <VaultItemCard
                  key={asset.id}
                  asset={asset}
                  colors={c}
                  onDelete={() => handleDeleteAsset(asset)}
                  onSelect={() => setSelectedAsset(asset)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

interface VaultItemCardProps {
  asset: VaultAsset;
  colors: any;
  onDelete: () => void;
  onSelect: () => void;
}

function VaultItemCard({ asset, colors, onDelete, onSelect }: VaultItemCardProps) {
  const getIconName = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return 'videocam-outline';
      case 'audio':
        return 'musical-notes-outline';
      default:
        return 'image-outline';
    }
  };

  return (
    <View style={[styles.itemContainer, { width: ITEM_SIZE }]}>
      <PressableScale
        onPress={onSelect}
        scaleTo={0.95}
        style={[
          styles.item,
          { height: ITEM_SIZE, backgroundColor: colors.surfaceAlt },
        ]}
      >
        <View style={styles.itemIconContainer}>
          <Ionicons name={getIconName(asset.mediaType) as any} size={40} color={colors.accent} />
        </View>
        <View style={styles.itemOverlay}>
          <Text style={styles.itemFilename} numberOfLines={1}>
            {asset.filename}
          </Text>
        </View>
      </PressableScale>
      <TouchableOpacity
        onPress={onDelete}
        style={[styles.deleteBtn, { backgroundColor: colors.error }]}
      >
        <Ionicons name="trash-outline" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemContainer: {
    marginBottom: 12,
  },
  item: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  itemFilename: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
});
