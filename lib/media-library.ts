/**
 * Akrep Galeri - Medya Kütüphanesi Entegrasyonu
 * Fotoğraf ve video yönetimi
 */

import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

export interface MediaItem {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  duration?: number;
  width?: number;
  height?: number;
  creationTime: number;
  modificationTime: number;
}

export interface Album {
  id: string;
  title: string;
  assetCount: number;
  type: 'album' | 'smart-album';
}

/**
 * Medya kütüphanesi izinlerini iste
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Medya kütüphanesi izni alınamadı:', error);
    return false;
  }
}

/**
 * Tüm albümleri al
 */
export async function getAllAlbums(): Promise<Album[]> {
  try {
    const albums = await MediaLibrary.getAlbumsAsync();
    return albums.map((album: any) => ({
      id: album.id,
      title: album.title,
      assetCount: album.assetCount,
      type: album.type as 'album' | 'smart-album',
    }));
  } catch (error) {
    console.error('Albümler alınamadı:', error);
    return [];
  }
}

/**
 * Albümdeki medyaları al
 */
export async function getAlbumMedia(
  albumId: string,
  limit: number = 50,
  after?: string
): Promise<{ media: MediaItem[]; endCursor?: string; hasNextPage: boolean }> {
  try {
    const result = await MediaLibrary.getAssetsAsync({
      album: albumId,
      first: limit,
      after,
      mediaType: ['photo', 'video'],
    });

    const media = result.assets.map((asset: any) => ({
      id: asset.id,
      uri: asset.uri,
      type: asset.mediaType as 'photo' | 'video',
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
      creationTime: asset.creationTime,
      modificationTime: asset.modificationTime,
    }));

    return {
      media,
      endCursor: result.endCursor,
      hasNextPage: result.hasNextPage,
    };
  } catch (error) {
    console.error('Albüm medyaları alınamadı:', error);
    return { media: [], hasNextPage: false };
  }
}

/**
 * Son medyaları al
 */
export async function getRecentMedia(limit: number = 20): Promise<MediaItem[]> {
  try {
    const result = await MediaLibrary.getAssetsAsync({
      first: limit,
      mediaType: ['photo', 'video'],
    });

    return result.assets.map((asset: any) => ({
      id: asset.id,
      uri: asset.uri,
      type: asset.mediaType as 'photo' | 'video',
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
      creationTime: asset.creationTime,
      modificationTime: asset.modificationTime,
    }));
  } catch (error) {
    console.error('Son medyalar alınamadı:', error);
    return [];
  }
}

/**
 * Resim seç
 */
export async function pickImage(): Promise<MediaItem | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      return {
        id: asset.assetId || 'temp-' + Date.now(),
        uri: asset.uri,
        type: 'photo',
        width: asset.width || 0,
        height: asset.height || 0,
        creationTime: Date.now(),
        modificationTime: Date.now(),
      };
    }

    return null;
  } catch (error) {
    console.error('Resim seçilemedi:', error);
    return null;
  }
}

/**
 * Video seç
 */
export async function pickVideo(): Promise<MediaItem | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      return {
        id: asset.assetId || 'temp-' + Date.now(),
        uri: asset.uri,
        type: 'video',
        duration: asset.duration || 0,
        width: asset.width || 0,
        height: asset.height || 0,
        creationTime: Date.now(),
        modificationTime: Date.now(),
      };
    }

    return null;
  } catch (error) {
    console.error('Video seçilemedi:', error);
    return null;
  }
}

/**
 * Medya detaylarını al
 */
export async function getMediaDetails(assetId: string): Promise<MediaItem | null> {
  try {
    const assets = await MediaLibrary.getAssetsAsync({ first: 1 });
    const asset = assets.assets.find((a: any) => a.id === assetId);

    if (!asset) return null;

    return {
      id: asset.id,
      uri: asset.uri,
      type: asset.mediaType as 'photo' | 'video',
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
      creationTime: asset.creationTime,
      modificationTime: asset.modificationTime,
    };
  } catch (error) {
    console.error('Medya detayları alınamadı:', error);
    return null;
  }
}

/**
 * Medya sil
 */
export async function deleteMedia(assetIds: string[]): Promise<boolean> {
  try {
    await MediaLibrary.deleteAssetsAsync(assetIds);
    return true;
  } catch (error) {
    console.error('Medya silinemedi:', error);
    return false;
  }
}
