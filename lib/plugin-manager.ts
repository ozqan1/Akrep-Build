/**
 * Akrep Galeri - Plugin Manager
 * Modüler eklenti yönetimi ve dinamik indirme sistemi
 */

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

export type PluginCategory = 'ai' | 'editing' | 'tools' | 'security' | 'utility';
export type PluginStatus = 'available' | 'downloading' | 'installed' | 'error';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  version: string;
  size: number; // bytes
  status: PluginStatus;
  downloadUrl?: string;
  installPath?: string;
  dependencies?: string[];
  requiredPermissions?: string[];
  downloadedAt?: number;
  enabled: boolean;
}

interface PluginManifest {
  [pluginId: string]: Plugin;
}

const PLUGINS_DIR = FileSystem.documentDirectory + 'akrep/plugins/';
const PLUGINS_MANIFEST_KEY = 'akrep_plugins_manifest';

// Mevcut Eklentiler Kataloğu
export const PLUGIN_CATALOG: PluginManifest = {
  // AI & Akıllı Özellikler
  'ai-search': {
    id: 'ai-search',
    name: 'Akıllı Arama',
    description: '"Mavi araba", "deniz kenarı" gibi doğal dil sorgularıyla medya arama',
    category: 'ai',
    version: '1.0.0',
    size: 45 * 1024 * 1024, // 45MB
    status: 'available',
    enabled: false,
    dependencies: ['ml-kit-vision'],
    requiredPermissions: ['READ_EXTERNAL_STORAGE'],
  },
  'face-recognition': {
    id: 'face-recognition',
    name: 'Yüz Tanıma & Albümler',
    description: 'Yüzleri tanıyıp kişilere göre otomatik albüm oluşturma',
    category: 'ai',
    version: '1.0.0',
    size: 52 * 1024 * 1024, // 52MB
    status: 'available',
    enabled: false,
    dependencies: ['ml-kit-vision'],
  },
  'duplicate-finder': {
    id: 'duplicate-finder',
    name: 'Benzer/Kopya Bulucu',
    description: 'Cihazdaki gereksiz yer kaplayan aynı/benzer fotoğrafları tespit etme',
    category: 'ai',
    version: '1.0.0',
    size: 38 * 1024 * 1024, // 38MB
    status: 'available',
    enabled: false,
  },

  // Düzenleme Araçları
  'photo-editor': {
    id: 'photo-editor',
    name: 'Fotoğraf Editörü',
    description: 'Filtreler, renk dengesi, kontrast ve sanatsal efektler',
    category: 'editing',
    version: '1.0.0',
    size: 48 * 1024 * 1024, // 48MB
    status: 'available',
    enabled: false,
    dependencies: ['image-processing'],
  },
  'video-trimmer': {
    id: 'video-trimmer',
    name: 'Video Kesme Aracı',
    description: 'Videoları kare hassasiyetinde kesme ve yeni dosya olarak kaydetme',
    category: 'editing',
    version: '1.0.0',
    size: 55 * 1024 * 1024, // 55MB
    status: 'available',
    enabled: false,
    dependencies: ['ffmpeg'],
  },
  'exif-editor': {
    id: 'exif-editor',
    name: 'EXIF Editörü',
    description: 'Fotoğrafların tarih, saat ve konum bilgilerini düzenleme',
    category: 'editing',
    version: '1.0.0',
    size: 12 * 1024 * 1024, // 12MB
    status: 'available',
    enabled: false,
  },
  'document-scanner': {
    id: 'document-scanner',
    name: 'Belge Tarayıcı & PDF',
    description: 'Fotoğrafları belge olarak algılayıp perspektif düzeltme ve PDF dönüştürme',
    category: 'editing',
    version: '1.0.0',
    size: 42 * 1024 * 1024, // 42MB
    status: 'available',
    enabled: false,
    dependencies: ['opencv', 'pdfkit'],
  },

  // Güvenlik Araçları
  'decoy-vault': {
    id: 'decoy-vault',
    name: 'Sahte Kasa Sistemi',
    description: 'Yanlış PIN girildiğinde boş/alakasız içerik gösteren yanıltıcı kasa',
    category: 'security',
    version: '1.0.0',
    size: 8 * 1024 * 1024, // 8MB
    status: 'available',
    enabled: false,
  },
  'stealth-mode': {
    id: 'stealth-mode',
    name: 'Hayalet Modu',
    description: 'Uygulama ikonunu hesap makinesi veya not defteri gibi değiştirme',
    category: 'security',
    version: '1.0.0',
    size: 5 * 1024 * 1024, // 5MB
    status: 'available',
    enabled: false,
  },
  'metadata-stripper': {
    id: 'metadata-stripper',
    name: 'Metadata Temizleyici',
    description: 'Sosyal medyaya paylaşmadan önce konum ve cihaz bilgilerini silme',
    category: 'security',
    version: '1.0.0',
    size: 6 * 1024 * 1024, // 6MB
    status: 'available',
    enabled: false,
  },

  // Yardımcı Araçlar
  'story-maker': {
    id: 'story-maker',
    name: 'Hareketli Anılar',
    description: 'Belirli tarihlerdeki fotoğraflardan müzikli slayt gösterileri oluşturma',
    category: 'utility',
    version: '1.0.0',
    size: 35 * 1024 * 1024, // 35MB
    status: 'available',
    enabled: false,
    dependencies: ['ffmpeg'],
  },
  'vault-browser': {
    id: 'vault-browser',
    name: 'Gizli Tarayıcı',
    description: 'Kasa içinden erişilen, indirilen medyaları doğrudan kasaya kaydeden tarayıcı',
    category: 'utility',
    version: '1.0.0',
    size: 18 * 1024 * 1024, // 18MB
    status: 'available',
    enabled: false,
  },
};

