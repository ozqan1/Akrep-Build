/**
 * Akrep Galeri - Recycle Bin & Decoy Vault System
 * Gelişmiş çöp kutusu ve ultra güvenli sahte kasa sistemi
 */

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

export interface DeletedItem {
  id: string;
  originalUri: string;
  deletedUri: string;
  filename: string;
  mediaType: 'photo' | 'video' | 'audio' | 'document';
  fileSize: number;
  deletedAt: number;
  expiresAt: number; // 30 gün sonra otomatik silinecek
  isPermanentlyDeleted: boolean;
}

export interface DecoyVaultItem {
  id: string;
  filename: string;
  mediaType: 'photo' | 'video' | 'audio';
  uri: string;
  isDecoy: boolean; // true = sahte, false = gerçek
}

interface RecycleBinConfig {
  retentionDays: number; // Kaç gün saklanacak (varsayılan 30)
  autoCleanup: boolean; // Otomatik temizleme
  requireBiometricForPermanentDelete: boolean; // Kalıcı silme için biyometrik
}

const RECYCLE_BIN_DIR = FileSystem.documentDirectory + 'akrep/recycle-bin/';
const DECOY_VAULT_DIR = FileSystem.documentDirectory + 'akrep/decoy-vault/';
const RECYCLE_BIN_MANIFEST_KEY = 'akrep_recycle_bin_manifest';
const DECOY_VAULT_MANIFEST_KEY = 'akrep_decoy_vault_manifest';
const DECOY_PIN_KEY = 'akrep_decoy_pin';

const DEFAULT_CONFIG: RecycleBinConfig = {
  retentionDays: 30,
  autoCleanup: true,
  requireBiometricForPermanentDelete: true,
};

let recycleBinConfig = { ...DEFAULT_CONFIG };

/**
 * Çöp Kutusu Sistemini başlat
 */
export async function initializeRecycleBin(
  config: Partial<RecycleBinConfig> = {}
): Promise<void> {
  try {
    recycleBinConfig = { ...DEFAULT_CONFIG, ...config };

    // Dizinleri oluştur
    for (const dir of [RECYCLE_BIN_DIR, DECOY_VAULT_DIR]) {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }

    // Eski dosyaları temizle
    if (recycleBinConfig.autoCleanup) {
      await cleanupExpiredItems();
    }

    console.log('Çöp Kutusu Sistemi başlatıldı');
  } catch (error) {
    console.error('Çöp Kutusu başlatılamadı:', error);
  }
}

/**
 * Dosyayı çöp kutusuna taşı
 */
export async function moveToRecycleBin(
  sourceUri: string,
  filename: string,
  mediaType: 'photo' | 'video' | 'audio' | 'document'
): Promise<DeletedItem> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(sourceUri, { size: true });
    if (!fileInfo.exists) {
      throw new Error('Kaynak dosya bulunamadı');
    }

    const itemId = `deleted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deletedPath = RECYCLE_BIN_DIR + itemId;

    // Dosyayı çöp kutusuna taşı
    await FileSystem.moveAsync({
      from: sourceUri,
      to: deletedPath,
    });

    const now = Date.now();
    const expiresAt = now + (recycleBinConfig.retentionDays * 24 * 60 * 60 * 1000);

    const deletedItem: DeletedItem = {
      id: itemId,
      originalUri: sourceUri,
      deletedUri: deletedPath,
      filename,
      mediaType,
      fileSize: (fileInfo as any).size || 0,
      deletedAt: now,
      expiresAt,
      isPermanentlyDeleted: false,
    };

    // Manifest'e ekle
    await addToRecycleBinManifest(deletedItem);

    return deletedItem;
  } catch (error) {
    console.error('Dosya çöp kutusuna taşınamadı:', error);
    throw error;
  }
}

/**
 * Dosyayı çöp kutusundan geri yükle
 */
export async function restoreFromRecycleBin(
  itemId: string,
  restorePath: string
): Promise<boolean> {
  try {
    const manifest = await getRecycleBinManifest();
    const item = manifest[itemId];

    if (!item) {
      throw new Error('Çöp kutusu öğesi bulunamadı');
    }

    // Dosyayı geri yükle
    await FileSystem.moveAsync({
      from: item.deletedUri,
      to: restorePath,
    });

    // Manifest'ten sil
    delete manifest[itemId];
    await saveRecycleBinManifest(manifest);

    return true;
  } catch (error) {
    console.error('Dosya geri yüklenemedi:', error);
    return false;
  }
}

/**
 * Dosyayı kalıcı olarak sil
 */
export async function permanentlyDeleteItem(
  itemId: string,
  requireBiometric: boolean = true
): Promise<boolean> {
  try {
    // Biyometrik kontrol (gerçek uygulamada)
    if (requireBiometric && recycleBinConfig.requireBiometricForPermanentDelete) {
      // await BiometricAuth.authenticate();
      console.log('Biyometrik doğrulama gerekli');
    }

    const manifest = await getRecycleBinManifest();
    const item = manifest[itemId];

    if (!item) {
      throw new Error('Çöp kutusu öğesi bulunamadı');
    }

    // Dosyayı sil
    await FileSystem.deleteAsync(item.deletedUri, { idempotent: true });

    // Manifest'i güncelle
    item.isPermanentlyDeleted = true;
    delete manifest[itemId];
    await saveRecycleBinManifest(manifest);

    return true;
  } catch (error) {
    console.error('Dosya kalıcı olarak silinemedi:', error);
    return false;
  }
}

/**
 * Çöp kutusundaki tüm öğeleri listele
 */
export async function listRecycleBinItems(): Promise<DeletedItem[]> {
  try {
    const manifest = await getRecycleBinManifest();
    return Object.values(manifest).filter(item => !item.isPermanentlyDeleted);
  } catch (error) {
    console.error('Çöp kutusu öğeleri listelenemiyor:', error);
    return [];
  }
}

/**
 * Süresi dolmuş öğeleri otomatik temizle
 */
async function cleanupExpiredItems(): Promise<void> {
  try {
    const manifest = await getRecycleBinManifest();
    const now = Date.now();

    for (const [itemId, item] of Object.entries(manifest)) {
      if (now > item.expiresAt) {
        await FileSystem.deleteAsync(item.deletedUri, { idempotent: true });
        delete manifest[itemId];
      }
    }

    await saveRecycleBinManifest(manifest);
  } catch (error) {
    console.error('Süresi dolmuş öğeler temizlenemedi:', error);
  }
}

/**
 * Sahte Kasa PIN'i ayarla
 */
export async function setDecoyPin(decoyPin: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(DECOY_PIN_KEY, decoyPin);
  } catch (error) {
    console.error('Sahte PIN ayarlanamadı:', error);
  }
}

/**
 * Sahte Kasa'ya dosya ekle
 */
export async function addToDecoyVault(
  sourceUri: string,
  filename: string,
  mediaType: 'photo' | 'video' | 'audio'
): Promise<DecoyVaultItem> {
  try {
    const itemId = `decoy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const decoyPath = DECOY_VAULT_DIR + itemId;

    // Dosyayı kopyala
    await FileSystem.copyAsync({
      from: sourceUri,
      to: decoyPath,
    });

    const decoyItem: DecoyVaultItem = {
      id: itemId,
      filename,
      mediaType,
      uri: decoyPath,
      isDecoy: true,
    };

    // Manifest'e ekle
    await addToDecoyVaultManifest(decoyItem);

    return decoyItem;
  } catch (error) {
    console.error('Dosya Sahte Kasa\'ya eklenemedi:', error);
    throw error;
  }
}

