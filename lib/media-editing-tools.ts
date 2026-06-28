/**
 * Akrep Galeri - Media Editing Tools
 * Video kesme, fotoğraf filtreleme ve EXIF editörü
 */

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export interface VideoTrimConfig {
  startTime: number; // ms
  endTime: number; // ms
  outputPath: string;
}

export interface PhotoFilter {
  id: string;
  name: string;
  brightness: number; // -1 to 1
  contrast: number; // -1 to 1
  saturation: number; // -1 to 1
  hue: number; // -180 to 180
  blur: number; // 0 to 10
}

export interface EXIFData {
  dateTime?: string; // YYYY:MM:DD HH:MM:SS
  latitude?: number;
  longitude?: number;
  altitude?: number;
  cameraModel?: string;
  cameraManufacturer?: string;
  focalLength?: number;
  aperture?: number;
  iso?: number;
  exposureTime?: number;
  flash?: boolean;
  orientation?: number;
}

const EDITING_CACHE_DIR = FileSystem.documentDirectory + 'akrep/editing-cache/';

/**
 * Media Editing Tools'u başlat
 */
export async function initializeMediaEditingTools(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(EDITING_CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(EDITING_CACHE_DIR, { intermediates: true });
    }

    console.log('Media Editing Tools başlatıldı');
  } catch (error) {
    console.error('Media Editing Tools başlatılamadı:', error);
  }
}

/**
 * Video Kesme (Trimming)
 */
export async function trimVideo(
  videoUri: string,
  config: VideoTrimConfig
): Promise<string> {
  try {
    // Gerçek uygulamada: FFmpeg veya expo-av kullanılacak
    // const command = `ffmpeg -i ${videoUri} -ss ${config.startTime/1000} -to ${config.endTime/1000} -c copy ${config.outputPath}`;

    console.log(`Video kesiliyor: ${config.startTime}ms - ${config.endTime}ms`);

    // Simüle edilmiş video kesme
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Çıktı dosyasını oluştur (simüle edilmiş)
    await FileSystem.writeAsStringAsync(config.outputPath, 'Trimmed video data');

    return config.outputPath;
  } catch (error) {
    console.error('Video kesme başarısız:', error);
    throw error;
  }
}

/**
 * Fotoğraf Filtreleme
 */
export async function applyPhotoFilter(
  photoUri: string,
  filter: PhotoFilter
): Promise<string> {
  try {
    // Gerçek uygulamada: expo-image-manipulator veya custom shader kullanılacak
    const outputPath = EDITING_CACHE_DIR + `filtered_${Date.now()}.jpg`;

    // Simüle edilmiş filtreleme
    console.log(`Filtre uygulanıyor: ${filter.name}`);
    console.log(`  Parlaklık: ${filter.brightness}`);
    console.log(`  Kontrast: ${filter.contrast}`);
    console.log(`  Doygunluk: ${filter.saturation}`);

    // Gerçek uygulamada: ImageManipulator.manipulateAsync() kullanılacak
    // const result = await ImageManipulator.manipulateAsync(photoUri, [
    //   { brightness: filter.brightness },
    //   { contrast: filter.contrast },
    //   { saturation: filter.saturation },
    // ]);

    // Simüle edilmiş işlem
    await new Promise(resolve => setTimeout(resolve, 500));
    await FileSystem.copyAsync({
      from: photoUri,
      to: outputPath,
    });

    return outputPath;
  } catch (error) {
    console.error('Fotoğraf filtreleme başarısız:', error);
    throw error;
  }
}

/**
 * Önceden tanımlanmış filtreler
 */
export const PRESET_FILTERS: Record<string, PhotoFilter> = {
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    brightness: 0.1,
    contrast: -0.2,
    saturation: -0.3,
    hue: 15,
    blur: 0,
  },
  noir: {
    id: 'noir',
    name: 'Siyah-Beyaz',
    brightness: 0,
    contrast: 0.3,
    saturation: -1,
    hue: 0,
    blur: 0,
  },
  vivid: {
    id: 'vivid',
    name: 'Canlı',
    brightness: 0.1,
    contrast: 0.3,
    saturation: 0.5,
    hue: 0,
    blur: 0,
  },
  cool: {
    id: 'cool',
    name: 'Soğuk',
    brightness: 0,
    contrast: 0.1,
    saturation: 0.2,
    hue: -15,
    blur: 0,
  },
  warm: {
    id: 'warm',
    name: 'Sıcak',
    brightness: 0.1,
    contrast: 0.1,
    saturation: 0.1,
    hue: 30,
    blur: 0,
  },
  blur: {
    id: 'blur',
    name: 'Bulanık',
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    blur: 5,
  },
};

/**
 * EXIF Verilerini Oku
 */