/**
 * Plugin Yöneticisini başlat
 */
export async function initializePluginManager(): Promise<void> {
  try {
    // Plugins dizinini oluştur
    const info = await FileSystem.getInfoAsync(PLUGINS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(PLUGINS_DIR, { intermediates: true });
    }

    // Manifest'i yükle veya oluştur
    let manifest = await getPluginsManifest();
    if (!manifest) {
      manifest = PLUGIN_CATALOG;
      await savePluginsManifest(manifest);
    }

    console.log('Plugin Yöneticisi başlatıldı');
  } catch (error) {
    console.error('Plugin Yöneticisi başlatılamadı:', error);
  }
}

/**
 * Plugin manifestini al
 */
async function getPluginsManifest(): Promise<PluginManifest | null> {
  try {
    const manifest = await SecureStore.getItemAsync(PLUGINS_MANIFEST_KEY);
    return manifest ? JSON.parse(manifest) : null;
  } catch (error) {
    console.error('Plugin manifest alınamadı:', error);
    return null;
  }
}

/**
 * Plugin manifestini kaydet
 */
async function savePluginsManifest(manifest: PluginManifest): Promise<void> {
  try {
    await SecureStore.setItemAsync(PLUGINS_MANIFEST_KEY, JSON.stringify(manifest));
  } catch (error) {
    console.error('Plugin manifest kaydedilemedi:', error);
  }
}

/**
 * Plugin'i indir
 */
