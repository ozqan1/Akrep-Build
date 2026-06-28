import { create } from 'zustand';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export interface MediaAsset {
  id: string;
  uri: string;
  filename: string;
  mediaType: 'photo' | 'video' | 'audio' | 'unknown';
  width: number;
  height: number;
  duration: number;
  creationTime: number;
  modificationTime: number;
  albumId?: string;
}

export interface MediaAlbum {
  id: string;
  title: string;
  assetCount: number;
  coverUri?: string;
}

interface MediaState {
  photos: MediaAsset[];
  videos: MediaAsset[];
  audio: MediaAsset[];
  albums: MediaAlbum[];
  permissionGranted: boolean;
  loading: boolean;
  photosLoading: boolean;
  videosLoading: boolean;
  audioLoading: boolean;
  albumsLoading: boolean;
  error: string | null;
  searchQuery: string;
  requestPermission: () => Promise<boolean>;
  loadPhotos: (refresh?: boolean) => Promise<void>;
  loadVideos: (refresh?: boolean) => Promise<void>;
  loadAudio: (refresh?: boolean) => Promise<void>;
  loadAlbums: () => Promise<void>;
  loadAll: (refresh?: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  getFilteredPhotos: () => MediaAsset[];
  getFilteredVideos: () => MediaAsset[];
  getFilteredAudio: () => MediaAsset[];
}

async function convertAsset(asset: MediaLibrary.Asset, mediaType: 'photo' | 'video' | 'audio' | 'unknown'): Promise<MediaAsset | null> {
  try {
    // expo-media-library Asset'in doğru API'sini kullan
    const uri = asset.uri || '';
    if (!uri) return null;

    return {
      id: asset.id,
      uri,
      filename: asset.filename || 'unknown',
      mediaType,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      duration: asset.duration != null ? asset.duration / 1000 : 0,
      creationTime: asset.creationTime ?? 0,
      modificationTime: asset.modificationTime ?? 0,
    };
  } catch (e) {
    console.error('convertAsset error:', e);
    return null;
  }
}

export const useMediaStore = create<MediaState>((set, get) => ({
  photos: [],
  videos: [],
  audio: [],
  albums: [],
  permissionGranted: false,
  loading: false,
  photosLoading: false,
  videosLoading: false,
  audioLoading: false,
  albumsLoading: false,
  error: null,
  searchQuery: '',

  requestPermission: async () => {
    try {
      console.log('🔐 Medya izni isteniyor...');
      
      // Mevcut izin durumunu kontrol et
      const currentPermission = await MediaLibrary.getPermissionsAsync();
      console.log('📋 Mevcut izin durumu:', currentPermission);

      if (currentPermission?.status === 'granted') {
        console.log('✅ İzin zaten verilmiş');
        set({ permissionGranted: true, error: null });
        return true;
      }

      // İzin iste
      const newPermission = await MediaLibrary.requestPermissionsAsync();
      console.log('📋 İzin isteği sonucu:', newPermission);

      const granted = newPermission?.status === 'granted';
      
      if (granted) {
        console.log('✅ İzin başarıyla verildi');
        set({ permissionGranted: true, error: null });
      } else {
        console.error('❌ İzin reddedildi');
        const errorMsg = 'Medya erişim izni reddedildi. Lütfen Ayarlar > Akrep Galeri > İzinler\'den "Fotoğraflar ve Videolar" iznini verin.';
        set({ permissionGranted: false, error: errorMsg });
        Alert.alert('İzin Gerekli', errorMsg);
      }
      
      return granted;
    } catch (e) {
      console.error('❌ requestPermission hatası:', e);
      const errorMsg = `İzin hatası: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`;
      set({ permissionGranted: false, error: errorMsg });
      return false;
    }
  },

  loadPhotos: async (refresh = false) => {
    const { permissionGranted } = get();
    
    if (!permissionGranted) {
      console.warn('⚠️ loadPhotos: izin verilmemiş');
      return;
    }

    set({ photosLoading: true, error: null });
    try {
      console.log('📷 Fotoğraflar yükleniyor...');
      
      // Tüm fotoğrafları getir
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 1000,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      console.log(`✅ ${assets.assets.length} fotoğraf bulundu`);

      const convertedAssets: MediaAsset[] = [];
      for (const asset of assets.assets) {
        const converted = await convertAsset(asset, 'photo');
        if (converted) {
          convertedAssets.push(converted);
        }
      }

      console.log(`✅ ${convertedAssets.length} fotoğraf işlendi`);
      set({ photos: convertedAssets, photosLoading: false });
    } catch (e) {
      console.error('❌ loadPhotos hatası:', e);
      const errorMsg = `Fotoğraf yükleme hatası: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`;
      set({ photosLoading: false, error: errorMsg });
    }
  },

  loadVideos: async (refresh = false) => {
    const { permissionGranted } = get();
    
    if (!permissionGranted) {
      console.warn('⚠️ loadVideos: izin verilmemiş');
      return;
    }

    set({ videosLoading: true, error: null });
    try {
      console.log('🎬 Videolar yükleniyor...');
      
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 1000,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      console.log(`✅ ${assets.assets.length} video bulundu`);

      const convertedAssets: MediaAsset[] = [];
      for (const asset of assets.assets) {
        const converted = await convertAsset(asset, 'video');
        if (converted) {
          convertedAssets.push(converted);
        }
      }

      console.log(`✅ ${convertedAssets.length} video işlendi`);
      set({ videos: convertedAssets, videosLoading: false });
    } catch (e) {
      console.error('❌ loadVideos hatası:', e);
      const errorMsg = `Video yükleme hatası: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`;
      set({ videosLoading: false, error: errorMsg });
    }
  },

  loadAudio: async (refresh = false) => {
    const { permissionGranted } = get();
    
    if (!permissionGranted) {
      console.warn('⚠️ loadAudio: izin verilmemiş');
      return;
    }

    set({ audioLoading: true, error: null });
    try {
      console.log('🎵 Ses dosyaları yükleniyor...');
      
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 1000,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      console.log(`✅ ${assets.assets.length} ses dosyası bulundu`);

      const convertedAssets: MediaAsset[] = [];
      for (const asset of assets.assets) {
        const converted = await convertAsset(asset, 'audio');
        if (converted) {
          convertedAssets.push(converted);
        }
      }

      console.log(`✅ ${convertedAssets.length} ses dosyası işlendi`);
      set({ audio: convertedAssets, audioLoading: false });
    } catch (e) {
      console.error('❌ loadAudio hatası:', e);
      const errorMsg = `Ses dosyası yükleme hatası: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`;
      set({ audioLoading: false, error: errorMsg });
    }
  },

  loadAlbums: async () => {
    const { permissionGranted } = get();
    
    if (!permissionGranted) {
      console.warn('⚠️ loadAlbums: izin verilmemiş');
      return;
    }

    set({ albumsLoading: true, error: null });
    try {
      console.log('📚 Albümler yükleniyor...');
      
      const albums = await MediaLibrary.getAlbumsAsync();
      console.log(`✅ ${albums.length} albüm bulundu`);

      const convertedAlbums: MediaAlbum[] = [];
      
      for (const album of albums) {
        try {
          const assets = await MediaLibrary.getAssetsAsync({ album });
          
          if (assets.assets.length > 0) {
            const firstAssetUri = assets.assets[0].uri;
            convertedAlbums.push({
              id: album.id,
              title: album.title,
              assetCount: assets.assets.length,
              coverUri: firstAssetUri || undefined,
            });
          }
        } catch (e) {
          console.error(`Albüm ${album.id} yüklenirken hata:`, e);
        }
      }

      console.log(`✅ ${convertedAlbums.length} albüm işlendi`);
      set({ albums: convertedAlbums, albumsLoading: false });
    } catch (e) {
      console.error('❌ loadAlbums hatası:', e);
      const errorMsg = `Albüm yükleme hatası: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`;
      set({ albumsLoading: false, error: errorMsg });
    }
  },

  loadAll: async (refresh = false) => {
    set({ loading: true, error: null });
    const { requestPermission, loadPhotos, loadVideos, loadAudio, loadAlbums } = get();

    try {
      console.log('🚀 Tüm medya yükleniyor...');
      
      const granted = await requestPermission();
      if (!granted) {
        console.error('❌ İzin verilmediği için medya yüklenemedi');
        set({ loading: false });
        return;
      }

      await Promise.all([
        loadPhotos(refresh),
        loadVideos(refresh),
        loadAudio(refresh),
        loadAlbums(),
      ]);

      console.log('✅ Tüm medya başarıyla yüklendi');
    } catch (e) {
      console.error('❌ loadAll hatası:', e);
      const errorMsg = `Medya yükleme hatası: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`;
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  getFilteredPhotos: () => {
    const { photos, searchQuery } = get();
    if (!searchQuery) return photos;
    return photos.filter(p => p.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  },

  getFilteredVideos: () => {
    const { videos, searchQuery } = get();
    if (!searchQuery) return videos;
    return videos.filter(v => v.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  },

  getFilteredAudio: () => {
    const { audio, searchQuery } = get();
    if (!searchQuery) return audio;
    return audio.filter(a => a.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  },
}));
