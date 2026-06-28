/**
 * Akrep Galeri - Video Metadata Manager
 * Video süreleri, thumbnail'ler ve metadata yönetimi
 */

import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video } from 'expo-av';

export interface VideoMetadata {
  videoId: string;
  uri: string;
  filename: string;
  duration: number; // milliseconds
  durationFormatted: string; // "HH:MM:SS"
  thumbnailUri?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt: number;
  updatedAt: number;
}

interface MetadataCache {
  [videoId: string]: VideoMetadata;
}

const METADATA_CACHE_DIR = FileSystem.documentDirectory + 'akrep/video-metadata/';
const THUMBNAILS_DIR = FileSystem.documentDirectory + 'akrep/video-thumbnails/';

/**
 * Video Metadata sistemini başlat
 */
export async function initializeVideoMetadataManager(): Promise<void> {
  try {
    for (const dir of [METADATA_CACHE_DIR, THUMBNAILS_DIR]) {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }
  } catch (error) {
    console.error('Video metadata yöneticisi başlatılamadı:', error);
  }
}

/**
 * Video metadata'sını al
 */
export async function getVideoMetadata(
  videoUri: string,
  videoId: string
): Promise<VideoMetadata> {
  try {
    // Cache'den kontrol et
    const cached = await loadMetadataFromCache(videoId);
    if (cached) {
      return cached;
    }

    // Metadata'yı al
    const metadata = await extractVideoMetadata(videoUri, videoId);

    // Thumbnail oluştur
    try {
      const thumbnailUri = await generateVideoThumbnail(videoUri, videoId);
      metadata.thumbnailUri = thumbnailUri;
    } catch (error) {
      console.warn('Thumbnail oluşturulamadı:', error);
    }

    // Cache'e kaydet
    await saveMetadataToCache(metadata);

    return metadata;
  } catch (error) {
    console.error('Video metadata alınamadı:', error);
    throw error;
  }
}

/**
 * Video metadata'sını çıkar
 */
