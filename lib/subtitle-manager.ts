/**
 * Akrep Galeri - Subtitle Manager
 * Çevrimdışı video altyazı, müzik altyazı ve arka plan ses çevirisi
 */

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

export type SubtitleLanguage = 'tr' | 'ku' | 'en' | 'ar';
export type SubtitleType = 'speech' | 'music' | 'background-sound';

interface SubtitleModel {
  language: SubtitleLanguage;
  type: SubtitleType;
  name: string;
  modelSize: number; // bytes
  isDownloaded: boolean;
  downloadedAt?: number;
  version: string;
}

interface Subtitle {
  id: string;
  startTime: number; // milliseconds
  endTime: number;
  text: string;
  language: SubtitleLanguage;
  type: SubtitleType;
  confidence: number; // 0-1
}

interface SubtitleTrack {
  videoId: string;
  language: SubtitleLanguage;
  subtitles: Subtitle[];
  createdAt: number;
  duration: number; // video duration in ms
}

const SUBTITLE_MODELS_DIR = FileSystem.documentDirectory + 'akrep/subtitle-models/';
const SUBTITLE_CACHE_DIR = FileSystem.documentDirectory + 'akrep/subtitle-cache/';
const MODELS_MANIFEST_KEY = 'akrep_subtitle_models_manifest';

// Desteklenen Altyazı Modelleri
const AVAILABLE_MODELS: Record<string, SubtitleModel> = {
  'speech_tr': {
    language: 'tr',
    type: 'speech',
    name: 'Türkçe Konuşma Tanıma',
    modelSize: 35 * 1024 * 1024, // 35MB
    isDownloaded: false,
    version: '1.0.0',
  },
  'speech_en': {
    language: 'en',
    type: 'speech',
    name: 'English Speech Recognition',
    modelSize: 38 * 1024 * 1024, // 38MB
    isDownloaded: false,
    version: '1.0.0',
  },
  'speech_ku': {
    language: 'ku',
    type: 'speech',
    name: 'Kürtçe Konuşma Tanıma',
    modelSize: 40 * 1024 * 1024, // 40MB
    isDownloaded: false,
    version: '1.0.0',
  },
  'speech_ar': {
    language: 'ar',
    type: 'speech',
    name: 'العربية التعرف على الكلام',
    modelSize: 42 * 1024 * 1024, // 42MB
    isDownloaded: false,
    version: '1.0.0',
  },
  'music_tr': {
    language: 'tr',
    type: 'music',
    name: 'Türkçe Müzik/Şarkı Sözü Çevirisi',
    modelSize: 28 * 1024 * 1024, // 28MB
    isDownloaded: false,
    version: '1.0.0',
  },
  'music_en': {
    language: 'en',
    type: 'music',
    name: 'English Music/Lyrics Translation',
    modelSize: 30 * 1024 * 1024, // 30MB
    isDownloaded: false,
    version: '1.0.0',
  },
  'background_tr': {
    language: 'tr',
    type: 'background-sound',
    name: 'Türkçe Arka Plan Ses Tanıma',
    modelSize: 22 * 1024 * 1024, // 22MB
    isDownloaded: false,
    version: '1.0.0',
  },
};

/**
 * Altyazı sistemini başlat
 */
export async function initializeSubtitleSystem(): Promise<void> {
  try {
    // Dizinleri oluştur
    for (const dir of [SUBTITLE_MODELS_DIR, SUBTITLE_CACHE_DIR]) {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }

    // Manifest'i yükle veya oluştur
    let manifest = await getModelsManifest();
    if (!manifest) {
      manifest = AVAILABLE_MODELS;
      await saveModelsManifest(manifest);
    }
  } catch (error) {
    console.error('Altyazı sistemi başlatılamadı:', error);
  }
}

/**
 * Model manifestini al
 */
async function getModelsManifest(): Promise<Record<string, SubtitleModel> | null> {
  try {
    const manifest = await SecureStore.getItemAsync(MODELS_MANIFEST_KEY);
    return manifest ? JSON.parse(manifest) : null;
  } catch (error) {
    console.error('Model manifest alınamadı:', error);
    return null;
  }
}