export async function downloadPlugin(
  pluginId: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    const plugin = PLUGIN_CATALOG[pluginId];
    if (!plugin) {
      console.error(`Plugin ${pluginId} bulunamadı`);
      return false;
    }

    console.log(`${plugin.name} indiriliyor...`);

    // Gerçek uygulamada: Firebase Storage, S3 veya kendi sunucusundan indir
    // Simüle edilmiş indirme
    for (let i = 0; i <= 100; i += 5) {
      onProgress?.(i / 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Plugin dosyasını kaydet
    const pluginPath = PLUGINS_DIR + `${pluginId}.plugin`;
    await FileSystem.writeAsStringAsync(pluginPath, `Plugin: ${pluginId}`);

    // Manifest'i güncelle
    let manifest = await getPluginsManifest() || PLUGIN_CATALOG;
    if (manifest[pluginId]) {
      manifest[pluginId].status = 'installed';
      manifest[pluginId].downloadedAt = Date.now();
      manifest[pluginId].installPath = pluginPath;
      await savePluginsManifest(manifest);
    }

    return true;
  } catch (error) {
    console.error('Plugin indirilemedi:', error);
    return false;
  }
}

/**
 * Plugin'i sil
 */
export async function uninstallPlugin(pluginId: string): Promise<boolean> {
  try {
    const plugin = PLUGIN_CATALOG[pluginId];
    if (!plugin?.installPath) return false;

    await FileSystem.deleteAsync(plugin.installPath, { idempotent: true });

    // Manifest'i güncelle
    let manifest = await getPluginsManifest() || PLUGIN_CATALOG;
    if (manifest[pluginId]) {
      manifest[pluginId].status = 'available';
      manifest[pluginId].downloadedAt = undefined;
      manifest[pluginId].installPath = undefined;
      manifest[pluginId].enabled = false;
      await savePluginsManifest(manifest);
    }

    return true;
  } catch (error) {
    console.error('Plugin silinemedi:', error);
    return false;
  }
}

/**
 * Plugin'i etkinleştir/devre dışı bırak
 */
export async function togglePlugin(pluginId: string, enabled: boolean): Promise<void> {
  try {
    let manifest = await getPluginsManifest() || PLUGIN_CATALOG;
    if (manifest[pluginId]) {
      manifest[pluginId].enabled = enabled;
      await savePluginsManifest(manifest);
    }
  } catch (error) {
    console.error('Plugin durumu değiştirilemedi:', error);
  }
}

/**
 * Kategoriye göre plugin'leri listele
 */
export function getPluginsByCategory(category: PluginCategory): Plugin[] {
  return Object.values(PLUGIN_CATALOG).filter(p => p.category === category);
}

/**
 * Tüm plugin'leri listele
 */
export function getAllPlugins(): Plugin[] {
  return Object.values(PLUGIN_CATALOG);
}

/**
 * Yüklü plugin'leri listele
 */
export async function getInstalledPlugins(): Promise<Plugin[]> {
  try {
    const manifest = await getPluginsManifest() || PLUGIN_CATALOG;
    return Object.values(manifest).filter(p => p.status === 'installed');
  } catch (error) {
    console.error('Yüklü plugin\'ler listelenemiyor:', error);
    return [];
  }
}

/**
 * Toplam yüklü plugin boyutunu hesapla
 */
export async function calculateInstalledPluginsSize(): Promise<number> {
  try {
    const files = await FileSystem.readDirectoryAsync(PLUGINS_DIR);
    let totalSize = 0;

    for (const file of files) {
      const filePath = PLUGINS_DIR + file;
      const info = await FileSystem.getInfoAsync(filePath, { size: true });
      if (info.exists && !info.isDirectory) {
        totalSize += (info as any).size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Plugin boyutu hesaplanamadı:', error);
    return 0;
  }
}

/**
 * Plugin bağımlılıklarını kontrol et
 */
export function checkPluginDependencies(pluginId: string): {
  satisfied: boolean;
  missing: string[];
} {
  const plugin = PLUGIN_CATALOG[pluginId];
  if (!plugin?.dependencies) {
    return { satisfied: true, missing: [] };
  }

  const missing = plugin.dependencies.filter(
    dep => !PLUGIN_CATALOG[dep]?.enabled
  );

  return {
    satisfied: missing.length === 0,
    missing,
  };
}

/**
 * Tüm plugin'leri temizle
 */
export async function clearAllPlugins(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(PLUGINS_DIR);
    for (const file of files) {
      await FileSystem.deleteAsync(PLUGINS_DIR + file, { idempotent: true });
    }
  } catch (error) {
    console.error('Plugin\'ler temizlenemedi:', error);
  }
}

/**
 * Plugin depolama istatistiklerini al
 */
export async function getPluginStorageStats(): Promise<{
  totalSize: number;
  pluginCount: number;
  categories: Record<PluginCategory, number>;
}> {
  try {
    const installed = await getInstalledPlugins();
    const totalSize = await calculateInstalledPluginsSize();

    const categories: Record<PluginCategory, number> = {
      ai: 0,
      editing: 0,
      tools: 0,
      security: 0,
      utility: 0,
    };

    installed.forEach(p => {
      categories[p.category]++;
    });

    return {
      totalSize,
      pluginCount: installed.length,
      categories,
    };
  } catch (error) {
    console.error('Plugin istatistikleri alınamadı:', error);
    return {
      totalSize: 0,
      pluginCount: 0,
      categories: { ai: 0, editing: 0, tools: 0, security: 0, utility: 0 },
    };
  }
}