async function extractVideoMetadata(
  videoUri: string,
  videoId: string
): Promise<VideoMetadata> {
  try {
    // Gerçek uygulamada: expo-av Video.getStatusAsync() kullanılacak
    // const video = new Video();
    // const status = await video.getStatusAsync();

    // Simüle edilmiş metadata
    const duration = Math.floor(Math.random() * 600000) + 5000; // 5s - 10min
    const fileInfo = await FileSystem.getInfoAsync(videoUri, { size: true });

    return {
      videoId,
      uri: videoUri,
      filename: videoUri.split('/').pop() || 'video.mp4',
      duration,
      durationFormatted: formatDuration(duration),
      width: 1920,
      height: 1080,
      fileSize: (fileInfo as any).size,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error('Video metadata çıkarılamadı:', error);
    throw error;
  }
}

/**
 * Video thumbnail'i oluştur
 */
async function generateVideoThumbnail(
  videoUri: string,
  videoId: string
): Promise<string> {
  try {
    // Videonun başından thumbnail al (1 saniye)
    const { uri: tempThumbnailUri } = await VideoThumbnails.getThumbnailAsync(
      videoUri,
      {
        time: 1000, // 1 saniye
        quality: 0.8,
      }
    );

    // Thumbnail'i kalıcı konuma taşı
    const permanentPath = THUMBNAILS_DIR + `${videoId}.jpg`;
    await FileSystem.moveAsync({
      from: tempThumbnailUri,
      to: permanentPath,
    });

    return permanentPath;
  } catch (error) {
    console.error('Thumbnail oluşturulamadı:', error);
    throw error;
  }
}

/**
 * Toplu video metadata'sı al
 */
export async function getVideoMetadataBatch(
  videos: Array<{ uri: string; id: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<VideoMetadata[]> {
  try {
    const results: VideoMetadata[] = [];

    for (let i = 0; i < videos.length; i++) {
      const { uri, id } = videos[i];
      try {
        const metadata = await getVideoMetadata(uri, id);
        results.push(metadata);
      } catch (error) {
        console.warn(`Video ${id} metadata alınamadı:`, error);
      }
      onProgress?.(i + 1, videos.length);
    }

    return results;
  } catch (error) {
    console.error('Toplu video metadata alınamadı:', error);
    throw error;
  }
}

/**
 * Özel zaman noktasından thumbnail al
 */
export async function generateThumbnailAtTime(
  videoUri: string,
  videoId: string,
  timeMs: number
): Promise<string> {
  try {
    const { uri: tempThumbnailUri } = await VideoThumbnails.getThumbnailAsync(
      videoUri,
      {
        time: timeMs,
        quality: 0.8,
      }
    );

    const permanentPath = THUMBNAILS_DIR + `${videoId}_${timeMs}.jpg`;
    await FileSystem.moveAsync({
      from: tempThumbnailUri,
      to: permanentPath,
    });

    return permanentPath;
  } catch (error) {
    console.error('Özel zaman thumbnail\'i oluşturulamadı:', error);
    throw error;
  }
}

/**
 * Metadata'yı cache'e kaydet
 */
async function saveMetadataToCache(metadata: VideoMetadata): Promise<void> {
  try {
    const filePath = METADATA_CACHE_DIR + `${metadata.videoId}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(metadata));
  } catch (error) {
    console.error('Metadata cache\'e kaydedilemedi:', error);
  }
}

/**
 * Cache'den metadata'yı yükle
 */
async function loadMetadataFromCache(videoId: string): Promise<VideoMetadata | null> {
  try {
    const filePath = METADATA_CACHE_DIR + `${videoId}.json`;
    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Süreyi formatla (HH:MM:SS)
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Tüm video metadata'sını al
 */
export async function getAllVideoMetadata(): Promise<VideoMetadata[]> {
  try {
    const files = await FileSystem.readDirectoryAsync(METADATA_CACHE_DIR);
    const metadata: VideoMetadata[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await FileSystem.readAsStringAsync(
            METADATA_CACHE_DIR + file
          );
          metadata.push(JSON.parse(content));
        } catch (error) {
          console.warn(`Metadata dosyası okunamadı: ${file}`);
        }
      }
    }

    return metadata;
  } catch (error) {
    console.error('Tüm video metadata alınamadı:', error);
    return [];
  }
}

/**
 * Thumbnail'i sil
 */
export async function deleteThumbnail(videoId: string): Promise<void> {
  try {
    const thumbnailPath = THUMBNAILS_DIR + `${videoId}.jpg`;
    await FileSystem.deleteAsync(thumbnailPath, { idempotent: true });
  } catch (error) {
    console.error('Thumbnail silinemedi:', error);
  }
}

/**
 * Metadata'yı sil
 */
export async function deleteMetadata(videoId: string): Promise<void> {
  try {
    const metadataPath = METADATA_CACHE_DIR + `${videoId}.json`;
    await FileSystem.deleteAsync(metadataPath, { idempotent: true });
    await deleteThumbnail(videoId);
  } catch (error) {
    console.error('Metadata silinemedi:', error);
  }
}

/**
 * Metadata cache'ini temizle
 */
export async function clearMetadataCache(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(METADATA_CACHE_DIR);
    for (const file of files) {
      await FileSystem.deleteAsync(METADATA_CACHE_DIR + file, { idempotent: true });
    }
  } catch (error) {
    console.error('Metadata cache temizlenemedi:', error);
  }
}

/**
 * Thumbnail cache'ini temizle
 */
export async function clearThumbnailCache(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(THUMBNAILS_DIR);
    for (const file of files) {
      await FileSystem.deleteAsync(THUMBNAILS_DIR + file, { idempotent: true });
    }
  } catch (error) {
    console.error('Thumbnail cache temizlenemedi:', error);
  }
}