/**
 * Model manifestini kaydet
 */
async function saveModelsManifest(manifest: Record<string, SubtitleModel>): Promise<void> {
  try {
    await SecureStore.setItemAsync(MODELS_MANIFEST_KEY, JSON.stringify(manifest));
  } catch (error) {
    console.error('Model manifest kaydedilemedi:', error);
  }
}

/**
 * Altyazı modelini indir (modüler yapı)
 */
export async function downloadSubtitleModel(
  modelKey: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    const model = AVAILABLE_MODELS[modelKey];
    if (!model) {
      console.error(`Model ${modelKey} bulunamadı`);
      return false;
    }

    console.log(`${model.name} modeli indiriliyor...`);

    // Gerçek uygulamada: Firebase Storage, S3 veya kendi sunucusundan indir
    // Simüle edilmiş indirme
    for (let i = 0; i <= 100; i += 5) {
      onProgress?.(i / 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Model dosyasını kaydet
    const modelPath = SUBTITLE_MODELS_DIR + `${modelKey}.model`;
    await FileSystem.writeAsStringAsync(modelPath, `Model: ${modelKey}`);

    // Manifest'i güncelle
    let manifest = await getModelsManifest() || AVAILABLE_MODELS;
    if (manifest[modelKey]) {
      manifest[modelKey].isDownloaded = true;
      manifest[modelKey].downloadedAt = Date.now();
      await saveModelsManifest(manifest);
    }

    return true;
  } catch (error) {
    console.error('Model indirilemedi:', error);
    return false;
  }
}

/**
 * Altyazı modelini sil
 */
export async function deleteSubtitleModel(modelKey: string): Promise<boolean> {
  try {
    const modelPath = SUBTITLE_MODELS_DIR + `${modelKey}.model`;
    await FileSystem.deleteAsync(modelPath, { idempotent: true });

    // Manifest'i güncelle
    let manifest = await getModelsManifest() || AVAILABLE_MODELS;
    if (manifest[modelKey]) {
      manifest[modelKey].isDownloaded = false;
      manifest[modelKey].downloadedAt = undefined;
      await saveModelsManifest(manifest);
    }

    return true;
  } catch (error) {
    console.error('Model silinemedi:', error);
    return false;
  }
}

/**
 * Videodan altyazı oluştur (Konuşma)
 */
export async function generateSpeechSubtitles(
  videoUri: string,
  language: SubtitleLanguage,
  videoId: string,
  duration: number
): Promise<SubtitleTrack | null> {
  try {
    const modelKey = `speech_${language}`;
    const manifest = await getModelsManifest() || AVAILABLE_MODELS;

    if (!manifest[modelKey]?.isDownloaded) {
      throw new Error(`${language} konuşma modeli indirilmemiş`);
    }

    // Gerçek uygulamada: Vosk veya Web Speech API kullanılacak
    const subtitles: Subtitle[] = [
      {
        id: '1',
        startTime: 0,
        endTime: 3000,
        text: 'Merhaba, bu bir örnek altyazıdır.',
        language,
        type: 'speech',
        confidence: 0.92,
      },
      {
        id: '2',
        startTime: 3000,
        endTime: 6000,
        text: 'Video içerisindeki konuşmalar otomatik olarak çevrilecektir.',
        language,
        type: 'speech',
        confidence: 0.88,
      },
    ];

    const track: SubtitleTrack = {
      videoId,
      language,
      subtitles,
      createdAt: Date.now(),
      duration,
    };

    // Altyazıları cache'e kaydet
    await saveSubtitleTrack(track);

    return track;
  } catch (error) {
    console.error('Konuşma altyazısı oluşturulamadı:', error);
    return null;
  }
}

/**
 * Müzik/Şarkı Sözü Çevirisi
 */
export async function generateMusicSubtitles(
  videoUri: string,
  language: SubtitleLanguage,
  videoId: string,
  duration: number
): Promise<SubtitleTrack | null> {
  try {
    const modelKey = `music_${language}`;
    const manifest = await getModelsManifest() || AVAILABLE_MODELS;

    if (!manifest[modelKey]?.isDownloaded) {
      throw new Error(`${language} müzik modeli indirilmemiş`);
    }

    // Gerçek uygulamada: Shazam API veya özel ML modeli kullanılacak
    const subtitles: Subtitle[] = [
      {
        id: '1',
        startTime: 0,
        endTime: 5000,
        text: '♪ Müzik sözü çevirisi burada görünecektir ♪',
        language,
        type: 'music',
        confidence: 0.85,
      },
    ];

    const track: SubtitleTrack = {
      videoId,
      language,
      subtitles,
      createdAt: Date.now(),
      duration,
    };

    await saveSubtitleTrack(track);
    return track;
  } catch (error) {
    console.error('Müzik altyazısı oluşturulamadı:', error);
    return null;
  }
}

/**
 * Arka Plan Ses Tanıma
 */
export async function generateBackgroundSoundSubtitles(
  videoUri: string,
  language: SubtitleLanguage,
  videoId: string,
  duration: number
): Promise<SubtitleTrack | null> {
  try {
    const modelKey = `background_${language}`;
    const manifest = await getModelsManifest() || AVAILABLE_MODELS;

    if (!manifest[modelKey]?.isDownloaded) {
      throw new Error(`${language} arka plan ses modeli indirilmemiş`);
    }

    // Gerçek uygulamada: Google Sound Recognition veya özel model kullanılacak
    const subtitles: Subtitle[] = [
      {
        id: '1',
        startTime: 0,
        endTime: 10000,
        text: '[Arka plan: Şehir gürültüsü, kuş sesleri]',
        language,
        type: 'background-sound',
        confidence: 0.78,
      },
    ];

    const track: SubtitleTrack = {
      videoId,
      language,
      subtitles,
      createdAt: Date.now(),
      duration,
    };

    await saveSubtitleTrack(track);
    return track;
  } catch (error) {
    console.error('Arka plan ses altyazısı oluşturulamadı:', error);
    return null;
  }
}

/**
 * Altyazı trackini kaydet
 */
async function saveSubtitleTrack(track: SubtitleTrack): Promise<void> {
  try {
    const filePath = SUBTITLE_CACHE_DIR + `${track.videoId}_${track.language}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(track));
  } catch (error) {
    console.error('Altyazı kaydedilemedi:', error);
  }
}

/**
 * Altyazı trackini yükle
 */
export async function loadSubtitleTrack(
  videoId: string,
  language: SubtitleLanguage
): Promise<SubtitleTrack | null> {
  try {
    const filePath = SUBTITLE_CACHE_DIR + `${videoId}_${language}.json`;
    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content);
  } catch (error) {
    console.error('Altyazı yüklenemedi:', error);
    return null;
  }
}

/**
 * Mevcut altyazı modellerini listele
 */
export function getAvailableSubtitleModels(): SubtitleModel[] {
  return Object.values(AVAILABLE_MODELS);
}

/**
 * Toplam indirilmiş model boyutunu hesapla
 */
export async function calculateDownloadedModelsSize(): Promise<number> {
  try {
    const files = await FileSystem.readDirectoryAsync(SUBTITLE_MODELS_DIR);
    let totalSize = 0;

    for (const file of files) {
      const filePath = SUBTITLE_MODELS_DIR + file;
      const info = await FileSystem.getInfoAsync(filePath, { size: true });
      if (info.exists && !info.isDirectory) {
        totalSize += (info as any).size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Model boyutu hesaplanamadı:', error);
    return 0;
  }
}

/**
 * Tüm altyazıları temizle
 */
export async function clearAllSubtitles(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(SUBTITLE_CACHE_DIR);
    for (const file of files) {
      await FileSystem.deleteAsync(SUBTITLE_CACHE_DIR + file, { idempotent: true });
    }
  } catch (error) {
    console.error('Altyazılar temizlenemedi:', error);
  }
}