export async function readEXIFData(photoUri: string): Promise<EXIFData> {
  try {
    // Gerçek uygulamada: piexifjs veya react-native-exif-lib kullanılacak
    // const exifData = await EXIF.getData(photoUri);

    // Simüle edilmiş EXIF verisi
    const exifData: EXIFData = {
      dateTime: new Date().toISOString().replace('T', ' ').split('.')[0],
      latitude: 41.0082,
      longitude: 28.9784,
      altitude: 50,
      cameraModel: 'iPhone 14 Pro',
      cameraManufacturer: 'Apple',
      focalLength: 24,
      aperture: 1.8,
      iso: 100,
      exposureTime: 1 / 120,
      flash: false,
      orientation: 1,
    };

    return exifData;
  } catch (error) {
    console.error('EXIF verisi okunamadı:', error);
    return {};
  }
}

/**
 * EXIF Verilerini Düzenle
 */
export async function editEXIFData(
  photoUri: string,
  newExifData: Partial<EXIFData>
): Promise<string> {
  try {
    const outputPath = EDITING_CACHE_DIR + `exif_edited_${Date.now()}.jpg`;

    // Gerçek uygulamada: piexifjs ile EXIF verisi yazılacak
    // const exif = piexif.load(photoUri);
    // exif["0th"][piexif.ImageIFD.DateTime] = newExifData.dateTime;
    // piexif.insert(exif, outputPath);

    console.log('EXIF verisi düzenleniyor:');
    console.log(`  Tarih/Saat: ${newExifData.dateTime}`);
    console.log(`  Konum: ${newExifData.latitude}, ${newExifData.longitude}`);

    // Simüle edilmiş işlem
    await new Promise(resolve => setTimeout(resolve, 300));
    await FileSystem.copyAsync({
      from: photoUri,
      to: outputPath,
    });

    return outputPath;
  } catch (error) {
    console.error('EXIF düzenleme başarısız:', error);
    throw error;
  }
}

/**
 * EXIF Verilerini Sil (Metadata Stripper)
 */
export async function stripEXIFData(photoUri: string): Promise<string> {
  try {
    const outputPath = EDITING_CACHE_DIR + `stripped_${Date.now()}.jpg`;

    // Gerçek uygulamada: Tüm EXIF verisi silinecek
    console.log('EXIF verisi siliniyor...');

    // Simüle edilmiş işlem
    await new Promise(resolve => setTimeout(resolve, 300));
    await FileSystem.copyAsync({
      from: photoUri,
      to: outputPath,
    });

    return outputPath;
  } catch (error) {
    console.error('EXIF silme başarısız:', error);
    throw error;
  }
}

/**
 * Video Profili (Metadata) Oku
 */
export async function getVideoProfile(videoUri: string): Promise<{
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  codec: string;
  frameRate: number;
  fileSize: number;
}> {
  try {
    // Gerçek uygulamada: FFprobe veya expo-av kullanılacak
    const fileInfo = await FileSystem.getInfoAsync(videoUri, { size: true });

    // Simüle edilmiş video profili
    const profile = {
      duration: Math.floor(Math.random() * 600000) + 5000, // 5s - 10min
      width: 1920,
      height: 1080,
      bitrate: 5000, // kbps
      codec: 'h264',
      frameRate: 30,
      fileSize: (fileInfo as any).size || 0,
    };

    return profile;
  } catch (error) {
    console.error('Video profili alınamadı:', error);
    throw error;
  }
}

/**
 * Fotoğraf Kırpma (Crop)
 */
export async function cropPhoto(
  photoUri: string,
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): Promise<string> {
  try {
    const outputPath = EDITING_CACHE_DIR + `cropped_${Date.now()}.jpg`;

    // Gerçek uygulamada: ImageManipulator.manipulateAsync() kullanılacak
    // const result = await ImageManipulator.manipulateAsync(photoUri, [
    //   { crop: cropArea },
    // ]);

    console.log(`Fotoğraf kırpılıyor: ${cropArea.width}x${cropArea.height}`);

    // Simüle edilmiş işlem
    await new Promise(resolve => setTimeout(resolve, 300));
    await FileSystem.copyAsync({
      from: photoUri,
      to: outputPath,
    });

    return outputPath;
  } catch (error) {
    console.error('Fotoğraf kırpma başarısız:', error);
    throw error;
  }
}

/**
 * Fotoğraf Döndürme (Rotate)
 */
export async function rotatePhoto(
  photoUri: string,
  degrees: number
): Promise<string> {
  try {
    const outputPath = EDITING_CACHE_DIR + `rotated_${Date.now()}.jpg`;

    // Gerçek uygulamada: ImageManipulator.manipulateAsync() kullanılacak
    // const result = await ImageManipulator.manipulateAsync(photoUri, [
    //   { rotate: degrees },
    // ]);

    console.log(`Fotoğraf döndürülüyor: ${degrees}°`);

    // Simüle edilmiş işlem
    await new Promise(resolve => setTimeout(resolve, 300));
    await FileSystem.copyAsync({
      from: photoUri,
      to: outputPath,
    });

    return outputPath;
  } catch (error) {
    console.error('Fotoğraf döndürme başarısız:', error);
    throw error;
  }
}

/**
 * Editing Cache'ini temizle
 */
export async function clearEditingCache(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(EDITING_CACHE_DIR);
    for (const file of files) {
      await FileSystem.deleteAsync(EDITING_CACHE_DIR + file, { idempotent: true });
    }
  } catch (error) {
    console.error('Editing cache temizlenemedi:', error);
  }
}
