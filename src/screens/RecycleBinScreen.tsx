import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '@/components/ThemedBackground';
import { useTheme } from '@/theme/useTheme';
import { router } from 'expo-router';

export default function RecycleBinScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const [deletedAssets, setDeletedAssets] = useState([]);

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.text }]}>Çöp Kutusu</Text>
          <TouchableOpacity style={styles.backBtn}>
            <Text style={{ color: c.accent, fontWeight: '700' }}>Boşalt</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBar, { backgroundColor: c.surfaceAlt }]}>
          <Ionicons name="information-circle-outline" size={18} color={c.textDim} />
          <Text style={[styles.infoText, { color: c.textDim }]}>
            Öğeler 30 gün sonra kalıcı olarak silinir.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {deletedAssets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trash-outline" size={80} color={c.surfaceAlt} />
              <Text style={[styles.emptyText, { color: c.textDim }]}>
                Çöp kutusu boş.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {/* Deleted items */}
            </View>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    paddingHorizontal: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
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