/**
 * Sahte Kasa'dan dosya sil
 */
export async function removeFromDecoyVault(itemId: string): Promise<boolean> {
  try {
    const manifest = await getDecoyVaultManifest();
    const item = manifest[itemId];

    if (!item) {
      throw new Error('Sahte Kasa öğesi bulunamadı');
    }

    await FileSystem.deleteAsync(item.uri, { idempotent: true });
    delete manifest[itemId];
    await saveDecoyVaultManifest(manifest);

    return true;
  } catch (error) {
    console.error('Dosya Sahte Kasa\'dan silinemedi:', error);
    return false;
  }
}

/**
 * Sahte Kasa'daki öğeleri listele
 */
export async function listDecoyVaultItems(): Promise<DecoyVaultItem[]> {
  try {
    const manifest = await getDecoyVaultManifest();
    return Object.values(manifest);
  } catch (error) {
    console.error('Sahte Kasa öğeleri listelenemiyor:', error);
    return [];
  }
}

// Manifest Yönetimi
async function getRecycleBinManifest(): Promise<Record<string, DeletedItem>> {
  try {
    const manifest = await SecureStore.getItemAsync(RECYCLE_BIN_MANIFEST_KEY);
    return manifest ? JSON.parse(manifest) : {};
  } catch (error) {
    return {};
  }
}

async function saveRecycleBinManifest(manifest: Record<string, DeletedItem>): Promise<void> {
  try {
    await SecureStore.setItemAsync(RECYCLE_BIN_MANIFEST_KEY, JSON.stringify(manifest));
  } catch (error) {
    console.error('Çöp Kutusu manifest kaydedilemedi:', error);
  }
}

async function addToRecycleBinManifest(item: DeletedItem): Promise<void> {
  try {
    const manifest = await getRecycleBinManifest();
    manifest[item.id] = item;
    await saveRecycleBinManifest(manifest);
  } catch (error) {
    console.error('Çöp Kutusu manifest güncellenemedi:', error);
  }
}

async function getDecoyVaultManifest(): Promise<Record<string, DecoyVaultItem>> {
  try {
    const manifest = await SecureStore.getItemAsync(DECOY_VAULT_MANIFEST_KEY);
    return manifest ? JSON.parse(manifest) : {};
  } catch (error) {
    return {};
  }
}

async function saveDecoyVaultManifest(manifest: Record<string, DecoyVaultItem>): Promise<void> {
  try {
    await SecureStore.setItemAsync(DECOY_VAULT_MANIFEST_KEY, JSON.stringify(manifest));
  } catch (error) {
    console.error('Sahte Kasa manifest kaydedilemedi:', error);
  }
}

async function addToDecoyVaultManifest(item: DecoyVaultItem): Promise<void> {
  try {
    const manifest = await getDecoyVaultManifest();
    manifest[item.id] = item;
    await saveDecoyVaultManifest(manifest);
  } catch (error) {
    console.error('Sahte Kasa manifest güncellenemedi:', error);
  }
}

/**
 * Çöp Kutusu istatistikleri
 */
export async function getRecycleBinStats(): Promise<{
  itemCount: number;
  totalSize: number;
  oldestItem?: DeletedItem;
}> {
  try {
    const items = await listRecycleBinItems();
    let totalSize = 0;

    items.forEach(item => {
      totalSize += item.fileSize;
    });

    const oldestItem = items.length > 0
      ? items.reduce((prev, current) =>
          prev.deletedAt < current.deletedAt ? prev : current
        )
      : undefined;

    return {
      itemCount: items.length,
      totalSize,
      oldestItem,
    };
  } catch (error) {
    console.error('Çöp Kutusu istatistikleri alınamadı:', error);
    return { itemCount: 0, totalSize: 0 };
  }
}
