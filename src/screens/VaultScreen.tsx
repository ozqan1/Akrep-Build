import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '@/components/ThemedBackground';
import { useTheme } from '@/theme/useTheme';
import { PressableScale } from '@/components/PressableScale';
import { useMediaStore, MediaAsset } from '@/store/useMediaStore';
import { Image } from 'expo-image';
import { router } from 'expo-router';

export default function VaultScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const [locked, setLocked] = useState(true);
  const [vaultAssets, setVaultAssets] = useState<MediaAsset[]>([]);

  // In a real app, this would be stored in a secure database/storage
  // For now, we simulate the vault functionality

  const handleUnlock = () => {
    // This would normally trigger biometric or PIN
    setLocked(false);
  };

  if (locked) {
    return (
      <ThemedBackground>
        <SafeAreaView style={styles.fill}>
          <View style={styles.lockedContainer}>
            <View style={[styles.lockIcon, { backgroundColor: c.surfaceAlt }]}>
              <Ionicons name="lock-closed" size={60} color={c.accent} />
            </View>
            <Text style={[styles.title, { color: c.text }]}>Gizli Kasa</Text>
            <Text style={[styles.desc, { color: c.textDim }]}>
              Özel medyalarınız burada şifrelenmiş olarak saklanır.
            </Text>
            <PressableScale
              onPress={handleUnlock}
              style={[styles.unlockBtn, { backgroundColor: c.accent }]}
            >
              <Text style={[styles.unlockBtnText, { color: c.onAccent }]}>
                Kasa Kilidini Aç
              </Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.text }]}>Gizli Kasa</Text>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="add" size={24} color={c.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {vaultAssets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={80} color={c.surfaceAlt} />
              <Text style={[styles.emptyText, { color: c.textDim }]}>
                Henüz gizli medya yok.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {/* Render vault assets here */}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  lockIcon: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  desc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  unlockBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
  },
  unlockBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
